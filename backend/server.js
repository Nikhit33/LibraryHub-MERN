
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const Book = require('./models/Book');
const User = require('./models/User');
const Transaction = require('./models/Transaction')
const Reservation = require('./models/Reservation');
const Settings = require('./models/Settings');
const EmailReminder = require('./models/EmailReminder');
const nodemailer = require('nodemailer');

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const authMiddleware = require('./middleware/authMiddleware');
const roleMiddleware = require('./middleware/roleMiddleware');

const app = express();

app.use(cors());
app.use(express.json());



mongoose.connect(process.env.MONGO_URI, { //Connects to MongoDB using the connection string from environment variables
    dbName: 'libraryDB'
})
    .then(async () => {
        console.log('MongoDB Connected Successfully!');

        try {
            const settings = await Settings.findOne();

            if (!settings) {
                await Settings.create({
                    loanPeriodDays: 14,
                    finePerDay: 5,
                    maxBooksPerMember: 3,
                    maxUnpaidFine: 50
                });

                console.log('Default library settings created');
            }
        } catch (error) {
            console.error('Settings setup error:', error.message);
        }
    })
    .catch((error) => {
        console.error('MongoDB Connection Error:', error.message);
    });


app.get('/', (req, res) => {
    res.send('Library Management System Backend is Running!');
});

app.get('/api/settings',
    authMiddleware,
    roleMiddleware('admin'),
    async (req, res) => {
        try {
            const settings = await Settings.findOne();

            if (!settings) {
                return res.status(404).json({
                    message: 'Library settings not found'
                });
            }

            res.status(200).json(settings);
        } catch (error) {
            console.error('Settings error:', error);
            res.status(500).json({
                message: 'Failed to fetch library settings'
            });
        }
    }
);


