
import { useState } from 'react';

function Profile() {

    const [user, setUser] = useState(null);
    const [message, setMessage] = useState('');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');

    async function getProfile() {

        const token = sessionStorage.getItem('token');

        if (!token) {
            setMessage('Please login first.');
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/api/profile', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (response.ok) {
                setUser(data.user);
                setName(data.user.name || '');
                setPhone(data.user.phone || '');
                setMessage('');
            } else {
                setUser(null);
                setMessage(data.message || 'Could not load profile');
            }

        } catch (error) {
            console.error('Profile error:', error);
            setMessage(`Could not load profile: ${error.message}`);
        }
    }
    async function updateProfile(e) {
        e.preventDefault();

        const token = sessionStorage.getItem('token');

        try {
            const response = await fetch('http://localhost:5000/api/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ name, phone })
            });

            const data = await response.json();

            if (response.ok) {
                setUser(data.user);
                setMessage(data.message);
            } else {
                setMessage(data.message || 'Could not update profile');
            }

        } catch (error) {
            console.error('Profile update error:', error);
            setMessage('Could not connect to the server');
        }
    }

    async function changePassword(e) {
        e.preventDefault();

        const token = sessionStorage.getItem('token');

        try {
            const response = await fetch(
                'http://localhost:5000/api/profile/password',
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        currentPassword,
                        newPassword
                    })
                }
            );

            const data = await response.json();

            setMessage(data.message || 'Could not change password');

            if (response.ok) {
                setCurrentPassword('');
                setNewPassword('');
            }

        } catch (error) {
            console.error('Password change error:', error);
            setMessage('Could not connect to the server');
        }
    }

    return (
        <div className="login-container">

            <h2>My Profile</h2>

            <button onClick={getProfile}>
                View Profile
            </button>

            {user && (
                <div>
                    <p>Name: {user.name}</p>
                    <p>Email: {user.email}</p>
                    <p>Role: {user.role}</p>
                </div>
            )}
            {user && (
                <>
                    <h3>Edit Profile</h3>

                    <form onSubmit={updateProfile}>
                        <input
                            type="text"
                            placeholder="Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />

                        <input
                            type="tel"
                            placeholder="Phone Number"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                        />

                        <button type="submit">
                            Save Profile
                        </button>
                    </form>

                    <h3>Change Password</h3>

                    <form onSubmit={changePassword}>
                        <input
                            type="password"
                            placeholder="Current Password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            required
                        />

                        <input
                            type="password"
                            placeholder="New Password (minimum 8 characters)"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            minLength="8"
                            required
                        />

                        <button type="submit">
                            Change Password
                        </button>
                    </form>
                </>
            )}

            <p>{message}</p>

        </div>
    );
}

export default Profile;