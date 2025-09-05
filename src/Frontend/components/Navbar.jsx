// Your existing Navbar component with user info added
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";

const Navbar = ({ user, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const links = [
    { name: "Home", path: "/" },
    { name: "About", path: "/about" },
    { name: "Services", path: "/services" },
    { name: "Contact", path: "/contact" },
  ];

  const renderLink = ({ name, path }) => {
    const isActive = location.pathname === path;

    return (
      <Link
        key={path}
        to={path}
        className={`${
          isActive ? "text-gray-400 pointer-events-none" : "hover:text-gray-400"
        }`}
      >
        {name}
      </Link>
    );
  };

  return (
    <nav className="bg-white text-black shadow-md font-poppins">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Company Name */}
          <div className="flex items-center">
            <div className="text-2xl">
              <Link to="/" className="flex items-center">
                <img src="/Logo.png" alt="Logo" className="h-8 w-8 mr-2" />
                Syntaxia
              </Link>
            </div>
          </div>

          {/* Links for Large Screens */}
          <div className="hidden md:flex items-center space-x-16">
            <div className="flex space-x-16">
              {links.map(renderLink)}
            </div>
            
            {/* User Info & Logout (Desktop) */}
            {user && (
              <div className="flex items-center space-x-4 ml-8">
                <span className="text-sm text-gray-600">
                  Hello, {user.first_name} {user.last_name}
                </span>
                <button
                  onClick={onLogout}
                  className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors text-sm"
                >
                  Logout
                </button>
              </div>
            )}
          </div>

          {/* Hamburger Menu for Small Screens */}
          <div className="md:hidden">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              {!isOpen && (
                <>
                  <div className="w-6 h-0.5 bg-black mb-1"></div>
                  <div className="w-6 h-0.5 bg-black mb-1"></div>
                  <div className="w-6 h-0.5 bg-black"></div>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar for Small Screens */}
      <div
        className={`fixed inset-y-0 right-0 bg-gray-200 opacity-95 w-full z-50 transform ${
          isOpen ? "translate-x-0" : "translate-x-full"
        } transition-transform duration-300 ease-in-out`}
      >
        <button
          onClick={toggleSidebar}
          className="absolute top-5 right-5 text-black text-2xl font-bold focus:outline-none"
        >
          &times;
        </button>
        <div className="mt-16 flex flex-col space-y-6 px-6">
          {links.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={toggleSidebar}
              className={`${
                location.pathname === link.path
                  ? "text-gray-400 pointer-events-none"
                  : "text-xl hover:text-gray-400"
              }`}
            >
              {link.name}
            </Link>
          ))}
          
          {/* User Info & Logout (Mobile) */}
          {user && (
            <div className="border-t pt-6 mt-8">
              <p className="text-lg text-gray-700 mb-4">
                Hello, {user.first_name} {user.last_name}
              </p>
              <button
                onClick={() => {
                  onLogout();
                  toggleSidebar();
                }}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors w-full"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;