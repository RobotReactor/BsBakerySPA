import React, { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
    const { login, guestSignIn } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            await login(email, password);
            navigate('/'); 
        } catch (err) {
            setError('Invalid email or password. Please try again.');
        }
    };

    const handleGuestSignIn = async () => {
        try {
            await guestSignIn();
            navigate('/'); 
        } catch (err) {
            setError('Guest sign-in failed. Please try again.');
        }
    };

    return (
        <div className="login-page">
            <h1>Login to Your Account</h1>
            <form className="login-form" onSubmit={handleLogin}>
                {error && <p className="error-message">{error}</p>}
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <button type="submit" className="login-button">Login</button>
            </form>
            <button onClick={handleGuestSignIn} className="guest-button">Sign in as Guest</button>
            <button onClick={() => navigate('/')} className="back-button">Back to Home</button>
        </div>
    );
};

export default LoginPage;