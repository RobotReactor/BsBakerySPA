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

    const handleContentClick = (e) => {
        e.stopPropagation();
    };

    return (
        <div className="login-modal">
            <div className="login-modal-content" onClick={handleContentClick}>
                <h2>Sign Up</h2>
                <div className='name-fields'>
                    <input
                        type="text"
                        placeholder="First Name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                    />
                    {/* Last Name Field */}
                    <input
                        type="text"
                        placeholder="Last Name"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                    />
                </div>
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
                <button className='cancel-button' onClick={() => onClose(false)}>Cancel</button>
                <button className='signup-button' onClick={onSignUp}>Sign Up</button>
            </div>
        </div>
    );
};
  
export default SignUpModal;
  