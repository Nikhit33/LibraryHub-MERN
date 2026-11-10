
import { useEffect, useState } from 'react';
import { jsPDF } from 'jspdf';

function AdminDashboard() {
    const [role, setRole] = useState(
        sessionStorage.getItem('role')
    );

    const [users, setUsers] = useState([]);
    const [books, setBooks] = useState([]);
    const [transactions, setTransactions] = useState([]);

    const [settings, setSettings] = useState(null);
    const [settingsMessage, setSettingsMessage] = useState('');
    const [savingSettings, setSavingSettings] = useState(false);
    const [librarians, setLibrarians] = useState([]);
    const [librarianName, setLibrarianName] = useState('');
    const [librarianEmail, setLibrarianEmail] = useState('');
    const [librarianPassword, setLibrarianPassword] = useState('');
    const [librarianMessage, setLibrarianMessage] = useState('');
    const [librarianLoading, setLibrarianLoading] = useState(false);
    const [reports, setReports] = useState(null);
    const [reportsLoading, setReportsLoading] = useState(false);
    const [reportsError, setReportsError] = useState('');

    useEffect(() => {
        async function loadStatistics() {
            const token = sessionStorage.getItem('token');
            const currentRole = sessionStorage.getItem('role');

            if (!token || currentRole !== 'admin') {
                setBooks([]);
                setTransactions([]);
                return;
            }

            try {
                const [booksResponse, transactionsResponse] = await Promise.all([
                    fetch('https://libraryhub-mern-jrbk.onrender.com/api/books'),
                    fetch('https://libraryhub-mern-jrbk.onrender.com/api/transactions', {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    })
                ]);

                if (booksResponse.ok && transactionsResponse.ok) {
                    const booksData = await booksResponse.json();
                    const transactionsData = await transactionsResponse.json();

                    setBooks(booksData);
                    setTransactions(transactionsData);
                } else {
                    console.log('Could not load statistics');
                }
            } catch (error) {
                console.log('Error loading statistics:', error);
            }
        }

        loadStatistics();

        window.addEventListener('authChanged', loadStatistics);
        window.addEventListener('booksChanged', loadStatistics);
        window.addEventListener('transactionsChanged', loadStatistics);

        return () => {
            window.removeEventListener('authChanged', loadStatistics);
            window.removeEventListener('booksChanged', loadStatistics);
            window.removeEventListener('transactionsChanged', loadStatistics);
        };
    }, []);

    useEffect(() => {
        async function loadUsers() {
            const token = sessionStorage.getItem('token');
            const currentRole = sessionStorage.getItem('role');

            if (!token || currentRole !== 'admin') {
                setUsers([]);
                return;
            }

            try {
                const response = await fetch(
                    'https://libraryhub-mern-jrbk.onrender.com/api/users',
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                if (response.ok) {
                    const data = await response.json();
                    setUsers(data);
                } else {
                    console.log('Could not load users');
                    setUsers([]);
                }
            } catch (error) {
                console.log('Error loading users:', error);
            }
        }

        loadUsers();

        window.addEventListener('authChanged', loadUsers);

        return () => {
            window.removeEventListener('authChanged', loadUsers);
        };
    }, []);

    useEffect(() => {
        async function loadSettings() {
            const token = sessionStorage.getItem('token');
            const currentRole = sessionStorage.getItem('role');

            if (!token || currentRole !== 'admin') {
                setSettings(null);
                return;
            }

            try {
                const response = await fetch(
                    'https://libraryhub-mern-jrbk.onrender.com/api/settings',
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                if (response.ok) {
                    const data = await response.json();
                    setSettings(data);
                    setSettingsMessage('');
                } else {
                    setSettingsMessage('Could not load library settings');
                }
            } catch (error) {
                console.log('Error loading settings:', error);
                setSettingsMessage('Error connecting to server');
            }
        }

        loadSettings();

        window.addEventListener('authChanged', loadSettings);

        return () => {
            window.removeEventListener('authChanged', loadSettings);
        };
    }, []);

    useEffect(() => {
        function updateRole() {
            setRole(sessionStorage.getItem('role'));
        }

        window.addEventListener('authChanged', updateRole);

        return () => {
            window.removeEventListener('authChanged', updateRole);
        };
    }, []);
    useEffect(() => {
        async function loadLibrarians() {
            const token = sessionStorage.getItem('token');

            if (!token || sessionStorage.getItem('role') !== 'admin') {
                setLibrarians([]);
                return;
            }

            try {
                const response = await fetch(
                    'https://libraryhub-mern-jrbk.onrender.com/api/admin/librarians',
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                if (!response.ok) {
                    throw new Error('Could not load librarians');
                }

                const data = await response.json();
                setLibrarians(data);
            } catch (error) {
                console.error('Load librarians error:', error);
                setLibrarianMessage('Could not load librarians');
            }
        }

        loadLibrarians();
        window.addEventListener('authChanged', loadLibrarians);
        window.addEventListener('librariansChanged', loadLibrarians);

        return () => {
            window.removeEventListener('authChanged', loadLibrarians);
            window.removeEventListener('librariansChanged', loadLibrarians);
        };
    }, []);

    useEffect(() => {
        async function loadReports() {
            const token = sessionStorage.getItem('token');

            if (!token || sessionStorage.getItem('role') !== 'admin') {
                setReports(null);
                return;
            }

            setReportsLoading(true);
            setReportsError('');

            try {
                const response = await fetch(
                    'https://libraryhub-mern-jrbk.onrender.com/api/admin/reports',
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                if (!response.ok) {
                    throw new Error('Could not load reports');
                }

                const data = await response.json();
                setReports(data);
            } catch (error) {
                console.error('Load reports error:', error);
                setReports(null);
                setReportsError('Could not load library reports');
            } finally {
                setReportsLoading(false);
            }
        }

        loadReports();

        window.addEventListener('authChanged', loadReports);
        window.addEventListener('transactionsChanged', loadReports);

        return () => {
            window.removeEventListener('authChanged', loadReports);
            window.removeEventListener('transactionsChanged', loadReports);
        };
    }, []);


    function handleSettingsChange(event) {
        const { name, value } = event.target;

        setSettings((previousSettings) => ({
            ...previousSettings,
            [name]: value
        }));
    }

    async function saveSettings(event) {
        event.preventDefault();

        const token = sessionStorage.getItem('token');

        if (!token || !settings) {
            setSettingsMessage('Please log in as admin');
            return;
        }

        const updatedSettings = {
            loanPeriodDays: Number(settings.loanPeriodDays),
            finePerDay: Number(settings.finePerDay),
            maxBooksPerMember: Number(settings.maxBooksPerMember),
            maxUnpaidFine: Number(settings.maxUnpaidFine)
        };

        if (
            !Number.isInteger(updatedSettings.loanPeriodDays) ||
            updatedSettings.loanPeriodDays < 1 ||
            !Number.isFinite(updatedSettings.finePerDay) ||
            updatedSettings.finePerDay < 0 ||
            !Number.isInteger(updatedSettings.maxBooksPerMember) ||
            updatedSettings.maxBooksPerMember < 1 ||
            !Number.isFinite(updatedSettings.maxUnpaidFine) ||
            updatedSettings.maxUnpaidFine < 0
        ) {
            setSettingsMessage('Please enter valid settings values');
            return;
        }

        setSavingSettings(true);
        setSettingsMessage('');

        try {
            const response = await fetch(
                'https://libraryhub-mern-jrbk.onrender.com/api/settings',
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify(updatedSettings)
                }
            );

            const data = await response.json();

            if (response.ok) {
                setSettings(data.settings);
                setSettingsMessage('Library settings saved successfully!');
            } else {
                setSettingsMessage(
                    data.message || 'Could not save settings'
                );
            }
        } catch (error) {
            console.log('Error saving settings:', error);
            setSettingsMessage('Error connecting to server');
        } finally {
            setSavingSettings(false);
        }
    }

    async function createLibrarian(event) {
        event.preventDefault();

        const token = sessionStorage.getItem('token');
        setLibrarianMessage('');
        setLibrarianLoading(true);

        try {
            const response = await fetch(
                'https://libraryhub-mern-jrbk.onrender.com/api/admin/librarians',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        name: librarianName,
                        email: librarianEmail,
                        password: librarianPassword
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setLibrarianMessage(data.message || 'Could not create librarian');
                return;
            }

            setLibrarianName('');
            setLibrarianEmail('');
            setLibrarianPassword('');
            setLibrarianMessage('Librarian created successfully');
            window.dispatchEvent(new Event('librariansChanged'));
            window.dispatchEvent(new Event('authChanged'));
        } catch (error) {
            console.error('Create librarian error:', error);
            setLibrarianMessage('Error connecting to server');
        } finally {
            setLibrarianLoading(false);
        }
    }

    async function changeLibrarianStatus(id, isActive) {
        const token = sessionStorage.getItem('token');
        setLibrarianLoading(true);
        setLibrarianMessage('');

        try {
            const response = await fetch(
                `https://libraryhub-mern-jrbk.onrender.com/api/admin/librarians/${id}/status`,
                {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({ isActive })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setLibrarianMessage(data.message || 'Could not update librarian');
                return;
            }

            setLibrarianMessage(data.message);
            window.dispatchEvent(new Event('librariansChanged'));
        } catch (error) {
            console.error('Update librarian error:', error);
            setLibrarianMessage('Error connecting to server');
        } finally {
            setLibrarianLoading(false);
        }
    }

    async function deleteLibrarian(id) {
        const confirmed = window.confirm(
            'Are you sure you want to permanently delete this librarian?'
        );

        if (!confirmed) {
            return;
        }

        const token = sessionStorage.getItem('token');
        setLibrarianLoading(true);
        setLibrarianMessage('');

        try {
            const response = await fetch(
                `https://libraryhub-mern-jrbk.onrender.com/api/admin/librarians/${id}`,
                {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setLibrarianMessage(data.message || 'Could not delete librarian');
                return;
            }

            setLibrarianMessage(data.message);
            window.dispatchEvent(new Event('librariansChanged'));
            window.dispatchEvent(new Event('authChanged'));
        } catch (error) {
            console.error('Delete librarian error:', error);
            setLibrarianMessage('Error connecting to server');
        } finally {
            setLibrarianLoading(false);
        }
    }

    function downloadCSV(filename, headers, rows) {
        function escapeCSV(value) {
            const text = String(value ?? '');
            return `"${text.replace(/"/g, '""')}"`;
        }

        const csv = [
            headers.map(escapeCSV).join(','),
            ...rows.map((row) => row.map(escapeCSV).join(','))
        ].join('\r\n');

        const blob = new Blob(['\uFEFF' + csv], {
            type: 'text/csv;charset=utf-8;'
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();

        URL.revokeObjectURL(url);
    }

    function exportMostBorrowed() {
        if (!reports) return;

        downloadCSV(
            'most-borrowed-books.csv',
            ['Title', 'Author', 'Borrow Count'],
            reports.mostBorrowed.map((book) => [
                book.title,
                book.author,
                book.borrowCount
            ])
        );
    }

    function exportOverdueBooks() {
        if (!reports) return;

        downloadCSV(
            'overdue-books.csv',
            ['Book', 'Member', 'Email', 'Due Date'],
            reports.overdueBooks.map((transaction) => [
                transaction.book?.title || 'Unknown book',
                transaction.member?.name || 'Unknown member',
                transaction.member?.email || '',
                new Date(transaction.dueDate).toLocaleDateString()
            ])
        );
    }

    function exportMonthlyActivity() {
        if (!reports) return;

        downloadCSV(
            'monthly-borrowing.csv',
            ['Year', 'Month', 'Total Borrowed'],
            reports.monthlyActivity.map((month) => [
                month.year,
                month.month,
                month.totalBorrowed
            ])
        );
    }


    if (role !== 'admin') {
        return null;
    }

    return (
        <div className="admin-dashboard">
            <h2 style={{ color: '#1a2b55' }}>Admin Dashboard</h2>
            <p>Welcome to the LibraryHub Admin Dashboard!</p>
            <p>Manage library users and view system information here.</p>

            <h3 style={{ color: '#1a2b55' }}>Library Statistics</h3>

            <div>
                <p><strong>Total Book Titles:</strong> {books.length}</p>

                <p>
                    <strong>Total Book Copies:</strong>{' '}
                    {books.reduce(
                        (total, book) => total + book.totalCopies, 0
                    )}
                </p>

                <p>
                    <strong>Registered Members:</strong>{' '}
                    {users.filter(
                        (user) => user.role === 'member'
                    ).length}
                </p>

                <p>
                    <strong>Total Borrowing Records:</strong>{' '}
                    {transactions.length}
                </p>

                <p>
                    <strong>Active Borrowings:</strong>{' '}
                    {transactions.filter(
                        (transaction) =>
                            transaction.status === 'issued' ||
                            transaction.status === 'overdue'
                    ).length}
                </p>

                <p>
                    <strong>Currently Overdue Books:</strong>{' '}
                    {transactions.filter(
                        (transaction) =>
                            (transaction.status === 'issued' ||
                                transaction.status === 'overdue') &&
                            transaction.dueDate &&
                            new Date(transaction.dueDate) < new Date()
                    ).length}
                </p>

            </div>

            <h3 style={{ color: '#1a2b55' }}>Registered Users</h3>

            {users.length === 0 ? (
                <p>No registered users found.</p>
            ) : (
                <table border="1" cellPadding="10">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                        </tr>
                    </thead>

                    <tbody>
                        {users.map((user) => (
                            <tr key={user._id}>
                                <td>{user.name}</td>
                                <td>{user.email}</td>
                                <td>{user.role}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            <h3 style={{ color: '#1a2b55' }}>Library Settings</h3>
            <p>Change borrowing rules and fine policies here.</p>

            {settings ? (
                <form
                    onSubmit={saveSettings}
                    style={{
                        maxWidth: '450px',
                        padding: '20px',
                        border: '1px solid #ddd',
                        borderRadius: '8px'
                    }}
                >
                    <div style={{ marginBottom: '15px' }}>
                        <label htmlFor="loanPeriodDays">
                            Loan Period (Days)
                        </label>
                        <input
                            id="loanPeriodDays"
                            type="number"
                            name="loanPeriodDays"
                            min="1"
                            step="1"
                            required
                            value={settings.loanPeriodDays}
                            onChange={handleSettingsChange}
                            style={{
                                display: 'block',
                                width: '100%',
                                padding: '8px',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <label htmlFor="finePerDay">
                            Fine Per Overdue Day
                        </label>
                        <input
                            id="finePerDay"
                            type="number"
                            name="finePerDay"
                            min="0"
                            step="0.01"
                            required
                            value={settings.finePerDay}
                            onChange={handleSettingsChange}
                            style={{
                                display: 'block',
                                width: '100%',
                                padding: '8px',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <label htmlFor="maxBooksPerMember">
                            Maximum Books Per Member
                        </label>
                        <input
                            id="maxBooksPerMember"
                            type="number"
                            name="maxBooksPerMember"
                            min="1"
                            step="1"
                            required
                            value={settings.maxBooksPerMember}
                            onChange={handleSettingsChange}
                            style={{
                                display: 'block',
                                width: '100%',
                                padding: '8px',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <label htmlFor="maxUnpaidFine">
                            Maximum Unpaid Fine
                        </label>
                        <input
                            id="maxUnpaidFine"
                            type="number"
                            name="maxUnpaidFine"
                            min="0"
                            step="0.01"
                            required
                            value={settings.maxUnpaidFine}
                            onChange={handleSettingsChange}
                            style={{
                                display: 'block',
                                width: '100%',
                                padding: '8px',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={savingSettings}
                        style={{
                            backgroundColor: '#1a2b55',
                            color: 'white',
                            padding: '10px 20px',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer'
                        }}
                    >
                        {savingSettings ? 'Saving...' : 'Save Settings'}
                    </button>
                </form>
            ) : (
                <p>Library settings are not loaded.</p>
            )}

            {settingsMessage && (
                <p role="status">{settingsMessage}</p>
            )}

            {/* Admin Librarian Management */}
            <section style={{ marginTop: '35px' }}>
                <h3 style={{ color: '#1a2b55' }}>Manage Librarians</h3>
                <p>Create librarian accounts and manage their access.</p>

                <h4>Add New Librarian</h4>

                <form
                    onSubmit={createLibrarian}
                    style={{
                        maxWidth: '450px',
                        padding: '20px',
                        border: '1px solid #ddd',
                        borderRadius: '8px'
                    }}
                >
                    <div style={{ marginBottom: '12px' }}>
                        <label htmlFor="librarianName">Name</label>
                        <input
                            id="librarianName"
                            type="text"
                            required
                            value={librarianName}
                            onChange={(event) => setLibrarianName(event.target.value)}
                            style={{ display: 'block', width: '100%', boxSizing: 'border-box', padding: '8px' }}
                        />
                    </div>

                    <div style={{ marginBottom: '12px' }}>
                        <label htmlFor="librarianEmail">Email</label>
                        <input
                            id="librarianEmail"
                            type="email"
                            required
                            value={librarianEmail}
                            onChange={(event) => setLibrarianEmail(event.target.value)}
                            style={{ display: 'block', width: '100%', boxSizing: 'border-box', padding: '8px' }}
                        />
                    </div>

                    <div style={{ marginBottom: '12px' }}>
                        <label htmlFor="librarianPassword">Password</label>
                        <input
                            id="librarianPassword"
                            type="password"
                            minLength="8"
                            required
                            value={librarianPassword}
                            onChange={(event) => setLibrarianPassword(event.target.value)}
                            style={{ display: 'block', width: '100%', boxSizing: 'border-box', padding: '8px' }}
                        />
                    </div>

                    <button type="submit" disabled={librarianLoading}>
                        {librarianLoading ? 'Please wait...' : 'Create Librarian'}
                    </button>
                </form>

                <h4 style={{ marginTop: '25px' }}>Librarian Accounts</h4>

                {librarians.length === 0 ? (
                    <p>No librarians found.</p>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table border="1" cellPadding="10" style={{ borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {librarians.map((librarian) => (
                                    <tr key={librarian._id}>
                                        <td>{librarian.name}</td>
                                        <td>{librarian.email}</td>
                                        <td>
                                            {librarian.isActive === false ? 'Inactive' : 'Active'}
                                        </td>
                                        <td>
                                            <button
                                                type="button"
                                                disabled={librarianLoading}
                                                onClick={() => changeLibrarianStatus(
                                                    librarian._id,
                                                    librarian.isActive === false
                                                )}
                                            >
                                                {librarian.isActive === false ? 'Activate' : 'Deactivate'}
                                            </button>

                                            {' '}

                                            <button
                                                type="button"
                                                disabled={librarianLoading}
                                                onClick={() => deleteLibrarian(librarian._id)}
                                                style={{ color: '#b91c1c' }}
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {librarianMessage && (
                    <p role="status">{librarianMessage}</p>
                )}
            </section>

            {/* Library Reports */}
            <section style={{ marginTop: '35px' }}>
                <h3 style={{ color: '#1a2b55' }}>Library Reports</h3>
                <p>View borrowing activity and download CSV reports.</p>

                {reportsLoading && <p>Loading reports...</p>}

                {reportsError && <p role="alert">{reportsError}</p>}

                {!reportsLoading && reports && (
                    <>
                        <h4>Most Borrowed Books</h4>
                        <button type="button" onClick={exportMostBorrowed}>
                            Download CSV
                        </button>

                        {reports.mostBorrowed.length === 0 ? (
                            <p>No borrowing records found.</p>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table border="1" cellPadding="10">
                                    <thead>
                                        <tr>
                                            <th>Book</th>
                                            <th>Author</th>
                                            <th>Times Borrowed</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reports.mostBorrowed.map((book, index) => (
                                            <tr key={index}>
                                                <td>{book.title}</td>
                                                <td>{book.author}</td>
                                                <td>{book.borrowCount}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <h4>Currently Overdue Books</h4>
                        <button type="button" onClick={exportOverdueBooks}>
                            Download CSV
                        </button>

                        {reports.overdueBooks.length === 0 ? (
                            <p>No overdue books found.</p>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table border="1" cellPadding="10">
                                    <thead>
                                        <tr>
                                            <th>Book</th>
                                            <th>Member</th>
                                            <th>Due Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reports.overdueBooks.map((transaction) => (
                                            <tr key={transaction._id}>
                                                <td>{transaction.book?.title || 'Unknown book'}</td>
                                                <td>{transaction.member?.name || 'Unknown member'}</td>
                                                <td>
                                                    {new Date(transaction.dueDate).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <h4>Monthly Borrowing Activity</h4>
                        <button type="button" onClick={exportMonthlyActivity}>
                            Download CSV
                        </button>

                        {reports.monthlyActivity.length === 0 ? (
                            <p>No monthly activity found.</p>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table border="1" cellPadding="10">
                                    <thead>
                                        <tr>
                                            <th>Year</th>
                                            <th>Month</th>
                                            <th>Total Borrowed</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reports.monthlyActivity.map((month) => (
                                            <tr key={`${month.year}-${month.month}`}>
                                                <td>{month.year}</td>
                                                <td>{month.month}</td>
                                                <td>{month.totalBorrowed}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}
            </section>

        </div>
    );
}

export default AdminDashboard;

