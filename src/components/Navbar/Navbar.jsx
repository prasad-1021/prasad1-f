import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import logoSvg from '../../assets/logo.svg';
import './Navbar.module.css';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/signin');
        } catch (error) {
            console.error('Failed to logout', error);
        }
    };

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isMenuOpen && !event.target.closest('.nav-menu')) {
                setIsMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isMenuOpen]);

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <Link to="/" className="navbar-logo">
                    <img src={logoSvg} alt="Logo" className="logo" />
                </Link>

                <div className={`nav-menu ${isMenuOpen ? 'active' : ''}`}>
                    {user ? (
                        <>
                            <Link to="/events" className="nav-item">Events</Link>
                            <Link to="/availability" className="nav-item">Availability</Link>
                            <Link to="/profile" className="nav-item">Profile</Link>
                            <Link to="/settings" className="nav-item">Settings</Link>
                            <button onClick={handleLogout} className="nav-button">Sign Out</button>
                        </>
                    ) : (
                        <>
                            <Link to="/signin" className="nav-item">Sign In</Link>
                            <Link to="/signup" className="nav-item">Sign Up</Link>
                        </>
                    )}
                </div>
                
                <div className="menu-icon" onClick={toggleMenu}>
                    <i className={isMenuOpen ? 'fas fa-times' : 'fas fa-bars'} />
                </div>
            </div>
        </nav>
    );
};

export default Navbar; 