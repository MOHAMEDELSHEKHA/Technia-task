// src/Frontend/components/StaffListTable.jsx
import React, { useState, useEffect } from 'react';
import { MoreVertical } from 'lucide-react';

const StaffListTable = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch employees data on component mount
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch('http://localhost:8000/api/hr/employees', {
          headers: {
            'Authorization': `Basic ${token}`,
          },
        });

        if (response.ok) {
          const employeesData = await response.json();
          setEmployees(employeesData);
        } else if (response.status === 403) {
          setError('You do not have permission to view employees');
        } else {
          setError('Failed to fetch employees data');
        }
      } catch (error) {
        console.error('Failed to fetch employees:', error);
        setError('Failed to load employees data');
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  // Use only API data - no sample data fallback
  const displayData = employees;

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-32 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex space-x-4">
                <div className="h-4 bg-gray-200 rounded w-8"></div>
                <div className="h-4 bg-gray-200 rounded w-48"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-4 bg-gray-200 rounded w-40"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Staff List</h2>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Staff List</h2>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          {/* Table Header */}
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                S/N
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Staff Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Staff Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Designation
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="bg-white divide-y divide-gray-200">
            {displayData.length > 0 ? (
              displayData.map((staff, index) => (
                <tr key={staff.employee_id || index} className="hover:bg-gray-50 transition-colors">
                  {/* Serial Number */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {String(index + 1).padStart(2, '0')}
                  </td>
                  
                  {/* Staff Name */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {staff.contact_name}
                    </div>
                  </td>
                  
                  {/* Staff Role */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {staff.role || 'Employee'}
                    </div>
                  </td>
                  
                  {/* Designation */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {staff.business_email || 'N/A'}
                    </div>
                  </td>
                  
                  {/* Actions */}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900 transition-colors p-1 rounded">
                      <div className="w-1 h-4 bg-blue-600 rounded-full"></div>
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <div className="text-gray-500">
                    <p className="text-sm">No staff data available</p>
                    <p className="text-xs mt-1">There are no employees to display at this time.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StaffListTable;