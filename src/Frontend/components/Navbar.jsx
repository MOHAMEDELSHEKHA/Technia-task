// src/Frontend/components/Navbar.jsx
import React, { useState, useRef, useEffect } from 'react';
import { User, LogOut, ChevronDown } from 'lucide-react';

const Navbar = ({ user, onLogout }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Get current date formatted
  const getCurrentDate = () => {
    const now = new Date();
    const options = { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    };
    
    const dateStr = now.toLocaleDateString('en-GB', options);
    const day = now.getDate();
    
    // Add ordinal suffix
    const getOrdinalSuffix = (day) => {
      if (day > 3 && day < 21) return 'th';
      switch (day % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
      }
    };
    
    return dateStr.replace(day.toString(), `${day}${getOrdinalSuffix(day)}`);
  };

  return (
    <div className=" px-6 py-8 sm:px-6">
      <div className="flex items-center justify-between ">
        <div>
          <h1 className="text-lg font-medium text-gray-900 sm:px-6">
            Welcome, {user?.first_name} {user?.last_name}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Today is {getCurrentDate()}.
          </p>
        </div>

      
      </div>
    </div>
  );
};

export default Navbar;