app.put('/api/settings',
    authMiddleware,
    roleMiddleware('admin'),
    async (req, res) => {
        try {
            const {
                loanPeriodDays,
                finePerDay,
                maxBooksPerMember,
                maxUnpaidFine
            } = req.body;

            const values = {
                loanPeriodDays,
                finePerDay,
                maxBooksPerMember,
                maxUnpaidFine
            };

            for (const value of Object.values(values)) {
                if (typeof value !== 'number' ||
                    !Number.isFinite(value) ||
                    value < 0) {
                    return res.status(400).json({
                        message: 'All settings must be valid non-negative numbers'
                    });
                }
            }

            if (!Number.isInteger(loanPeriodDays) ||
                loanPeriodDays < 1 ||
                !Number.isInteger(maxBooksPerMember) ||
                maxBooksPerMember < 1) {
                return res.status(400).json({
                    message: 'Loan period and borrowing limit must be positive whole numbers'
                });
            }

            const settings = await Settings.findOne();

            if (!settings) {
                return res.status(404).json({
                    message: 'Library settings not found'
                });
            }

            settings.loanPeriodDays = loanPeriodDays;
            settings.finePerDay = finePerDay;
            settings.maxBooksPerMember = maxBooksPerMember;
            settings.maxUnpaidFine = maxUnpaidFine;

            await settings.save();

            res.status(200).json({
                message: 'Library settings updated successfully',
                settings
            });
        } catch (error) {
            console.error('Update settings error:', error);
            res.status(500).json({
                message: 'Failed to update library settings'
            });
        }
    }
);
function validateBookInput(data) {
    const allowedFields = [
        'title', 'author', 'isbn', 'category',
        'publisher', 'year', 'coverImage', 'totalCopies'
    ];

    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        return { error: 'Invalid book data' };
    }

    const fields = Object.keys(data);

    if (fields.length === 0 ||
        fields.some(field => !allowedFields.includes(field))) {
        return { error: 'Invalid or unsupported book fields' };
    }

    const bookData = {};

    for (const field of fields) {
        const value = data[field];

        if (['title', 'author', 'isbn', 'category', 'publisher', 'coverImage'].includes(field)) {
            if (typeof value !== 'string' || !value.trim() || value.length > 500) {
                return { error: `Invalid ${field}` };
            }

            bookData[field] = value.trim();
        } else if (field === 'year') {
            if (!Number.isInteger(value) || value < 0 || value > 2100) {
                return { error: 'Invalid publication year' };
            }

            bookData[field] = value;
        } else if (field === 'totalCopies') {
            if (!Number.isInteger(value) || value < 0) {
                return { error: 'Total copies must be a non-negative whole number' };
            }

            bookData[field] = value;
        }
    }

    return { bookData };
}
function escapeRegex(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// GET: View and search books (public)
app.get('/api/books', async (req, res) => {
    try {
        const search = req.query.search || '';
        const category = req.query.category || '';

        if (
            typeof search !== 'string' ||
            typeof category !== 'string' ||
            search.length > 100 ||
            category.length > 100
        ) {
            return res.status(400).json({
                message: 'Invalid search or category'
            });
        }

        const safeSearch = escapeRegex(search.trim());

        const filter = {
            $or: [
                { title: { $regex: safeSearch, $options: 'i' } },
                { author: { $regex: safeSearch, $options: 'i' } },
                { isbn: { $regex: safeSearch, $options: 'i' } }
            ]
        };

        if (category) {
            filter.category = category;
        }


        const books = await Book.find(filter).lean();

        const bookIds = books.map(book => book._id);

        const activeTransactions = await Transaction.find({
            book: { $in: bookIds },
            status: { $in: ['issued', 'overdue'] }
        })
            .select('book dueDate')
            .lean();

        const earliestDueDates = new Map();

        for (const transaction of activeTransactions) {
            if (!transaction.dueDate) continue;

            const bookId = transaction.book.toString();
            const dueDate = new Date(transaction.dueDate);

            if (
                !earliestDueDates.has(bookId) ||
                dueDate < earliestDueDates.get(bookId)
            ) {
                earliestDueDates.set(bookId, dueDate);
            }
        }

        const booksWithDates = books.map(book => ({
            ...book,
            expectedReturnDate:
                earliestDueDates.get(book._id.toString()) || null
        }));

        res.json(booksWithDates);


    } catch (error) {
        res.status(500).json({
            message: 'Error fetching books',
            error: error.message
        });
    }
});

app.post('/api/books', authMiddleware, roleMiddleware('admin', 'librarian'), async (req, res) => {
    try {
        const { error, bookData } = validateBookInput(req.body);

        if (error) {
            return res.status(400).json({ message: error });
        }

        const newBook = new Book(bookData);
        const savedBook = await newBook.save();

        res.status(201).json(savedBook);

    } catch (error) {
        res.status(400).json({
            message: 'Could not save book',
            error: error.message
        });
    }
}
);

app.put('/api/books/:id', authMiddleware, roleMiddleware('admin', 'librarian'), async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                message: 'Invalid book ID'
            });
        }

        const { error, bookData } = validateBookInput(req.body);

        if (error) {
            return res.status(400).json({
                message: error
            });
        }

        const existingBook = await Book.findById(req.params.id);

        if (!existingBook) {
            return res.status(404).json({
                message: 'Book not found'
            });
        }

        const updatedData = { ...bookData };

        if (bookData.totalCopies !== undefined) {
            const borrowedCopies =
                existingBook.totalCopies - existingBook.availableCopies;

            if (bookData.totalCopies < borrowedCopies) {
                return res.status(400).json({
                    message: 'Total copies cannot be less than borrowed copies'
                });
            }

            const newAvailableCopies =
                bookData.totalCopies - borrowedCopies;

            updatedData.availableCopies = newAvailableCopies;
        }

        const filter = {
            _id: req.params.id,
            totalCopies: existingBook.totalCopies,
            availableCopies: existingBook.availableCopies
        };

        const updatedBook = await Book.findOneAndUpdate(
            filter,
            { $set: updatedData },
            {
                returnDocument: 'after',
                runValidators: true
            }
        );

        if (!updatedBook) {
            return res.status(409).json({
                message: 'Book inventory changed. Please try again.'
            });
        }

        res.json(updatedBook);

    } catch (error) {
        res.status(400).json({
            message: 'Could not update book',
            error: error.message
        });
    }
});

app.delete('/api/books/:id', authMiddleware, roleMiddleware('admin', 'librarian'), async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);

        if (!book) {
            return res.status(404).json({
                message: 'Book not found'
            });
        }

        if (book.availableCopies < book.totalCopies) {
            return res.status(400).json({
                message: 'Cannot delete book because some copies are borrowed'
            });
        }



        const existingTransaction = await Transaction.findOne({
            book: req.params.id
        });

        if (existingTransaction) {
            return res.status(400).json({
                message: 'Cannot delete this book because it has borrowing history'
            });
        }

        await Book.findByIdAndDelete(req.params.id);

        res.json({
            message: 'Book deleted successfully'
        });

    } catch (error) {
        res.status(400).json({
            message: 'Could not delete book',
            error: error.message
        });
    }
});


app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (
            typeof name !== 'string' ||
            typeof email !== 'string' ||
            typeof password !== 'string' ||
            !name.trim() ||
            !email.trim() ||
            password.length < 8
        ) {
            return res.status(400).json({
                message: 'Enter a name, email, and password of at least 8 characters'
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const existingUser = await User.findOne({
            email: normalizedEmail
        });

        if (existingUser) {
            return res.status(409).json({
                message: 'Email already registered'
            });
        }


        const hashedPassword = await bcrypt.hash(password, 10);// bcrypt hashes the password


        const newUser = new User({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            role: 'member'
        }); //All new users are taken as members by default

        await newUser.save();

        newUser.memberId = `LIB-${newUser._id.toString().slice(-8).toUpperCase()}`;
        await newUser.save();

        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                memberId: newUser.memberId
            }
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                message: 'Email already registered'
            });
        }

        console.error('Registration error:', error);

        res.status(500).json({
            message: 'Registration failed'
        });
    }
});


