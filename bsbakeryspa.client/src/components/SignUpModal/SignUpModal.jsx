// src/components/SignUpModal/SignUpModal.jsx
import React from 'react';
import '../../styles/SignUpModal.css';

const SignUpModal = ({
    isOpen,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    error,
    onClose,
    onSignUp // This function comes from LoginPage and handles the logic
    // Removed setError and setLoading from internal scope as they are not needed here
}) => {
    if (!isOpen) {
        return null;
    }

    // --- Remove the internal handleSignUp function (lines 24-44) ---
    // const handleSignUp = async (e) => { ... }; // DELETE THIS FUNCTION

    // Function to handle form submission
    const handleSubmit = (e) => {
        e.preventDefault(); // Prevent default form submission
        onSignUp(); // Call the function passed from LoginPage
    };

    return (
        // Add onClick handler to the backdrop to close the modal (optional but good UX)
        <div className="login-modal" onClick={onClose}>
            {/* Prevent clicks inside the content from closing the modal */}
            <form className="login-modal-content" onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()}>
                <h2>Sign Up</h2>
                <div className='name-fields'>
                    <input
                        type="text"
                        placeholder="First Name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                        autoComplete="given-name" // Add autocomplete
                    />
                    <input
                        type="text"
                        placeholder="Last Name"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                        autoComplete="family-name" // Add autocomplete
                    />
                </div>
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
                    autoComplete="new-password" // Add autocomplete
                />
                <input
                    type="password"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password" // Add autocomplete
                />
                {/* Display the error passed down from LoginPage */}
                {error && <p className="error">{error}</p>}
                {/* Change button type to submit and remove onClick */}
                <button type='submit' className='signup-button'>Sign Up</button>
                {/* Keep cancel button type as button */}
                <button type='button' className='cancel-button' onClick={onClose}>Cancel</button>
            </form>
        </div>
    );
};

export default SignUpModal;
