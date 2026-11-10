import { useState, useEffect } from 'react';
function MemberDashboard() {

    const [transactions, setTransactions] = useState([]);

    const [reservations, setReservations] = useState([]);
    const [reservationLoading, setReservationLoading] = useState(true);
    const [reservationError, setReservationError] = useState("");
    const availableReservations = reservations.filter(
        (reservation) =>
            reservation.status === "available" &&
            reservation.expiresAt &&
            new Date(reservation.expiresAt) > new Date()
    );

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    const [authVersion, setAuthVersion] = useState(0);

    async function renewBook(transaction) {
        const confirmRenew = window.confirm(
            `Do you want to renew "${transaction.book?.title || 'this book'}"?`
        );

        if (!confirmRenew) {
            return;
        }

        const token = sessionStorage.getItem("token");

        if (!token) {
            alert("Please log in first.");
            return;
        }

        try {
            const response = await fetch(
                `https://libraryhub-mern-jrbk.onrender.com/api/transactions/${transaction._id}/renew`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (response.ok) {
                alert("Book renewed successfully!");
                window.dispatchEvent(new Event("transactionsChanged"));
            } else {
                alert(data.message || "Could not renew book");
            }
        } catch (error) {
            console.log("Renewal error:", error);
            alert("Something went wrong while renewing.");
        }
    }

    async function cancelReservation(reservationId) {
        const token = sessionStorage.getItem("token");

        if (!token) {
            alert("Please log in first.");
            return;
        }

        try {
            const response = await fetch(
                `https://libraryhub-mern-jrbk.onrender.com/api/reservations/${reservationId}/cancel`,
                {
                    method: "PATCH",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (response.ok) {
                alert("Reservation cancelled successfully");

                setAuthVersion(version => version + 1);
            } else {
                alert(data.message || "Could not cancel reservation");
            }

        } catch (error) {
            console.log("Cancellation error:", error);
            alert("Something went wrong while cancelling.");
        }
    }


    useEffect(() => {
        setReservationLoading(true);
        setReservationError("");
        setReservations([]);

        const token = sessionStorage.getItem("token");

        if (!token) {
            setReservationError("Please log in to view your reservations.");
            setReservationLoading(false);
            return;
        }

        fetch("https://libraryhub-mern-jrbk.onrender.com/api/reservations/my", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error("Could not load reservations");
                }

                return response.json();
            })
            .then(data => {
                setReservations(data);
            })
            .catch(error => {
                console.log("Error loading reservations:", error);
                setReservationError("Could not load reservations.");
            })
            .finally(() => {
                setReservationLoading(false);
            });

    }, [authVersion]);


    useEffect(() => {// Fetchs the borrowing records for the logged-in user
        setLoading(true);
        setError("");
        setTransactions([]);

        const token = sessionStorage.getItem("token"); //Get the login token from session storage

        if (!token) {
            setError("Please log in to view your borrowing records.");
            setLoading(false);
            return;
        }


        fetch("https://libraryhub-mern-jrbk.onrender.com/api/transactions/my", { //requests the borrowing history from the backend API
            headers: {
                Authorization: `Bearer ${token}`
            }
        })

            .then(response => {
                if (!response.ok) {
                    throw new Error("Could not load borrowing records");
                }

                return response.json();
            })
            //converts the response into js dara

            .then(data => {
                setTransactions(data);
            })

            .catch(error => {
                console.log("Error loading borrowing records:", error);
                setError("Could not load borrowing records. Please try again.");
            })

            .finally(() => {
                setLoading(false);
            });

    }, [authVersion]); // The effect will re-run whenever authVersion changes, which happens on login/logout


    useEffect(() => {
        function refreshDashboard() {
            setAuthVersion(version => version + 1);
        }

        window.addEventListener("authChanged", refreshDashboard);
        window.addEventListener("transactionsChanged", refreshDashboard);
        window.addEventListener("reservationsChanged", refreshDashboard);

        return () => {
            window.removeEventListener("authChanged", refreshDashboard);
            window.removeEventListener("transactionsChanged", refreshDashboard);
            window.removeEventListener("reservationsChanged", refreshDashboard);
        };
    }, []);
    useEffect(() => {
        const interval = setInterval(() => {
            setAuthVersion(version => version + 1);
        }, 30000);

        return () => clearInterval(interval);
    }, []);


    return (
        <div className="login-container">

            <h2>Member Dashboard</h2>

            <p>Welcome to your LibraryHub dashboard!</p>

            {/* Reservation Notifications */}
            <section style={{ marginBottom: "25px" }}>
                <h3>Notifications</h3>

                {availableReservations.length > 0 ? (
                    availableReservations.map((reservation) => (
                        <div
                            key={reservation._id}
                            role="status"
                            style={{
                                backgroundColor: "#e8f5e9",
                                border: "1px solid #81c784",
                                padding: "12px",
                                marginBottom: "10px",
                                borderRadius: "6px"
                            }}
                        >
                            <strong>Book Available!</strong>

                            <p>
                                Your reserved book{" "}
                                <strong>
                                    {reservation.book?.title || "Unknown Book"}
                                </strong>{" "}
                                is ready for collection.
                            </p>

                            <p>
                                Please collect it before{" "}
                                {new Date(reservation.expiresAt).toLocaleString("en-IN")}.
                            </p>
                        </div>
                    ))
                ) : (
                    <p>No new reservation notifications.</p>
                )}
            </section>

            <h3>My Library</h3>

            {loading && <p>Loading borrowing records...</p>}

            {error && <p style={{ color: "red" }}>{error}</p>}


            {!loading && !error && transactions.length === 0 && (
                <p>You have no borrowing records yet.</p>
            )}


            {Array.isArray(transactions) && transactions.map((transaction) => ( // this checks the receved data is a list and then iterates over each borrowing record to display the book title and author. If the book information is missing, it displays "Unknown Book" or "Unknown" as a fallback.
                <div key={transaction._id}>
                    <p>
                        <strong>Book:</strong> {transaction.book?.title || "Unknown Book"}
                    </p>
                    <p>
                        <strong>Author:</strong> {transaction.book?.author || "Unknown"}
                    </p>

                    <p>
                        <strong>Due Date:</strong> {new Date(transaction.dueDate).toLocaleDateString("en-IN")}
                    </p>


                    <p>
                        <strong>Status:</strong>{" "}
                        {transaction.returnDate
                            ? "Returned"
                            : new Date(transaction.dueDate) < new Date()
                                ? "Overdue"
                                : "Issued"}
                    </p>

                    <p>
                        <strong>Fine Amount:</strong>{" "}
                        â‚¹{transaction.fineAmount || 0}
                    </p>

                    <p>
                        <strong>Fine Payment:</strong>{" "}
                        {transaction.fineAmount > 0
                            ? (transaction.finePaid ? "Paid" : "Unpaid")
                            : "No fine"}
                    </p>

                    {transaction.status === "issued" &&
                        transaction.renewCount === 0 &&
                        new Date(transaction.dueDate) >= new Date() && (
                            <button
                                type="button"
                                onClick={() => renewBook(transaction)}
                            >
                                Renew Book
                            </button>
                        )}


                    <hr />
                </div>
            ))}


            <p>View your borrowing history, due dates, renewals, and fines here.</p>

            <h3>My Reservations</h3>

            {reservationLoading && <p>Loading reservations...</p>}

            {reservationError && (
                <p style={{ color: "red" }}>{reservationError}</p>
            )}

            {!reservationLoading && !reservationError && reservations.length === 0 && (
                <p>You have no reservations yet.</p>
            )}

            {!reservationLoading && !reservationError && Array.isArray(reservations) &&
                reservations.map((reservation) => (
                    <div key={reservation._id}>
                        <p>
                            <strong>Book:</strong> {reservation.book?.title || "Unknown Book"}
                        </p>

                        <p>
                            <strong>Author:</strong> {reservation.book?.author || "Unknown"}
                        </p>

                        <p>
                            <strong>Status:</strong> {reservation.status}
                        </p>

                        <p>
                            <strong>Reserved On:</strong>{" "}
                            {new Date(reservation.reservedAt).toLocaleDateString("en-IN")}
                        </p>

                        {reservation.expiresAt && (
                            <p>
                                <strong>Collect Before:</strong>{" "}
                                {new Date(reservation.expiresAt).toLocaleString("en-IN")}
                            </p>
                        )}
                        {(reservation.status === "pending" ||
                            reservation.status === "available") && (
                                <button
                                    type="button"
                                    onClick={() => cancelReservation(reservation._id)}
                                >
                                    Cancel Reservation
                                </button>
                            )}

                        <hr />
                    </div>
                ))
            }


        </div>
    );
}

export default MemberDashboard;

