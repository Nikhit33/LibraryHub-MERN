# LibraryHub — Library Management System

LibraryHub is a web-based Library Management System developed using the MERN stack (MongoDB, Express.js, React.js, and Node.js).

The project helps manage books, library members, borrowing records, reservations, renewals, returns, and overdue fines through a simple user interface.

## Technologies Used

**Frontend**
- React.js
- Vite
- JavaScript
- HTML and CSS
- jsPDF

**Backend**
- Node.js
- Express.js
- MongoDB
- Mongoose

**Authentication and Other Libraries**
- JSON Web Token (JWT)
- bcrypt
- Nodemailer
- CORS
- Oxlint

## Main Features

### Admin
- Manage library books and users.
- Access administrative dashboard features.
- Configure library settings.
- View library borrowing and transaction information.

### Librarian
- Issue books to members.
- Return borrowed books.
- Manage borrowing records.
- Record overdue fine payments.
- Handle library operations.

### Member
- View available books.
- View borrowing records.
- Renew eligible borrowed books.
- Reserve books.
- Cancel reservations.
- Check borrowing and fine information.
- Manage profile information.

## Project Structure

```text
LibraryHub/
├── package.json
├── backend/
│   ├── server.js
│   ├── package.json
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
    ├── README.md
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

Install the following software before running the project:

- Node.js and npm
- A MongoDB database connection
- Visual Studio Code or another code editor

### 1. Install Backend Dependencies

Open a terminal in the main project folder:

```bash
cd backend
npm install
```

### 2. Start the Backend

```bash
node server.js
```

The backend is configured to run on:

`http://localhost:5000`

Make sure the MongoDB connection configured in the backend is accessible.

### 3. Install Frontend Dependencies

Open another terminal in the main project folder:

```bash
cd frontend
npm install
```

### 4. Start the Frontend

```bash
npm run dev
```

Open the local address displayed by Vite in your terminal.

### 5. Create a Production Build

From the frontend folder:

```bash
npm run build
npm run preview
```

During project testing, the production preview was accessed at:

`http://localhost:4173`

## Library Workflow

1. A user registers or logs in.
2. Admin and Librarian users manage library operations according to their permissions.
3. Members can view books and their borrowing information.
4. A Librarian issues a book to a member.
5. The system stores the borrowing transaction and due date.
6. Eligible books can be renewed.
7. Returned books are added back to the available inventory.
8. Overdue fines are calculated when an overdue book is returned.
9. Authorized staff can record fine payments.
10. Members can create and cancel reservations.

## Testing

The following workflows were manually tested:

- Login and role-based dashboard access
- Book issuing and borrowing records
- Book return and inventory updates
- Book renewal
- Reservation creation and availability updates
- Reservation cancellation
- Overdue fine calculation
- Fine payment status updates
- Browser compatibility with Chrome, Edge, and Firefox
- Mobile responsiveness

The production frontend also achieved a Lighthouse score of 100/100 during testing.

**Testing note:** Email reminder delivery has not been fully verified through an actual email delivery test.

## Future Improvements

Possible future improvements include:

- Automated testing
- Deployment to a hosting platform
- More detailed reporting and analytics
- Additional email notification testing

## Project Purpose

This project was developed to practice full-stack web development using the MERN stack and understand how frontend interfaces, backend APIs, authentication, and MongoDB work together in a real application.