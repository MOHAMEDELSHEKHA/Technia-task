// src/Frontend/pages/HREmployees.jsx
import React from "react";
import Sidebar from "../components/Sidebar";

const HREmployees = ({ user, onLogout }) => {
  return (
    <div className="flex h-screen bg-gray-50 font-poppins">
      <Sidebar user={user} onLogout={onLogout} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Staff Management</h1>
              <p className="text-gray-600 mt-1">
                Manage employee records and information
              </p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <div className="text-center">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Employee Management</h2>
                <p className="text-gray-600">This section will contain employee CRUD operations.</p>
                <p className="text-sm text-gray-500 mt-2">Feature coming soon...</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default HREmployees;