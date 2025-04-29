import React, { useState, useEffect } from 'react';
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from 'react-router-dom';
import { getAuth, getIdToken } from "firebase/auth";


import '../styles/LoginPage.css';

import SignUpModal from '../components/SignUpModal/SignUpModal.jsx';

const LoginPage = () => {
    const { login, signUp, guestSignIn, user } = useAuth();
    const navigate = useNavigate();
    const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [signUpSuccessMessage, setSignUpSuccessMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false); // Add loading state

    const auth = getAuth();


    const toggleModal = () => {
        setIsSignUpModalOpen(!isSignUpModalOpen);
        document.body.style.overflow = !isSignUpModalOpen ? 'hidden' : 'auto';
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await login(email, password);
            navigate('/');
        } catch (err) {
            console.error("Login error:", err);
            const message = err.code || err.response?.data?.message || err.message || 'Login failed. Please try again.';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignUp = async () => {
        setError('');
        setSignUpSuccessMessage('');
        if (password !== confirmPassword) {
            setError("Passwords do not match!");
            return;
        }

        setIsLoading(true); // Start loading for sign-up process

        try {
            // Step 1: Create user in Firebase Auth
            const userCredential = await signUp(email, password);
            const firebaseUser = userCredential.user;

            // Step 2: Get the ID token for the newly created user
            const idToken = await getIdToken(firebaseUser);

            // Step 3: Call your backend API to create the profile
            const profileData = {
                firstName: firstName,
                lastName: lastName
            };

            const response = await fetch('/api/user', { // Use relative URL or environment variable
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}` // Send the token
                },
                body: JSON.stringify(profileData)
            });

            // --- Improved Error Handling ---
            if (!response.ok) {
                let errorMessage = `Failed to create profile (${response.status})`;
                try {
                    // Check if the response has a JSON content type
                    const contentType = response.headers.get("content-type");
                    if (contentType && contentType.indexOf("application/json") !== -1) {
                        const errorData = await response.json();
                        console.error("API profile creation error (JSON):", errorData);
                        // Use message from JSON if available, otherwise default
                        // Check for common ASP.NET Core error structures (title)
                        errorMessage = errorData.message || errorData.title || errorMessage;
                    } else {
                        // If not JSON, try to get text content
                        const errorText = await response.text();
                        console.error("API profile creation error (Text):", errorText);
                        // Use text content if available and not too long
                        if (errorText) {
                            // Avoid showing overly long stack traces to the user
                            errorMessage = errorText.substring(0, 200) + (errorText.length > 200 ? '...' : '');
                        }
                    }
                } catch (parseError) {
                    // Catch errors during parsing (e.g., empty body)
                    console.error("Error parsing error response:", parseError);
                }
                throw new Error(errorMessage); // Throw the determined error message
            }
            // --- End Improved Error Handling ---

            // --- Success ---
            // Parse the JSON body on success (assuming backend sends created profile)
            const createdProfile = await response.json();
            console.log("Profile created successfully:", createdProfile);

            setSignUpSuccessMessage('Account created successfully! Please log in.');
            toggleModal(); // Close the modal

            // Reset form fields
            setEmail('');
            setPassword('');
            setConfirmPassword('');
            setFirstName('');
            setLastName('');
            setError('');

        } catch (err) {
            console.error("Sign up or profile creation error:", err);
            // Handle Firebase Auth errors
            if (err.code === 'auth/email-already-in-use') {
                setError('This email address is already in use.');
            } else if (err.code === 'auth/weak-password') {
                setError('Password should be at least 6 characters.');
            }
            // Handle API errors or other exceptions
            else {
                // Use the message from the thrown error
                setError(err.message || 'Failed to create account. Please try again.');
            }
            // Keep the modal open on error
        } finally {
             setIsLoading(false); // Stop loading regardless of success or failure
        }
    };

    useEffect(() => {
        if (signUpSuccessMessage) {
            const timer = setTimeout(() => {
                setSignUpSuccessMessage('');
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [signUpSuccessMessage]);

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => {
                setError('');
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    const handleGuestSignIn = async () => {
        setError('');
        setIsLoading(true);
        try {
            await guestSignIn();
            navigate('/');
        } catch (err) {
            console.error("Guest sign in error:", err);
            setError('Guest sign-in failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-page-container">
                <h1>Login to Your Account</h1>
                 {/* Display loading indicator */}
                 {isLoading && <p className="loading-message">Processing...</p>}
                <div className="message-placeholder">
                    {signUpSuccessMessage && <p className="success-message">{signUpSuccessMessage}</p>}
                    {/* Show error only if not loading and modal is closed */}
                    {error && !isLoading && !isSignUpModalOpen && <p className="error-message">{error}</p>}
                </div>
                <form onSubmit={handleLogin}>
                    {/* ... inputs ... */}
                     <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                        disabled={isLoading} // Disable during loading
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                        disabled={isLoading} // Disable during loading
                    />
                    <button type="submit" className="login-button" disabled={isLoading}>
                        {isLoading ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                <button className='start-signup-button' onClick={toggleModal} disabled={isLoading}>Sign Up</button>

                <SignUpModal
                    isOpen={isSignUpModalOpen}
                    onClose={toggleModal}
                    onSignUp={handleSignUp} // Pass the updated handler
                    email={email}
                    setEmail={setEmail}
                    password={password}
                    setPassword={setPassword}
                    confirmPassword={confirmPassword}
                    setConfirmPassword={setConfirmPassword}
                    firstName={firstName} // Ensure these are passed and used
                    setFirstName={setFirstName}
                    lastName={lastName}   // Ensure these are passed and used
                    setLastName={setLastName}
                    error={isSignUpModalOpen ? error : ''} // Show error in modal if open
                    setError={setError}
                    isLoading={isLoading} // Pass loading state to modal if needed
                />

                <button onClick={handleGuestSignIn} className="guest-button" disabled={isLoading}>Sign in as Guest</button>
                <button onClick={() => navigate('/')} className="back-button" disabled={isLoading}>Back to Home</button>
            </div>
        </div>
    )
}

export default LoginPage;