app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (
            typeof email !== 'string' ||
            typeof password !== 'string' ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                message: 'Email and password are required'
            });
        }

        const user = await User.findOne({
            email: email.trim().toLowerCase()
        }).select('+password');

        if (!user) {
            return res.status(401).json({
                message: 'Invalid email or password'
            });
        }

        const isMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!isMatch) {
            return res.status(401).json({
                message: 'Invalid email or password'
            });
        }
        if (user.isActive === false) {
            return res.status(403).json({
                message: 'Your account has been deactivated. Contact the administrator.'
            });
        }

        if (!process.env.JWT_SECRET) {
            return res.status(500).json({
                message: 'Login is temporarily unavailable'
            });
        }

        const token = jwt.sign(
            { userId: user._id.toString() },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                memberId: user.memberId,
                isActive: user.isActive
            }
        });

    } catch (error) {
        console.error('Login error:', error);

        res.status(500).json({
            message: 'Login failed'
        });
    }
});


app.get('/api/members', authMiddleware, roleMiddleware('admin', 'librarian'), async (req, res) => {
    try {
        const members = await User.find({ role: 'member' })
            .select('name email')
            .sort({ name: 1 });

        res.json(members);

    } catch (error) {
        console.log('Error loading members:', error);

        res.status(500).json({
            message: 'Could not load members'
        });
    }
});


app.get('/api/profile', authMiddleware, (req, res) => {
    res.status(200).json({
        message: 'Protected route accessed successfully',
        user: {
            id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            role: req.user.role,
            phone: req.user.phone || ''
        }
    });
});
// Update the logged-in user's profile
app.put('/api/profile', authMiddleware, async (req, res) => {
    try {
        const { name, phone } = req.body;

        if (
            typeof name !== 'string' ||
            !name.trim() ||
            name.trim().length > 100
        ) {
            return res.status(400).json({
                message: 'Enter a valid name'
            });
        }

        if (
            typeof phone !== 'string' ||
            (phone.trim() && !/^[0-9+\-\s()]{7,20}$/.test(phone.trim()))
        ) {
            return res.status(400).json({
                message: 'Enter a valid phone number'
            });
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            {
                $set: {
                    name: name.trim(),
                    phone: phone.trim()
                }
            },
            {
                returnDocument: 'after',
                runValidators: true
            }
        );

        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        res.json({
            message: 'Profile updated successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone || ''
            }
        });

    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({
            message: 'Could not update profile'
        });
    }
});

// Change the logged-in user's password
app.put('/api/profile/password', authMiddleware, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (
            typeof currentPassword !== 'string' ||
            typeof newPassword !== 'string' ||
            newPassword.length < 8 ||
            newPassword.length > 128
        ) {
            return res.status(400).json({
                message: 'New password must contain 8 to 128 characters'
            });
        }

        const user = await User.findById(req.user._id)
            .select('+password');

        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        const passwordMatches = await bcrypt.compare(
            currentPassword,
            user.password
        );

        if (!passwordMatches) {
            return res.status(401).json({
                message: 'Current password is incorrect'
            });
        }

        if (currentPassword === newPassword) {
            return res.status(400).json({
                message: 'New password must be different'
            });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        res.json({
            message: 'Password changed successfully'
        });

    } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({
            message: 'Could not change password'
        });
    }
});


app.get('/api/users', authMiddleware, roleMiddleware('admin'), async (req, res) => {
    try {
        const users = await User.find()
            .select('name email role')
            .sort({ name: 1 });

        res.json(users);

    } catch (error) {
        console.log('Error loading users:', error);

        res.status(500).json({
            message: 'Could not load users'
        });
    }
});


app.get('/api/admin-test', authMiddleware, roleMiddleware('admin'), (req, res) => {
    res.status(200).json({
        message: 'Welcome, Admin! You have permission to access this route.'
    });
}
);


app.get('/api/transactions/my', authMiddleware, async (req, res) => {
    try {
        const transactions = await Transaction.find({
            member: req.user._id
        })
            .populate('book', 'title author')
            .sort({ issueDate: -1 });

        res.json(transactions);

    } catch (error) {
        console.log('Error loading transactions:', error);

        res.status(500).json({
            message: 'Could not load borrowing records'
        });
    }
});

app.get('/api/transactions', authMiddleware, roleMiddleware('admin', 'librarian'), async (req, res) => {
    try {
        const transactions = await Transaction.find()
            .populate('book', 'title author')
            .populate('member', 'name email')
            .sort({ issueDate: -1 });

        res.json(transactions);

    } catch (error) {
        console.log('Error loading all transactions:', error);

        res.status(500).json({
            message: 'Could not load borrowing records'
        });
    }
});




