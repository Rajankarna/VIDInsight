
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { FileVideo, History, User, LogIn, Settings, MessageSquare, Bug } from "lucide-react";

const Navbar: React.FC = () => {
  const { isAuthenticated, logout, user, isAdmin } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
          <div className="flex-shrink-0 flex items-center">
  <Link to="/" className="flex items-center">
    <img src="/icon.png" alt="Logo" className="h-8 w-8" />
    <span className="ml-2 text-xl font-semibold text-gray-900">VidInsight</span>
  </Link>
</div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                to="/"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive('/') 
                    ? 'border-brand-600 text-gray-900' 
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                Home
              </Link>
              
              <Link
                to="/about"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive('/about') 
                    ? 'border-brand-600 text-gray-900' 
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                About
              </Link>
              
              <Link
                to="/team"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive('/team') 
                    ? 'border-brand-600 text-gray-900' 
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                Team
              </Link>
              
              <Link
                to="/report-bug"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive('/report-bug') 
                    ? 'border-brand-600 text-gray-900' 
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                Report Bug
              </Link>
            </div>
          </div>
          
          <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-4">
            {isAuthenticated ? (
              <>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="inline-flex items-center px-3 py-1 text-sm font-medium text-gray-700 hover:text-brand-600"
                  >
                    <Settings className="w-4 h-4 mr-1" />
                    Admin Dashboard
                  </Link>
                )}
                
                <Link
                  to="/profile"
                  className="inline-flex items-center px-3 py-1 text-sm font-medium text-gray-700 hover:text-brand-600"
                >
                  <User className="w-4 h-4 mr-1" />
                  My Profile
                </Link>
                
                <Link
                  to="/history"
                  className="inline-flex items-center px-3 py-1 text-sm font-medium text-gray-700 hover:text-brand-600"
                >
                  <History className="w-4 h-4 mr-1" />
                  History
                </Link>
                
                <Link
                  to="/process"
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
                >
                  <FileVideo className="w-4 h-4 mr-1" />
                  Analyze Video
                </Link>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={logout}
                  className="ml-2"
                >
                  Logout
                </Button>
              </>
            ) : (
              <div className="flex space-x-2">
                <Link to="/login">
                  <Button variant="outline" size="sm">
                    <LogIn className="w-4 h-4 mr-1" />
                    Login
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button size="sm">Sign up</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
