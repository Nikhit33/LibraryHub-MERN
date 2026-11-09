
import { useState } from 'react';

function Register() {

    const [name, setName] = useState('');

    const [email, setEmail] = useState('');

    const [password, setPassword] = useState('');

    const [message, setMessage] = useState('');

    async function handleRegister(e) {
        e.preventDefault();

        setMessage('');

        try {
            const response = await fetch('http://localhost:5000/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: name,
                    email: email,
                    password: password
                })
            });

            const data = await response.json();

            if (response.ok) {
                setMessage('Registration successful!');
                setName('');
                setEmail('');
                setPassword('');
            } else {
                setMessage(data.message || 'Registration failed');
            }

        } catch (error) {
            console.log('Registration error:', error);
            setMessage('Something went wrong. Please try again.');
        }
    }


    return (
        <div className="login-container">

            <h2>Register to LibraryHub</h2>

            <form onSubmit={handleRegister}>
                <input
                    type="text"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />

                <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />

                <input
                    type="password"
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />

                <button type="submit">Register</button>
            </form>

            <p>{message}</p>

        </div>
    );
}

export default Register;