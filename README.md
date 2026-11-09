# LibraryHub — Library Management System

LibraryHub is a web-based Library Management System developed using the MERN stack (MongoDB, Express.js, React.js, and Node.js).

The project helps manage books, library members, borrowing records, reservations, renewals, returns, and overdue fines through a simple and user-friendly interface.

## Technologies Used

### Frontend
- React.js
- Vite
- JavaScript
- HTML and CSS
- jsPDF

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose

### Authentication and Other Libraries
- JSON Web Token (JWT)
- bcrypt
- Nodemailer
- CORS
- Oxlint

## Main Features

### Admin
- Manage library books and users.
- Manage librarian accounts.
- Access the admin dashboard.
- Configure library settings.
- View borrowing records and reports.
- Manage library operations according to admin permissions.

### Librarian
- Add, update, and manage books.
- Issue books to registered members.
- Process book returns.
- Manage borrowing records.
- Record overdue fine payments.
- View library reports.

### Member
- View and search library books.
- View personal borrowing records.
- Renew eligible borrowed books.
- Reserve unavailable books.
- Cancel reservations.
- Check borrowing and fine information.
- Manage profile information.

## Project Structure

```text
Library Management System/
├── .gitignore
├── README.md
├── package.json
├── package-lock.json
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── package-lock.json
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   └── roleMiddleware.js
│   └── models/
│       ├── Book.js
│       ├── EmailReminder.js
│       ├── Reservation.js
│       ├── Settings.js
│       ├── Transaction.js
│       └── User.js
└── frontend/
    ├── package.json
    ├── package-lock.json
    ├── README.md
    ├── index.html
    ├── vite.config.js
    ├── public/
    └── src/
        ├── App.jsx
        ├── App.css
        ├── AdminDashboard.jsx
        ├── LibrarianDashboard.jsx
        ├── MemberDashboard.jsx
        ├── Login.jsx
        ├── Register.jsx
        ├── Profile.jsx
        ├── main.jsx
        └── index.css
```

## How to Run the Project

### Requirements

Install or prepare the following:

- Node.js and npm
- MongoDB database connection
- Git
- Visual Studio Code or another code editor

### 1. Clone the Repository

```bash
git clone https://github.com/Nikhit33/LibraryHub-MERN.git
cd LibraryHub-MERN
```

### 2. Environment Configuration

The backend requires the following environment variables:

| Variable | Purpose |
|---|---|
| `MONGO_URI` | MongoDB database connection string |
| `JWT_SECRET` | Secret key used for JWT authentication |

The backend also supports SMTP environment variables for email reminders. These must be configured when email sending is enabled.

**Important:** This project does not use a `.env` file. Environment variables must be configured through the operating system, terminal session, or deployment platform.

Never upload database passwords, JWT secrets, or email credentials to GitHub.

### 3. Install Backend Dependencies

Open a terminal in the project folder:

```bash
cd backend
npm install
```

### 4. Start the Backend

Make sure the required environment variables are configured, then run:

```bash
node server.js
```

The backend runs locally at:

http://localhost:5000

The backend uses MongoDB to store users, books, transactions, reservations, library settings, and email reminder records.

### 5. Install Frontend Dependencies

Open another terminal in the project folder:

```bash
cd frontend
npm install
```

### 6. Start the Frontend

```bash
npm run dev
```

Open the local URL displayed by Vite in the terminal.

The frontend communicates with the Express backend to perform library operations.

### 7. Create a Production Build

From the frontend directory:

```bash
npm run build
npm run preview
```

During project testing, the frontend production preview was accessed at:

http://localhost:4173

## Library Workflow

1. A new member registers or an existing user logs in.
2. JWT authentication verifies the user.
3. Role-based authorization controls access to features.
4. Admins and librarians manage library operations.
5. Members browse and search available books.
6. A librarian issues a book to an eligible member.
7. The system records the transaction and calculates the due date.
8. Eligible borrowed books can be renewed once.
9. Members can reserve unavailable books.
10. Returned books are added back to available inventory.
11. Overdue fines are calculated when overdue books are returned.
12. Authorized staff can record fine payments.
13. Reservation availability is updated when books become available.

## Library Settings

The admin can configure the following library rules:

| Setting | Default Value |
|---|---|
| Loan period | 14 days |
| Fine per overdue day | 5 |
| Maximum borrowed books per member | 3 |
| Maximum unpaid fine threshold | 50 |

The system uses these settings to enforce borrowing rules and calculate fines.

## Authentication and Security

LibraryHub implements:

- JWT-based authentication.
- Password hashing using bcrypt.
- Role-based access control for members, librarians, and admins.
- Protected backend API routes.
- User account activation status checks.
- Input validation for library operations.

Passwords are stored as hashes rather than plain text.

## Email Reminder Feature

The backend includes email reminder functionality using Nodemailer.

The system supports:

- Due-soon reminders.
- Overdue reminders.
- Reminder records stored in MongoDB.
- Duplicate reminder prevention using a compound unique index.

**Testing limitation:** Actual email delivery has not yet been fully verified.

## Testing

The following workflows were manually tested:

- Login and role-based dashboard access.
- Book issuing and member borrowing records.
- Book returns and inventory updates.
- Book renewal.
- Reservation creation and availability updates.
- Reservation cancellation.
- Overdue fine calculation.
- Manual fine payment status updates.
- Browser compatibility with Chrome, Edge, and Firefox.
- Mobile responsiveness.

The frontend production preview also achieved a Lighthouse score of 100/100 during testing.

Fine payments are recorded manually by authorized staff. The application does not currently process online payments.

## Application Screenshots

Screenshots of the application will be added to demonstrate the completed user interface.

Planned screenshots include:

- Login page.
- Admin dashboard.
- Librarian dashboard.
- Member dashboard.
- Book management.
- Borrowing and reservation workflows.

## Future Improvements

Possible future improvements include:

- Automated API and frontend testing.
- More detailed reports and analytics.
- Additional email notification testing.
- Online fine payment integration.
- Further user interface improvements.

## Project Purpose

This project was developed to practice full-stack web development using the MERN stack and understand how frontend interfaces, backend APIs, authentication, authorization, and MongoDB work together in a real-world application.

LibraryHub demonstrates library operations through a role-based web application that helps organize books, borrowing transactions, reservations, and overdue fines.

## Project Repository

GitHub: https://github.com/Nikhit33/LibraryHub-MERN