app.post('/api/transactions/issue', authMiddleware, roleMiddleware('admin', 'librarian'), async (req, res) => {
    const { bookId, memberId } = req.body;

    if (!mongoose.isValidObjectId(bookId) || !mongoose.isValidObjectId(memberId)) {
        return res.status(400).json({
            message: 'Valid bookId and memberId are required'
        });
    }

    let session;

    try {
        session = await mongoose.startSession();
        let result;

        await session.withTransaction(async () => {
            const member = await User.findById(memberId).session(session);

            if (!member || member.role !== 'member') {
                const error = new Error('Borrower must be a registered member');
                error.status = 400;
                throw error;
            }

            const settings = await Settings.findOne().session(session);

            if (!settings) {
                const error = new Error('Library settings are unavailable');
                error.status = 503;
                throw error;
            }

            const unpaidFines = await Transaction.aggregate([
                {
                    $match: {
                        member: member._id,
                        finePaid: false,
                        fineAmount: { $gt: 0 }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$fineAmount' }
                    }
                }
            ]).session(session);

            const totalUnpaidFine = unpaidFines.length > 0
                ? unpaidFines[0].total
                : 0;

            if (totalUnpaidFine > settings.maxUnpaidFine) {
                const error = new Error(
                    'Member cannot borrow books because unpaid fines exceed the allowed limit'
                );
                error.status = 403;
                throw error;
            }


            const activeBorrowings = await Transaction.countDocuments({
                member: memberId,
                status: { $in: ['issued', 'overdue'] }
            }).session(session);


            if (activeBorrowings >= settings.maxBooksPerMember) {
                const error = new Error('Member has reached the borrowing limit');
                error.status = 400;
                throw error;
            }


            const existingBorrowing = await Transaction.findOne({
                book: bookId,
                member: memberId,
                status: { $in: ['issued', 'overdue'] }
            }).session(session);

            if (existingBorrowing) {
                const error = new Error('Member has already borrowed this book');
                error.status = 409;
                throw error;
            }


            const reservedCopy = await Reservation.findOne({
                book: bookId,
                member: memberId,
                status: 'available',
                expiresAt: { $gt: new Date() }
            }).session(session);

            if (!reservedCopy) {
                const bookDetails = await Book.findById(bookId).session(session);

                if (!bookDetails) {
                    const error = new Error('Book not found');
                    error.status = 404;
                    throw error;
                }

                const activeReservations = await Reservation.countDocuments({
                    book: bookId,
                    status: 'available',
                    expiresAt: { $gt: new Date() }
                }).session(session);

                if (bookDetails.availableCopies <= activeReservations) {
                    const error = new Error('All available copies are reserved for other members');
                    error.status = 409;
                    throw error;
                }
            }


            const book = await Book.findOneAndUpdate(
                {
                    _id: bookId,
                    availableCopies: { $gt: 0 }
                },
                {
                    $inc: { availableCopies: -1 }
                },
                {
                    returnDocument: 'after',
                    session
                }
            );

            if (!book) {
                const error = new Error('Book not found or no copies available');
                error.status = 400;
                throw error;
            }

            const issueDate = new Date();

            const dueDate = new Date(issueDate);
            dueDate.setDate(dueDate.getDate() + settings.loanPeriodDays);


            const [transaction] = await Transaction.create(
                [{
                    book: book._id,
                    member: member._id,
                    issuedBy: req.user._id,
                    issueDate,
                    dueDate,
                    status: 'issued'
                }],
                { session }
            );

            if (reservedCopy) {
                const fulfilledReservation = await Reservation.findOneAndUpdate(
                    {
                        _id: reservedCopy._id,
                        member: member._id,
                        status: 'available',
                        expiresAt: { $gt: new Date() }
                    },
                    {
                        $set: {
                            status: 'fulfilled',
                            expiresAt: null
                        }
                    },
                    {
                        returnDocument: 'after',
                        session
                    }
                );

                if (!fulfilledReservation) {
                    const error = new Error('Reservation is no longer available');
                    error.status = 409;
                    throw error;
                }
            }

            result = {
                message: 'Book issued successfully',
                transaction,
                availableCopies: book.availableCopies
            };
        });

        return res.status(201).json(result);

    } catch (error) {
        console.error('Book issuing error:', error);

        return res.status(error.status || 500).json({
            message: error.status ? error.message : 'Failed to issue book'
        });

    } finally {
        if (session) {
            await session.endSession();
        }
    }
});


