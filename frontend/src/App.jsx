
import { useEffect, useState } from 'react';
import './App.css';
import Login from './Login.jsx';
import Register from './Register.jsx';
import Profile from './Profile.jsx';
import MemberDashboard from './MemberDashboard.jsx';
import LibrarianDashboard from './LibrarianDashboard.jsx';
import AdminDashboard from './AdminDashboard.jsx';

function App() {

  const [role, setRole] = useState(
    sessionStorage.getItem('role')
  );
  const [books, setBooks] = useState([]);
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [booksError, setBooksError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [availability, setAvailability] = useState('all');
  const [sortBy, setSortBy] = useState('title');
  const [currentPage, setCurrentPage] = useState(1);

  const [reservationMessage, setReservationMessage] = useState('');
  const filteredBooks = books
    .filter((book) => {
      if (availability === 'available') {
        return book.availableCopies > 0;
      }

      if (availability === 'unavailable') {
        return book.availableCopies === 0;
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }

      return a.title.localeCompare(b.title);
    });

  const booksPerPage = 6;
  const totalPages = Math.ceil(filteredBooks.length / booksPerPage);

  const displayedBooks = filteredBooks.slice(
    (currentPage - 1) * booksPerPage,
    currentPage * booksPerPage
  );

  async function reserveBook(bookId) {
    const token = sessionStorage.getItem('token');

    if (!token) {
      setReservationMessage('Please log in as a member to reserve a book.');
      return;
    }
    try {
      const response = await fetch('https://libraryhub-mern-jrbk.onrender.com/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ bookId })
      });

      const data = await response.json();
      console.log('Reservation status:', response.status);
      console.log('Reservation response:', data);

      setReservationMessage(data.message || 'Could not reserve book');
      if (response.ok) {
        window.dispatchEvent(new Event('reservationsChanged'));
      }
    } catch (error) {
      console.error('Reservation error:', error);
      setReservationMessage('Could not connect to the server');
    }
  }

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
    let active = true;

    async function loadBooks() {
      setLoadingBooks(true);
      setBooksError('');

      try {
        const response = await fetch(
          `https://libraryhub-mern-jrbk.onrender.com/api/books?search=${encodeURIComponent(search)}&category=${encodeURIComponent(category)}`
        );

        if (!response.ok) {
          throw new Error('Could not load books');
        }

        const data = await response.json();

        if (active) {
          setBooks(data);
        }
      } catch (error) {
        console.error('Error loading books:', error);

        if (active) {
          setBooks([]);
          setBooksError('Could not load books. Please try again.');
        }
      } finally {
        if (active) {
          setLoadingBooks(false);
        }
      }
    }

    loadBooks();

    window.addEventListener('booksChanged', loadBooks);

    return () => {
      active = false;
      window.removeEventListener('booksChanged', loadBooks);
    };
  }, [search, category]);



  return (
    <div className="app">

      <nav className="navbar">
        <a href="#home" className="nav-brand">
          <span className="brand-icon">ðŸ“š</span>
          <span>LibraryHub</span>
        </a>

        <div className="nav-links">
          <a href="#home">Home</a>
          <a href="#books">Explore Books</a>
          <a href="#about">About</a>

          {role === 'member' && (
            <a href="#member-dashboard">My Dashboard</a>
          )}

          {(role === 'librarian' || role === 'admin') && (
            <a href="#librarian-dashboard">
              Librarian Dashboard
            </a>
          )}

          {role === 'admin' && (
            <a href="#admin-dashboard">Admin Dashboard</a>
          )}
        </div>

        <div className="nav-actions">
          {!role ? (
            <>
              <a href="#login">Log in</a>
              <a href="#register" className="nav-primary">
                Get Started
              </a>
            </>
          ) : (
            <a href="#profile" className="nav-profile">
              My Profile
            </a>
          )}
        </div>
      </nav>




      <header className="hero" id="home">
        <h1>Welcome to LibraryHub</h1>
        <p>Discover your next favourite book.</p>

        <div className="search-controls">
          <input
            type="text"
            placeholder="Search for a book..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
          />

          <div className="search-filters">
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Categories</option>
              <option value="Fiction">Fiction</option>
              <option value="Science">Science</option>
              <option value="History">History</option>
              <option value="Adventure">Adventure</option>
            </select>

            <select
              value={availability}
              onChange={(e) => {
                setAvailability(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">All Books</option>
              <option value="available">Available Only</option>
              <option value="unavailable">Unavailable Only</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="title">Title (Aâ€“Z)</option>
              <option value="newest">Newest First</option>
            </select>
          </div>
        </div>
      </header>


      <main id="books">
        <h2>Popular Books</h2>
        {loadingBooks && <p>Loading books...</p>}

        {booksError && (
          <p role="alert">{booksError}</p>
        )}

        {!loadingBooks && !booksError && filteredBooks.length === 0 && (<p>No books found.</p>
        )}
        {reservationMessage && (
          <p role="status">{reservationMessage}</p>
        )}
        <div className="book-container">
          {displayedBooks.map((book) => (
            <div className="book-card" key={book._id}>
              <h3>{book.title}</h3>
              <p>Author: {book.author}</p>
              <p>Category: {book.category}</p>
              <p>ISBN: {book.isbn || 'Not available'}</p>
              <p>Total Copies: {book.totalCopies}</p>
              <p>Available Copies: {book.availableCopies}</p>
              <span>
                {book.availableCopies > 0
                  ? 'Available'
                  : 'Not Available'}
              </span>
              {book.availableCopies === 0 && (
                <p>
                  <strong>Estimated Return:</strong>{' '}
                  {book.expectedReturnDate
                    ? new Date(book.expectedReturnDate).toLocaleDateString('en-IN')
                    : 'Ask the librarian'}
                </p>
              )}

              {role === 'member' && book.availableCopies === 0 && (
                <button
                  type="button"
                  onClick={() => reserveBook(book._id)}
                >
                  Reserve Book
                </button>
              )}

            </div>
          ))}
        </div>
        {!loadingBooks && !booksError && totalPages > 1 && (
          <div style={{ textAlign: 'center', margin: '20px' }}>
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(page => page - 1)}
            >
              Previous
            </button>

            <span style={{ margin: '0 15px' }}>
              Page {currentPage} of {totalPages}
            </span>

            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(page => page + 1)}
            >
              Next
            </button>
          </div>
        )}
      </main>
      <section id='login'>
        <Login />
      </section>

      <section id='register'>
        <Register />
      </section>

      <section id='profile'>
        <Profile />
      </section>


      {role === 'member' && (
        <section id="member-dashboard">
          <MemberDashboard />
        </section>
      )}

      {(role === 'librarian' || role === 'admin') && (
        <section id="librarian-dashboard">
          <LibrarianDashboard />
        </section>
      )}

      {role === 'admin' && (
        <section id="admin-dashboard">
          <AdminDashboard />
        </section>
      )}

      <footer id="about">
        <p>LibraryHub â€” Your gateway to knowledge.</p>
      </footer>
    </div>
  );
}

export default App;

