import { useEffect, useState } from 'react';
import { jsPDF } from 'jspdf';

function LibrarianDashboard() {
    const [role, setRole] = useState(sessionStorage.getItem('role'));
    const [showBookForm, setShowBookForm] = useState(false);
    const [title, setTitle] = useState('');
    const [author, setAuthor] = useState('');
    const [category, setCategory] = useState('');
    const [totalCopies, setTotalCopies] = useState('');
    const [isbn, setIsbn] = useState('');
    const [books, setBooks] = useState([]);
    const [editingBook, setEditingBook] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [members, setMembers] = useState([]);
    const totalBooks = books.length;

    const issuedBooks = transactions.filter(
        (transaction) =>
            transaction.status === 'issued' ||
            transaction.status === 'overdue'
    ).length;

    const overdueBooks = transactions.filter(
        (transaction) =>
            ['issued', 'overdue'].includes(transaction.status) &&
            new Date(transaction.dueDate) < new Date()
    ).length;

    const totalMembers = members.length;
    const [selectedMember, setSelectedMember] = useState('');
    const [selectedBook, setSelectedBook] = useState('');


    useEffect(() => {
        function handleAuthChange() {
            setRole(sessionStorage.getItem('role'));
        }

        window.addEventListener('authChanged', handleAuthChange);

        return () => {
            window.removeEventListener('authChanged', handleAuthChange);
        };
    }, []);

    useEffect(() => {
        function loadBooks() {
            fetch('https://libraryhub-mern-jrbk.onrender.com/api/books')
                .then((response) => response.json())
                .then((data) => {
                    setBooks(data);
                })
                .catch((error) => {
                    console.log('Error loading books:', error);
                });
        }

        loadBooks();

        window.addEventListener('booksChanged', loadBooks);

        return () => {
            window.removeEventListener('booksChanged', loadBooks);
        };
    }, []);

    useEffect(() => {
        async function loadTransactions() {
            const token = sessionStorage.getItem('token');

            if (!token) {
                setTransactions([]);
                return;
            }

            try {
                const response = await fetch(
                    'https://libraryhub-mern-jrbk.onrender.com/api/transactions',
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                if (response.ok) {
                    const data = await response.json();
                    setTransactions(data);
                } else {
                    console.log('Could not load borrowing records');
                    setTransactions([]);
                }

            } catch (error) {
                console.log('Error loading transactions:', error);
            }
        }

        loadTransactions();

        window.addEventListener('authChanged', loadTransactions);

        window.addEventListener('transactionsChanged', loadTransactions);


        return () => {
            window.removeEventListener('authChanged', loadTransactions);
            window.removeEventListener('transactionsChanged', loadTransactions);
        };
    }, []);


    useEffect(() => {
        async function loadMembers() {
            const token = sessionStorage.getItem('token');

            if (!token) {
                setMembers([]);
                return;
            }

            try {
                const response = await fetch(
                    'https://libraryhub-mern-jrbk.onrender.com/api/members',
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                if (response.ok) {
                    const data = await response.json();
                    setMembers(data);
                } else {
                    console.log('Could not load members');
                    setMembers([]);
                }

            } catch (error) {
                console.log('Error loading members:', error);
            }
        }

        loadMembers();

        window.addEventListener('authChanged', loadMembers);

        return () => {
            window.removeEventListener('authChanged', loadMembers);
        };
    }, []);


    async function handleAddBook(e) {
        e.preventDefault();

        const token = sessionStorage.getItem('token');

        try {
            const response = await fetch('https://libraryhub-mern-jrbk.onrender.com/api/books', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: title,
                    author: author,
                    isbn: isbn,
                    category: category,
                    totalCopies: Number(totalCopies)
                })
            });

            const data = await response.json();

            if (response.ok) {
                alert('Book added successfully!');

                window.dispatchEvent(new Event('booksChanged'));

                setTitle('');
                setAuthor('');
                setIsbn('');
                setCategory('');
                setTotalCopies('');
                setShowBookForm(false);
            } else {
                alert(data.message || 'Failed to add book');
            }

        } catch (error) {
            console.log('Error adding book:', error);
            alert('Something went wrong');
        }
    }

    async function handleUpdateBook(e) {
        e.preventDefault();

        if (!editingBook) {
            return;
        }

        const token = sessionStorage.getItem('token');

        try {
            const response = await fetch(
                `https://libraryhub-mern-jrbk.onrender.com/api/books/${editingBook._id}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        title: editingBook.title,
                        author: editingBook.author,
                        isbn: editingBook.isbn,
                        category: editingBook.category,
                        totalCopies: Number(editingBook.totalCopies)
                    })
                }
            );

            const data = await response.json();

            if (response.ok) {
                alert('Book updated successfully!');
                setEditingBook(null);
                window.dispatchEvent(new Event('booksChanged'));
            } else {
                alert(data.message || 'Failed to update book');
            }

        } catch (error) {
            console.log('Error updating book:', error);
            alert('Something went wrong');
        }
    }



    async function handleDeleteBook(book) {
        if (book.availableCopies < book.totalCopies) {
            alert('Cannot delete this book because some copies are borrowed.');
            return;
        }

        const confirmDelete = window.confirm(
            `Are you sure you want to delete "${book.title}"?`
        );

        if (!confirmDelete) {
            return;
        }

        const token = sessionStorage.getItem('token');

        try {
            const response = await fetch(
                `https://libraryhub-mern-jrbk.onrender.com/api/books/${book._id}`,
                {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (response.ok) {
                alert('Book deleted successfully!');
                window.dispatchEvent(new Event('booksChanged'));
            } else {
                alert(data.message || 'Failed to delete book');
            }

        } catch (error) {
            console.log('Error deleting book:', error);
            alert('Something went wrong');
        }
    }


    async function handleReturnBook(transaction) {
        const confirmReturn = window.confirm(
            `Mark "${transaction.book?.title || 'this book'}" as returned?`
        );

        if (!confirmReturn) {
            return;
        }

        const token = sessionStorage.getItem('token');

        try {
            const response = await fetch(
                `https://libraryhub-mern-jrbk.onrender.com/api/transactions/${transaction._id}/return`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (response.ok) {
                alert('Book returned successfully!');
                window.dispatchEvent(new Event('booksChanged'));
                window.dispatchEvent(new Event('transactionsChanged'));
            } else {
                alert(data.message || 'Failed to return book');
            }

        } catch (error) {
            console.log('Error returning book:', error);
            alert('Something went wrong');
        }
    }


    async function handleIssueBook() {
        if (!selectedMember || !selectedBook) {
            alert('Please select a member and a book');
            return;
        }

        const token = sessionStorage.getItem('token');

        try {
            const response = await fetch(
                'https://libraryhub-mern-jrbk.onrender.com/api/transactions/issue',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        memberId: selectedMember,
                        bookId: selectedBook
                    })
                }
            );

            const data = await response.json();

            if (response.ok) {
                alert('Book issued successfully!');

                setSelectedMember('');
                setSelectedBook('');

                window.dispatchEvent(new Event('booksChanged'));
                window.dispatchEvent(new Event('transactionsChanged'));
            } else {
                alert(data.message || 'Could not issue book');
            }

        } catch (error) {
            console.log('Error issuing book:', error);
            alert('Something went wrong while issuing the book');
        }
    }

    async function handleRenewBook(transaction) {
        const confirmRenew = window.confirm(
            `Renew "${transaction.book?.title || 'this book'}"?`
        );

        if (!confirmRenew) {
            return;
        }

        const token = sessionStorage.getItem('token');

        try {
            const response = await fetch(
                `https://libraryhub-mern-jrbk.onrender.com/api/transactions/${transaction._id}/renew`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (response.ok) {
                alert('Book renewed successfully!');

                window.dispatchEvent(new Event('transactionsChanged'));
            } else {
                alert(data.message || 'Could not renew book');
            }

        } catch (error) {
            console.log('Error renewing book:', error);
            alert('Something went wrong while renewing the book');
        }
    }

    async function handlePayFine(transaction) {
        const confirmPayment = window.confirm(
            `Confirm payment of ${transaction.fineAmount} for "${transaction.book?.title || 'this book'}"?`
        );

        if (!confirmPayment) {
            return;
        }

        const token = sessionStorage.getItem('token');

        try {
            const response = await fetch(
                `https://libraryhub-mern-jrbk.onrender.com/api/transactions/${transaction._id}/pay-fine`,
                {
                    method: 'PATCH',
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (response.ok) {
                alert('Fine payment recorded successfully!');
                window.dispatchEvent(new Event('transactionsChanged'));
            } else {
                alert(data.message || 'Could not record fine payment');
            }
        } catch (error) {
            console.log('Error recording fine payment:', error);
            alert('Something went wrong while recording payment');
        }
    }
    function downloadTransactionsCSV() {
        const rows = [
            ['Book', 'Member', 'Issue Date', 'Due Date', 'Status', 'Fine']
        ];

        transactions.forEach((transaction) => {
            rows.push([
                transaction.book?.title || 'Unknown',
                transaction.member?.name || 'Unknown',
                transaction.issueDate || '',
                transaction.dueDate || '',
                transaction.status || '',
                transaction.fineAmount || 0
            ]);
        });

        const csv = rows.map((row) =>
            row.map((value) => {
                let text = String(value);

                // Prevent spreadsheet formulas from running
                if (/^[\s]*[=+\-@]/.test(text)) {
                    text = "'" + text;
                }

                return `"${text.replace(/"/g, '""')}"`;
            }).join(',')
        ).join('\r\n');

        const blob = new Blob([csv], {
            type: 'text/csv;charset=utf-8;'
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = url;
        link.download = 'library-transactions.csv';
        document.body.appendChild(link);
        link.click();
        link.remove();

        URL.revokeObjectURL(url);
    }
    function downloadTransactionsPDF() {
        const pdf = new jsPDF();

        pdf.setFontSize(18);
        pdf.text('LibraryHub - Borrowing Report', 14, 20);

        pdf.setFontSize(10);

        let y = 35;

        transactions.forEach((transaction, index) => {
            if (y > 260) {
                pdf.addPage();
                y = 20;
            }

            const book = transaction.book?.title || 'Unknown';
            const member = transaction.member?.name || 'Unknown';
            const status = transaction.status || 'Unknown';
            const fine = transaction.fineAmount || 0;

            const lines = [
                `${index + 1}. Book: ${book}`,
                `Member: ${member}`,
                `Status: ${status} | Fine: ${fine}`,
                `Due: ${transaction.dueDate
                    ? new Date(transaction.dueDate).toLocaleDateString()
                    : 'N/A'}`
            ];

            lines.forEach((line) => {
                const wrappedLines = pdf.splitTextToSize(line, 180);

                wrappedLines.forEach((wrappedLine) => {
                    if (y > 275) {
                        pdf.addPage();
                        y = 20;
                    }

                    pdf.text(wrappedLine, 14, y);
                    y += 6;
                });
            });

            y += 5;
        });

        pdf.save('library-transactions.pdf');
    }

    if (role !== 'librarian' && role !== 'admin') {
        return null;
    }


    return (
        <div className="login-container">
            <h2>Librarian Dashboard</h2>
            <h3>Library Statistics</h3>

            <div className="dashboard-stats">
                <div className="stat-card">
                    <h4>Total Book Titles</h4>
                    <p>{totalBooks}</p>
                </div>

                <div className="stat-card">
                    <h4>Issued Books</h4>
                    <p>{issuedBooks}</p>
                </div>

                <div className="stat-card">
                    <h4>Overdue Books</h4>
                    <p>{overdueBooks}</p>
                </div>

                <div className="stat-card">
                    <h4>Total Members</h4>
                    <p>{totalMembers}</p>
                </div>
            </div>
            <p>Welcome to the LibraryHub Librarian Dashboard!</p>

            <h3>Library Management</h3>
            <p>Manage books and member borrowing records here.</p>

            <h3>Book Management</h3>
            <p>Add, Update, and Delete books from the library</p>

            <button
                type="button"
                onClick={() => setShowBookForm(!showBookForm)}
            >
                {showBookForm ? 'Cancel' : 'Add New Book'}
            </button>

            {showBookForm && (
                <div>
                    <h3>Add New Book</h3>

                    <form onSubmit={handleAddBook}>
                        <input
                            type="text"
                            placeholder="Book Title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />

                        <input
                            type="text"
                            placeholder="Author"
                            value={author}
                            onChange={(e) => setAuthor(e.target.value)}
                            required
                        />

                        <input
                            type="text"
                            placeholder="Category"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            required
                        />

                        <input
                            type="number"
                            placeholder="Total Copies"
                            value={totalCopies}
                            onChange={(e) => setTotalCopies(e.target.value)}
                            min="1"
                            required
                        />

                        <input
                            type="text"
                            placeholder="ISBN"
                            value={isbn}
                            onChange={(e) => setIsbn(e.target.value)}
                            required
                        />

                        <button type="submit">Save Book</button>
                    </form>
                </div>
            )}

            <h3>All Library Books</h3>

            {books.length === 0 ? (
                <p>No books found.</p>
            ) : (
                <div>
                    {books.map((book) => (
                        <div key={book._id}>
                            <p><strong>Title:</strong> {book.title}</p>
                            <p><strong>Author:</strong> {book.author}</p>
                            <p><strong>ISBN:</strong> {book.isbn}</p>
                            <p><strong>Category:</strong> {book.category}</p>
                            <p><strong>Total Copies:</strong> {book.totalCopies}</p>
                            <p><strong>Available Copies:</strong> {book.availableCopies}</p>
                            <p>
                                <strong>Borrowed Copies:</strong>{' '}
                                {book.totalCopies - book.availableCopies}
                            </p>

                            <button
                                type="button"
                                onClick={() => setEditingBook({ ...book })}
                            >
                                Edit Book
                            </button>
                            <button
                                type="button"
                                onClick={() => handleDeleteBook(book)}
                            >
                                Delete Book
                            </button>

                            {editingBook?._id === book._id && (
                                <div>
                                    <h3>Edit Book Details</h3>

                                    <form onSubmit={handleUpdateBook}>
                                        <input
                                            type="text"
                                            placeholder="Book Title"
                                            value={editingBook.title}
                                            onChange={(e) => setEditingBook({
                                                ...editingBook,
                                                title: e.target.value
                                            })}
                                            required
                                        />

                                        <input
                                            type="text"
                                            placeholder="Author"
                                            value={editingBook.author}
                                            onChange={(e) => setEditingBook({
                                                ...editingBook,
                                                author: e.target.value
                                            })}
                                            required
                                        />

                                        <input
                                            type="text"
                                            placeholder="ISBN"
                                            value={editingBook.isbn}
                                            onChange={(e) => setEditingBook({
                                                ...editingBook,
                                                isbn: e.target.value
                                            })}
                                            required
                                        />

                                        <input
                                            type="text"
                                            placeholder="Category"
                                            value={editingBook.category}
                                            onChange={(e) => setEditingBook({
                                                ...editingBook,
                                                category: e.target.value
                                            })}
                                            required
                                        />
                                        <input
                                            type="number"
                                            placeholder="Total Copies"
                                            min="0"
                                            value={editingBook.totalCopies}
                                            onChange={(e) => setEditingBook({
                                                ...editingBook,
                                                totalCopies: e.target.value
                                            })}
                                            required
                                        />

                                        <button type="submit">
                                            Save Changes
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setEditingBook(null)}
                                        >
                                            Cancel
                                        </button>
                                    </form>
                                </div>
                            )}

                            <hr />
                        </div>
                    ))}
                </div>
            )}

            <h3>Issue Book</h3>

            <div>
                <label>Select Member: </label>
                <select
                    value={selectedMember}
                    onChange={(e) => setSelectedMember(e.target.value)}
                >
                    <option value="">Choose a member</option>

                    {members.map((member) => (
                        <option key={member._id} value={member._id}>
                            {member.name} ({member.email})
                        </option>
                    ))}
                </select>
            </div>

            <div>
                <label>Select Book: </label>
                <select
                    value={selectedBook}
                    onChange={(e) => setSelectedBook(e.target.value)}
                >
                    <option value="">Choose a book</option>

                    {books
                        .filter((book) => book.availableCopies > 0)
                        .map((book) => (
                            <option key={book._id} value={book._id}>
                                {book.title} - {book.author}
                            </option>
                        ))}
                </select>
            </div>
            <br />
            <button
                type="button"
                onClick={handleIssueBook}
            >
                Issue Book
            </button>

            <br />
            <h3>Borrowing Records</h3>
            <button
                type="button"
                onClick={downloadTransactionsCSV}
            >
                Download Transactions CSV
            </button>
            <button
                type="button"
                onClick={downloadTransactionsPDF}
            >
                Download Transactions PDF
            </button>
            {transactions.length === 0 ? (
                <p>No borrowing records found.</p>
            ) : (
                <div>
                    {transactions.map((transaction) => (
                        <div key={transaction._id}>
                            <p>
                                <strong>Book:</strong>{' '}
                                {transaction.book?.title || 'Book unavailable'}
                            </p>

                            <p>
                                <strong>Member:</strong>{' '}
                                {transaction.member?.name || transaction.member?.email || 'Unknown member'}
                            </p>

                            <p>
                                <strong>Issue Date:</strong>{' '}
                                {new Date(transaction.issueDate).toLocaleDateString()}
                            </p>

                            <p>
                                <strong>Due Date:</strong>{' '}
                                {new Date(transaction.dueDate).toLocaleDateString()}
                            </p>


                            <p>
                                <strong>Status:</strong> {transaction.status}
                            </p>

                            <p>
                                <strong>Fine Amount:</strong>{' '}
                                {transaction.fineAmount || 0}
                            </p>

                            <p>
                                <strong>Fine Payment:</strong>{' '}
                                {transaction.fineAmount > 0
                                    ? (transaction.finePaid ? 'Paid' : 'Unpaid')
                                    : 'No fine'}
                            </p>

                            {transaction.status === 'returned' &&
                                transaction.fineAmount > 0 &&
                                !transaction.finePaid && (
                                    <button
                                        type="button"
                                        onClick={() => handlePayFine(transaction)}
                                    >
                                        Mark Fine as Paid
                                    </button>
                                )}



                            {(transaction.status === 'issued' ||
                                transaction.status === 'overdue') && (
                                    <button
                                        type="button"
                                        onClick={() => handleReturnBook(transaction)}
                                    >
                                        Return Book
                                    </button>
                                )}

                            {transaction.status === 'issued' &&
                                transaction.renewCount === 0 &&
                                new Date(transaction.dueDate) >= new Date() && (

                                    <button
                                        type="button"
                                        onClick={() => handleRenewBook(transaction)}
                                    >
                                        Renew Book
                                    </button>

                                )}



                            <hr />

                        </div>
                    ))}
                </div>
            )}

        </div>
    );
}

export default LibrarianDashboard;