app.post('/api/transactions/:id/return',
    authMiddleware,
    roleMiddleware('admin', 'librarian'),
    async (req, res) => {

        const transactionId = req.params.id;

        if (!mongoose.isValidObjectId(transactionId)) {
            return res.status(400).json({
                message: 'Invalid transaction ID'
            });
        }

        let session;

        try {
            session = await mongoose.startSession();

            let result;

            await session.withTransaction(async () => {
                const transaction = await Transaction.findById(
                    transactionId
                ).session(session);

                if (!transaction) {
                    const error = new Error('Transaction not found');
                    error.status = 404;
                    throw error;
                }

                if (!['issued', 'overdue'].includes(transaction.status)) {
                    const error = new Error('This book has already been returned');
                    error.status = 409;
                    throw error;
                }

                const settings = await Settings.findOne().session(session);

                if (!settings) {
                    const error = new Error('Library settings not found');
                    error.status = 503;
                    throw error;
                }

                const returnDate = new Date();

                const overdueMilliseconds =
                    returnDate.getTime() - transaction.dueDate.getTime();

                const overdueDays = Math.max(
                    0,
                    Math.ceil(overdueMilliseconds / (1000 * 60 * 60 * 24))
                );

                const fineAmount = overdueDays * settings.finePerDay;

                const updatedTransaction = await Transaction.findOneAndUpdate(
                    {
                        _id: transactionId,
                        status: { $in: ['issued', 'overdue'] }
                    },
                    {
                        $set: {
                            status: 'returned',
                            returnDate,
                            fineAmount,
                            finePaid: fineAmount === 0
                        }
                    },
                    {
                        returnDocument: 'after',
                        runValidators: true,
                        session
                    }
                );

                if (!updatedTransaction) {
                    const error = new Error('Transaction was already returned');
                    error.status = 409;
                    throw error;
                }

                const updatedBook = await Book.findOneAndUpdate(
                    {
                        _id: transaction.book,
                        $expr: {
                            $lt: ['$availableCopies', '$totalCopies']
                        }
                    },
                    {
                        $inc: { availableCopies: 1 }
                    },
                    {
                        returnDocument: 'after',
                        session
                    }
                );

                if (!updatedBook) {
                    const error = new Error('Could not update book inventory');
                    error.status = 409;
                    throw error;
                }

                result = {
                    message: 'Book returned successfully',
                    transaction: updatedTransaction,
                    availableCopies: updatedBook.availableCopies,
                    overdueDays,
                    fineAmount
                };
            });

            // Activate the next reservation after the return is committed.
            try {
                await activateNextReservation(result.transaction.book);
            } catch (error) {
                console.error('Could not activate next reservation:', error);
            }

            return res.status(200).json(result);

        } catch (error) {
            console.error('Book return error:', error);

            return res.status(error.status || 500).json({
                message: error.status
                    ? error.message
                    : 'Failed to return book'
            });

        } finally {
            if (session) {
                await session.endSession();
            }
        }
    }
);
app.post('/api/transactions/:id/renew', authMiddleware, roleMiddleware('admin', 'librarian', 'member'), async (req, res) => {
    try {
        const transactionId = req.params.id;

        if (!mongoose.isValidObjectId(transactionId)) {
            return res.status(400).json({
                message: 'Invalid transaction ID'
            });
        }

        const transaction = await Transaction.findById(transactionId);

        if (!transaction) {
            return res.status(404).json({
                message: 'Transaction not found'
            });
        }

        // Members can renew only their own books.
        if (req.user.role === 'member' &&
            transaction.member.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                message: 'You can renew only your own books'
            });
        }

        if (transaction.status !== 'issued') {
            return res.status(409).json({
                message: 'Only active, non-overdue books can be renewed'
            });
        }

        if (transaction.renewCount >= 1) {
            return res.status(409).json({
                message: 'Renewal limit reached'
            });
        }

        if (new Date() > transaction.dueDate) {
            return res.status(409).json({
                message: 'Overdue books cannot be renewed'
            });
        }

        const waitingReservation = await Reservation.findOne({
            book: transaction.book,
            member: { $ne: transaction.member },
            status: { $in: ['pending', 'available'] }
        });

        if (waitingReservation) {
            return res.status(409).json({
                message: 'Cannot renew because another member has reserved this book'
            });
        }
        const settings = await Settings.findOne();

        if (!settings) {
            return res.status(503).json({
                message: 'Library settings not found'
            });
        }

        const newDueDate = new Date(transaction.dueDate);

        newDueDate.setUTCDate(
            newDueDate.getUTCDate() + settings.loanPeriodDays
        );

        // Conditional update prevents a second renewal.
        const renewedTransaction = await Transaction.findOneAndUpdate(
            {
                _id: transactionId,
                status: 'issued',
                renewCount: 0,
                dueDate: { $gte: new Date() }
            },
            {
                $set: { dueDate: newDueDate },
                $inc: { renewCount: 1 }
            },
            {
                returnDocument: 'after',
                runValidators: true
            }
        );

        if (!renewedTransaction) {
            return res.status(409).json({
                message: 'Transaction is no longer eligible for renewal'
            });
        }

        return res.status(200).json({
            message: 'Book renewed successfully',
            transaction: renewedTransaction
        });

    } catch (error) {
        console.error('Book renewal error:', error);

        return res.status(500).json({
            message: 'Failed to renew book'
        });
    }
});


