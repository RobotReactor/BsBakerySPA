import React, { useState } from 'react';
import { useAuth } from "./hooks/useAuth"; 
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
    const { login, signUp, guestSignIn, logout, user } = useAuth(); // Call useAuth at the top
    const navigate = useNavigate();
    const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
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

    const handleSignUp = async () => {
        if (password !== confirmPassword) {
            setError("Passwords do not match!");
            return;
        }

        try {
            await signUp(email, password); // Use the signUp function from useAuth
            setIsSignUpModalOpen(false); 
            setEmail('');
            setPassword('');
            setConfirmPassword('');
            setError('');
        } catch (err) {
            setError(err.message);
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
            <form onSubmit={handleLogin}>
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
            <button onClick={() => setIsSignUpModalOpen(true)}>Sign Up</button>

            {isSignUpModalOpen && (
                <div className="login-modal">
                    <div className="login-modal-content">
                        <h2>Sign Up</h2>
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
                        <input
                            type="password"
                            placeholder="Confirm Password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                        {error && <p className="error">{error}</p>}
                        <button onClick={() => setIsSignUpModalOpen(false)}>Cancel</button>
                        <button onClick={handleSignUp}>Sign Up</button>
                    </div>
                </div>
            )}

            <button onClick={handleGuestSignIn} className="guest-button">Sign in as Guest</button>
            <button onClick={() => navigate('/')} className="back-button">Back to Home</button>
        </div>
    );
};

export default LoginPage;