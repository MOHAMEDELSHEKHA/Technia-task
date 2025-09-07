import React from "react";
import Sidebar from "../components/Sidebar";
import Block1Dashboard from "../components/Block1Dashboard";
import StaffListTable from "../components/StaffListTable";
import SalariesTable from "../components/SalariesTable";
import LeadsTable from "../components/LeadsTable";
import ActionsTable from "../components/ActionsTable";

const Dashboard = ({ user, onLogout }) => {
  return (
    <div className="flex h-screen bg-gray-50 font-poppins">
      <Sidebar user={user} onLogout={onLogout} />
      
      <div className="flex-1 flex flex-col">
      
        <header className="px-6 lg:px-6 py-8 pl-20 lg:pl-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-medium text-gray-900">Hello, {user?.first_name} {user?.last_name}</h1>
                          
                <p className="text-gray-600 mt-1">
                  Welcome to your dashboard
                </p>
              </div>
            </div>
          </header>

        

        <div className="flex-1 overflow-y-auto">
          <Block1Dashboard />
          <StaffListTable />
          <SalariesTable />
          <LeadsTable />
          <ActionsTable />

          
        </div>
      </div>
    </div>
  );
};

export default Dashboard;