app.patch('/api/transactions/:id/pay-fine',
    authMiddleware,
    roleMiddleware('admin', 'librarian'),
    async (req, res) => {
        try {
            const transactionId = req.params.id;

            if (!mongoose.isValidObjectId(transactionId)) {
                return res.status(400).json({
                    message: 'Invalid transaction ID'
                });
            }

            const transaction = await Transaction.findOneAndUpdate(
                {
                    _id: transactionId,
                    status: 'returned',
                    fineAmount: { $gt: 0 },
                    finePaid: false
                },
                {
                    $set: { finePaid: true }
                },
                {
                    returnDocument: 'after',
                    runValidators: true
                }
            );

            if (!transaction) {
                return res.status(409).json({
                    message: 'No unpaid fine found for this returned transaction'
                });
            }

            res.status(200).json({
                message: 'Fine marked as paid successfully',
                transaction
            });

        } catch (error) {
            console.error('Fine payment error:', error);

            res.status(500).json({
                message: 'Failed to update fine payment'
            });
        }
    }
);


app.post('/api/reservations', authMiddleware, roleMiddleware('member'), async (req, res) => {
    try {
        const { bookId } = req.body;

        if (!mongoose.isValidObjectId(bookId)) {
            return res.status(400).json({
                message: 'Invalid book ID'
            });
        }

        const book = await Book.findById(bookId);

        if (!book) {
            return res.status(404).json({
                message: 'Book not found'
            });
        }

        if (book.availableCopies > 0) {
            return res.status(400).json({
                message: 'This book is available. You can borrow it instead.'
            });
        }

        const existingReservation = await Reservation.findOne({
            book: bookId,
            member: req.user._id,
            status: { $in: ['pending', 'available'] }
        });

        if (existingReservation) {
            return res.status(409).json({
                message: 'You already have an active reservation for this book'
            });
        }

        const reservation = await Reservation.create({
            book: bookId,
            member: req.user._id
        });

        res.status(201).json({
            message: 'Book reserved successfully',
            reservation
        });

    } catch (error) {
        console.error('Reservation error:', error);

        res.status(500).json({
            message: 'Failed to reserve book'
        });
    }
});


app.get('/api/reservations/my', authMiddleware, async (req, res) => {
    try {
        const reservations = await Reservation.find({
            member: req.user._id
        })
            .populate('book', 'title author')
            .sort({ reservedAt: -1 });

        res.status(200).json(reservations);

    } catch (error) {
        console.error('Error loading reservations:', error);

        res.status(500).json({
            message: 'Could not load reservations'
        });
    }
});


app.patch('/api/reservations/:id/cancel', authMiddleware, roleMiddleware('member'), async (req, res) => {
    try {
        const reservationId = req.params.id;

        if (!mongoose.isValidObjectId(reservationId)) {
            return res.status(400).json({
                message: 'Invalid reservation ID'
            });
        }

        const reservation = await Reservation.findOneAndUpdate(
            {
                _id: reservationId,
                member: req.user._id,
                status: { $in: ['pending', 'available'] }
            },
            {
                $set: { status: 'cancelled' }
            },
            {
                returnDocument: 'after',
                runValidators: true
            }
        );


        if (!reservation) {
            return res.status(404).json({
                message: 'Active reservation not found'
            });
        }

        if (reservation.expiresAt) {
            await activateNextReservation(reservation.book);
        }

        res.status(200).json({
            message: 'Reservation cancelled successfully',
            reservation
        });

    } catch (error) {
        console.error('Reservation cancellation error:', error);

        res.status(500).json({
            message: 'Failed to cancel reservation'
        });
    }
});






const reservationQueues = new Map();

async function activateNextReservation(bookId) {
    const key = bookId.toString();
    const previous = reservationQueues.get(key) || Promise.resolve();

    let release;
    const current = new Promise((resolve) => {
        release = resolve;
    });

    reservationQueues.set(key, current);
    await previous;

    try {
        const book = await Book.findById(bookId);

        if (!book || book.availableCopies <= 0) {
            return null;
        }

        const reservedCopies = await Reservation.countDocuments({
            book: bookId,
            status: 'available'
        });

        if (reservedCopies >= book.availableCopies) {
            return null;
        }

        const nextReservation = await Reservation.findOneAndUpdate(
            {
                book: bookId,
                status: 'pending'
            },
            {
                $set: {
                    status: 'available',
                    expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000)
                }
            },
            {
                sort: { reservedAt: 1, _id: 1 },
                returnDocument: 'after'
            }
        );

        if (nextReservation) {
            console.log('Next reservation activated:', nextReservation._id);
        }

        return nextReservation;
    } finally {
        release();

        if (reservationQueues.get(key) === current) {
            reservationQueues.delete(key);
        }
    }
}

// Check expired reservations and update the waiting queue


