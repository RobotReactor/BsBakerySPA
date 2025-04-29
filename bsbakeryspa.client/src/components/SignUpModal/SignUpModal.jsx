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
    onSignUp 
}) => {
    if (!isOpen) {
        return null;
    }


    const handleSubmit = (e) => {
        e.preventDefault(); 
        onSignUp(); 
    };

    return (
        <div className="login-modal" onClick={onClose}>
            <form className="login-modal-content" onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()}>
                <h2>Sign Up</h2>
                <div className='name-fields'>
                    <input
                        type="text"
                        placeholder="First Name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                        autoComplete="given-name" 
                    />
                    <input
                        type="text"
                        placeholder="Last Name"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                        autoComplete="family-name"
                    />
                </div>
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                />
                <input
                    type="password"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                />
                {error && <p className="error">{error}</p>}
                <button type='submit' className='signup-button'>Sign Up</button>
                <button type='button' className='cancel-button' onClick={onClose}>Cancel</button>
            </form>
        </div>
    );
};

export default SignUpModal;
