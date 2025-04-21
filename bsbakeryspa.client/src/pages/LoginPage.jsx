import React, { useState, useEffect } from 'react';
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from 'react-router-dom';

import '../styles/LoginPage.css';

import SignUpModal from '../components/SignUpModal/SignUpModal';

const LoginPage = () => {
    const { login, signUp, guestSignIn, logout, user } = useAuth(); // Call useAuth at the top
    const navigate = useNavigate();
    const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [signUpSuccessMessage, setSignUpSuccessMessage] = useState('');


    const toggleModal = () => {
        setIsSignUpModalOpen(!isSignUpModalOpen);
        // Consider moving this side effect into a useEffect hook listening to isSignUpModalOpen
        document.body.style.overflow = !isSignUpModalOpen ? 'hidden' : 'auto';
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError(''); // Clear previous errors
        try {
            await login(email, password);
            navigate('/');
        } catch (err) {
            console.error("Login error:", err); // Log the actual error for debugging
            setError('Invalid email or password. Please try again.');
        }
    };

    const handleSignUp = async () => {
        setError('');
        setSignUpSuccessMessage(''); 
        if (password !== confirmPassword) {
            setError("Passwords do not match!");
            return;
        }

        try {
            await signUp(email, password); // Call the signUp function from useAuth

            // --- Success ---
            setSignUpSuccessMessage('Account created successfully! Please log in.'); // Set success message
            toggleModal(); // Close the modal

            // Reset form fields
            setEmail('');
            setPassword('');
            setConfirmPassword('');
            setFirstName('');
            setLastName('');
            setError(''); // Clear any previous errors just in case

        } catch (err) {
            // ... (existing error handling) ...
            console.error("Sign up error:", err);
            if (err.code === 'auth/email-already-in-use') {
                setError('This email address is already in use.');
            } else if (err.code === 'auth/weak-password') {
                setError('Password should be at least 6 characters.');
            } else {
                setError('Failed to create account. Please try again.');
            }
            // Keep the modal open on error
        }
    };

    useEffect(() => {
        if (signUpSuccessMessage) {
            const timer = setTimeout(() => {
                setSignUpSuccessMessage('');
            }, 5000); // Clear after 5 seconds
            return () => clearTimeout(timer); // Cleanup timer on unmount or if message changes
        }
    }, [signUpSuccessMessage]);

    useEffect(() => {
        if (error) { // Check if there is an error message
            const timer = setTimeout(() => {
                setError(''); // Clear the error after 5 seconds
            }, 5000); // Adjust time as needed (5000ms = 5 seconds)
            // Cleanup function to clear the timer if the error changes or component unmounts
            return () => clearTimeout(timer);
        }
    }, [error]);

    const handleGuestSignIn = async () => {
        setError(''); // Clear previous errors
        try {
            await guestSignIn();
            navigate('/');
        } catch (err) {
            console.error("Guest sign in error:", err); // Log the actual error
            setError('Guest sign-in failed. Please try again.');
        }
    };

    return (
        <div className="login-page">
            <div className="login-page-container">
                <h1>Login to Your Account</h1>
                <div className="message-placeholder"> 
                    {signUpSuccessMessage && <p className="success-message">{signUpSuccessMessage}</p>}
                    {error && !isSignUpModalOpen && <p className="error-message">{error}</p>}
                </div>
                <form onSubmit={handleLogin}>
                <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email" // Add autocomplete
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="current-password" // Add autocomplete
                    />
                    <button type="submit" className="login-button">Login</button>
                </form>

                {/* Corrected onClick handler */}
                <button className='start-signup-button' onClick={toggleModal}>Sign Up</button>

                <SignUpModal
                    isOpen={isSignUpModalOpen}
                    onClose={toggleModal}
                    onSignUp={handleSignUp}
                    email={email}
                    setEmail={setEmail}
                    password={password}
                    setPassword={setPassword}
                    confirmPassword={confirmPassword}
                    setConfirmPassword={setConfirmPassword}
                    firstName={firstName}
                    setFirstName={setFirstName}
                    lastName={lastName}
                    setLastName={setLastName}
                    error={isSignUpModalOpen ? error : ''}
                    setError={setError}
                />

                <button onClick={handleGuestSignIn} className="guest-button">Sign in as Guest</button>
                <button onClick={() => navigate('/')} className="back-button">Back to Home</button>
            </div>
        </div>
    )
}

export default LoginPage;