async function checkExpiredReservations() {
    try {
        const now = new Date();

        console.log('Checking reservation expiry at:', now);

        const expiredReservations = await Reservation.find({
            status: 'available',
            expiresAt: { $lte: now }
        });

        console.log('Expired reservations found:', expiredReservations.length);

        for (const reservation of expiredReservations) {
            const updatedReservation = await Reservation.findOneAndUpdate(
                {
                    _id: reservation._id,
                    status: 'available',
                    expiresAt: { $lte: new Date() }
                },
                {
                    $set: {
                        status: 'expired'
                    }
                },
                {
                    returnDocument: 'after'
                }
            );

            if (!updatedReservation) {
                continue;
            }

            console.log('Reservation expired:', updatedReservation._id);

            await activateNextReservation(updatedReservation.book);
        }

    } catch (error) {
        console.error('Reservation expiry check error:', error);
    }
}



let expiryCheckRunning = false;

async function runExpiryCheck() {
    if (expiryCheckRunning) {
        return;
    }

    expiryCheckRunning = true;

    try {
        await checkExpiredReservations();
    } finally {
        expiryCheckRunning = false;
    }
}

mongoose.connection.once('open', () => {
    runExpiryCheck();

    setInterval(runExpiryCheck, 60 * 1000);
});

/* AUTOMATIC EMAIL REMINDERS */

let reminderCheckRunning = false;

async function checkEmailReminders() {
    if (reminderCheckRunning) return;

    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
        return;
    }

    reminderCheckRunning = true;

    try {
        const transporter = nodemailer.createTransport({
            host: SMTP_HOST,
            port: Number(SMTP_PORT),
            secure: Number(SMTP_PORT) === 465,
            auth: {
                user: SMTP_USER,
                pass: SMTP_PASS
            }
        });

        const today = new Date();
        const todayUTC = Date.UTC(
            today.getUTCFullYear(),
            today.getUTCMonth(),
            today.getUTCDate()
        );

        const dateKey = today.toISOString().slice(0, 10);

        const transactions = await Transaction.find({
            status: { $in: ['issued', 'overdue'] }
        })
            .populate('member', 'name email')
            .populate('book', 'title');

        for (const transaction of transactions) {
            if (!transaction.member?.email || !transaction.dueDate) {
                continue;
            }

            const dueDate = new Date(transaction.dueDate);
            const dueUTC = Date.UTC(
                dueDate.getUTCFullYear(),
                dueDate.getUTCMonth(),
                dueDate.getUTCDate()
            );

            const daysLeft = Math.round(
                (dueUTC - todayUTC) / (1000 * 60 * 60 * 24)
            );

            let type;
            let subject;
            let message;

            if (daysLeft === 2) {
                type = 'due-soon';
                subject = 'LibraryHub - Book Due Soon';
                message = `Hello ${transaction.member.name},

Your borrowed book "${transaction.book?.title || 'Unknown Book'}"
is due on ${dueDate.toLocaleDateString('en-IN')}.

Please return or renew it before the due date.

LibraryHub`;
            } else if (daysLeft < 0) {
                type = 'overdue';
                subject = 'LibraryHub - Overdue Book Reminder';
                message = `Hello ${transaction.member.name},

Your borrowed book "${transaction.book?.title || 'Unknown Book'}"
was due on ${dueDate.toLocaleDateString('en-IN')}.

Please return it as soon as possible to avoid additional fines.

LibraryHub`;
            } else {
                continue;
            }

            let reminder;

            try {
                reminder = await EmailReminder.create({
                    transaction: transaction._id,
                    type,
                    date: dateKey
                });
            } catch (error) {
                if (error.code === 11000) {
                    continue;
                }
                throw error;
            }

            try {
                await transporter.sendMail({
                    from: SMTP_USER,
                    to: transaction.member.email,
                    subject,
                    text: message
                });

                reminder.sentAt = new Date();
                await reminder.save();

                console.log('Reminder sent:', transaction._id, type);
            } catch (error) {
                console.error('Email delivery error:', error.message);

                // Allow a future check to retry a failed email.
                // Keep the record if the email was sent but saving failed.
                if (!reminder.sentAt) {
                    await EmailReminder.deleteOne({
                        _id: reminder._id,
                        sentAt: null
                    });
                }
            }
        }
    } catch (error) {
        console.error('Reminder check error:', error);
    } finally {
        reminderCheckRunning = false;
    }
}

mongoose.connection.once('open', () => {
    checkEmailReminders();

    // Check once per hour while the backend is running.
    setInterval(checkEmailReminders, 60 * 60 * 1000);
});

/* ADMIN - LIBRARIAN MANAGEMENT */

// View all librarians
app.get('/api/admin/librarians',
    authMiddleware,
    roleMiddleware('admin'),
    async (req, res) => {
        try {
            const librarians = await User.find({ role: 'librarian' })
                .select('name email role isActive createdAt')
                .sort({ createdAt: -1 });

            res.json(librarians);
        } catch (error) {
            console.error('Load librarians error:', error);
            res.status(500).json({ message: 'Could not load librarians' });
        }
    }
);

