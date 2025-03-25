import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, LogIn, UserPlus, LogOut } from 'lucide-react';

const Navbar = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const navigate = useNavigate();

  // Check authentication status on component mount
  useEffect(() => {
    const token = localStorage.getItem('docbot_token');
    const storedEmail = localStorage.getItem('docbot_user_email');
    
    if (token) {
      setIsLoggedIn(true);
      setUserEmail(storedEmail || '');
    } else {
      setIsLoggedIn(false);
    }
  }, []);

  const handleLogout = () => {
    // Clear authentication tokens and user info
    localStorage.removeItem('docbot_token');
    localStorage.removeItem('docbot_user_email');
    
    // Update state
    setIsLoggedIn(false);
    setUserEmail('');
    
    // Redirect to login page
    navigate('/login');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#001040] border-b-2 border-cyan-400 shadow-lg">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        {/* Logo/Brand */}
        <Link to="/" className="flex items-center space-x-2">
          <div className="text-cyan-400" size={30} />
          <span className="text-2xl font-bold text-cyan-300">DocBot</span>
        </Link>

        {/* Navigation Actions */}
        <div className="flex items-center space-x-4">
          {isLoggedIn ? (
            // Logged In State
            <div className="flex items-center space-x-4">
              {/* User Email/Profile */}
              <div className="flex items-center space-x-2 bg-[#002060] px-4 py-2 rounded-lg">
                <User className="text-cyan-400" size={20} />
                <span className="text-cyan-200 max-w-[150px] truncate">
                  {userEmail}
                </span>
              </div>

              {/* Logout Button */}
              <button 
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <LogOut size={20} />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            // Logged Out State
            <div className="flex items-center space-x-4">
              {/* Login Button */}
              <Link 
                to="/login"
                className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <LogIn size={20} />
                <span>Login</span>
              </Link>

              {/* Signup Button */}
              <Link 
                to="/signup"
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <UserPlus size={20} />
                <span>Sign Up</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;