
import { useState } from 'react';

function Login() {

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');

    function handleLogout() {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('role');

        window.dispatchEvent(new Event("authChanged"));

        setEmail('');
        setPassword('');
        setMessage('Logged out successfully');
    }

    async function handleLogin(e) {
        e.preventDefault();

        setMessage('');

        try {
            const response = await fetch('http://localhost:5000/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });

            const data = await response.json();

            if (response.ok) {
                sessionStorage.setItem('token', data.token);
                sessionStorage.setItem('role', data.user.role);

                window.dispatchEvent(new Event("authChanged"));

                setMessage('Login successful!');
                setPassword('');

                console.log('Login successful');

            } else {
                setMessage(data.message || 'Login failed');
            }

        } catch (error) {
            console.log('Login error:', error);
            setMessage('Something went wrong. Please try again.');
        }
    }

    return (
        <div className="login-container">

            <h2>Login to LibraryHub</h2>

            <form onSubmit={handleLogin}>
                <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />

                <input
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />

                <button type="submit">Login</button>
            </form>

            <p>{message}</p>

            <button type="button" onClick={handleLogout}>
                Logout
            </button>

        </div>
    );
}

export default Login;