// Create librarian
app.post('/api/admin/librarians',
    authMiddleware,
    roleMiddleware('admin'),
    async (req, res) => {
        try {
            const { name, email, password } = req.body;

            if (
                typeof name !== 'string' ||
                typeof email !== 'string' ||
                typeof password !== 'string' ||
                !name.trim() ||
                !email.trim() ||
                password.length < 8
            ) {
                return res.status(400).json({
                    message: 'Enter a name, email and password of at least 8 characters'
                });
            }

            const normalizedEmail = email.trim().toLowerCase();

            const existingUser = await User.findOne({
                email: normalizedEmail
            });

            if (existingUser) {
                return res.status(409).json({
                    message: 'Email already registered'
                });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const librarian = await User.create({
                name: name.trim(),
                email: normalizedEmail,
                password: hashedPassword,
                role: 'librarian',
                isActive: true
            });

            res.status(201).json({
                message: 'Librarian created successfully',
                librarian: {
                    id: librarian._id,
                    name: librarian.name,
                    email: librarian.email,
                    role: librarian.role,
                    isActive: librarian.isActive
                }
            });
        } catch (error) {
            if (error.code === 11000) {
                return res.status(409).json({
                    message: 'Email already registered'
                });
            }

            console.error('Create librarian error:', error);
            res.status(500).json({
                message: 'Could not create librarian'
            });
        }
    }
);

// Activate or deactivate librarian
app.patch('/api/admin/librarians/:id/status',
    authMiddleware,
    roleMiddleware('admin'),
    async (req, res) => {
        try {
            const { isActive } = req.body;

            if (!mongoose.isValidObjectId(req.params.id)) {
                return res.status(400).json({
                    message: 'Invalid librarian ID'
                });
            }

            if (typeof isActive !== 'boolean') {
                return res.status(400).json({
                    message: 'isActive must be true or false'
                });
            }

            const librarian = await User.findOneAndUpdate(
                {
                    _id: req.params.id,
                    role: 'librarian'
                },
                { isActive },
                {
                    new: true,
                    runValidators: true
                }
            ).select('name email role isActive');

            if (!librarian) {
                return res.status(404).json({
                    message: 'Librarian not found'
                });
            }

            res.json({
                message: isActive
                    ? 'Librarian activated successfully'
                    : 'Librarian deactivated successfully',
                librarian
            });
        } catch (error) {
            console.error('Update librarian error:', error);
            res.status(500).json({
                message: 'Could not update librarian'
            });
        }
    }
);

// Delete librarian
app.delete('/api/admin/librarians/:id',
    authMiddleware,
    roleMiddleware('admin'),
    async (req, res) => {
        try {
            if (!mongoose.isValidObjectId(req.params.id)) {
                return res.status(400).json({
                    message: 'Invalid librarian ID'
                });
            }

            const librarian = await User.findOneAndDelete({
                _id: req.params.id,
                role: 'librarian'
            });

            if (!librarian) {
                return res.status(404).json({
                    message: 'Librarian not found'
                });
            }

            res.json({
                message: 'Librarian deleted successfully'
            });
        } catch (error) {
            console.error('Delete librarian error:', error);
            res.status(500).json({
                message: 'Could not delete librarian'
            });
        }
    }
);

/* ADMIN - LIBRARY REPORTS */

// View library reports
app.get('/api/admin/reports',
    authMiddleware,
    roleMiddleware('admin', 'librarian'),
    async (req, res) => {
        try {
            // Most borrowed books
            const mostBorrowed = await Transaction.aggregate([
                {
                    $group: {
                        _id: '$book',
                        borrowCount: { $sum: 1 }
                    }
                },
                { $sort: { borrowCount: -1 } },
                { $limit: 10 },
                {
                    $lookup: {
                        from: 'books',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'book'
                    }
                },
                { $unwind: '$book' },
                {
                    $project: {
                        _id: 0,
                        title: '$book.title',
                        author: '$book.author',
                        borrowCount: 1
                    }
                }
            ]);

            // Currently overdue books
            const overdueBooks = await Transaction.find({
                status: { $in: ['issued', 'overdue'] },
                dueDate: { $lt: new Date() }
            })
                .populate('book', 'title author')
                .populate('member', 'name email')
                .sort({ dueDate: 1 });

            // Monthly borrowing activity
            const monthlyActivity = await Transaction.aggregate([
                {
                    $group: {
                        _id: {
                            year: { $year: '$issueDate' },
                            month: { $month: '$issueDate' }
                        },
                        totalBorrowed: { $sum: 1 }
                    }
                },
                {
                    $sort: {
                        '_id.year': -1,
                        '_id.month': -1
                    }
                },
                { $limit: 12 },
                {
                    $project: {
                        _id: 0,
                        year: '$_id.year',
                        month: '$_id.month',
                        totalBorrowed: 1
                    }
                }
            ]);

            res.json({
                mostBorrowed,
                overdueBooks,
                monthlyActivity
            });
        } catch (error) {
            console.error('Library reports error:', error);
            res.status(500).json({
                message: 'Could not load library reports'
            });
        }
    }
);


// Start backend server - only once
app.listen(5000, () => {
    console.log('Server running on http://localhost:5000');
});//This is for starting the server on port 5000.

