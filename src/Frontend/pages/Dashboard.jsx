// src/Frontend/pages/Dashboard.jsx
import React from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import Block1Dashboard from "../components/Block1Dashboard";
import StaffListTable from "../components/StaffListTable";

const Dashboard = ({ user, onLogout }) => {
  return (
    <div className="flex h-screen bg-gray-50 font-poppins">
      {/* Sidebar */}
      <Sidebar user={user} onLogout={onLogout} />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Navbar */}
        <Navbar user={user} onLogout={onLogout} />

        <Block1Dashboard />
        <StaffListTable />

{/* Main Dashboard Content */}
<main className="flex-1 overflow-y-auto p-6">
    {/* Module Cards */}
    <div className="grid md:grid-cols-2 gap-8">
      {/* Real Estate Module */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
          <h2 className="text-xl font-semibold mb-2">Real Estate Module</h2>
          <p className="text-blue-100">
            Manage customer leads and track sales activities
          </p>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                <span className="text-sm font-medium text-gray-700">Lead Management</span>
              </div>
              <span className="text-xs text-gray-500">Active</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                <span className="text-sm font-medium text-gray-700">Actions & Follow-ups</span>
              </div>
              <span className="text-xs text-gray-500">Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* HR Module */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 text-white">
          <h2 className="text-xl font-semibold mb-2">HR Module</h2>
          <p className="text-green-100">
            Handle employee management and payroll administration
          </p>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                <span className="text-sm font-medium text-gray-700">Employee Records</span>
              </div>
              <span className="text-xs text-gray-500">Active</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
                <span className="text-sm font-medium text-gray-700">Salary Management</span>
              </div>
              <span className="text-xs text-gray-500">Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Recent Activity */}
    <div className="mt-8">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Recent Activity</h3>
        </div>
        <div className="p-6">
          <div className="text-center py-8 text-gray-500">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="mt-2">No recent activity to display</p>
            <p className="text-sm">Activities will appear here as you use the system</p>
          </div>
        </div>
      </div>
    </div>
</main>
      </div>
    </div>
  );
};

export default Dashboard;