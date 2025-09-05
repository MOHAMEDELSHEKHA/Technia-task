// src/pages/Dashboard.jsx
import React from "react";
import Navbar from "../components/Navbar";

const Dashboard = () => {
  return (
    <div className="w-full h-full font-poppins">
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        <div className="p-8">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-blue-50 p-6 rounded-lg">
                <h2 className="text-lg font-semibold text-blue-900 mb-2">
                  Real Estate Module
                </h2>
                <p className="text-blue-700">
                  Manage leads, track actions, and oversee real estate operations.
                </p>
              </div>
              
              <div className="bg-green-50 p-6 rounded-lg">
                <h2 className="text-lg font-semibold text-green-900 mb-2">
                  HR Module
                </h2>
                <p className="text-green-700">
                  Handle employee management and salary administration.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;