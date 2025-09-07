import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const SalariesTable = () => {
  const [salaries, setSalaries] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasPermission, setHasPermission] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      
      const [salariesResponse, employeesResponse] = await Promise.all([
        fetch('http://localhost:8000/api/hr/salaries', {
          headers: { 'Authorization': `Basic ${token}` },
        }),
        fetch('http://localhost:8000/api/hr/employees', {
          headers: { 'Authorization': `Basic ${token}` },
        })
      ]);

      if (salariesResponse.ok && employeesResponse.ok) {
        const salariesData = await salariesResponse.json();
        const employeesData = await employeesResponse.json();
        
        setSalaries(salariesData);
        setEmployees(employeesData);
      } else if (salariesResponse.status === 403 || employeesResponse.status === 403) {
        setHasPermission(false);
        setError('You do not have permission to view salary data');
      } else {
        setError('Failed to fetch salary data');
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setError('Failed to load salary data');
    } finally {
      setLoading(false);
    }
  };

  const getEmployeeName = (employeeId) => {
    const employee = employees.find(emp => emp.employee_id === employeeId);
    return employee ? employee.contact_name : `Employee ${employeeId}`;
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPeriod = (year, month) => {
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  };

  const displayData = salaries.slice(-5);

  const handleViewAllSalaries = () => {
    navigate('/hr/salaries');
  };

  if (loading) {
    return (
      <div className="py-4 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-6">
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
        </div>
      </div>
    );
  }

  if (!hasPermission) {
    return null;
  }

  if (error) {
    return (
      <div className="py-4 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Salaries</h2>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-4 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden w-[385px] sm:w-auto">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Recent Salaries</h2>
            <button
              onClick={handleViewAllSalaries}
              className="flex items-center bg-blue-500 py-2 px-4 rounded-lg font-medium text-white hover:bg-blue-800 text-sm font-medium transition-colors"
            >
              More Actions
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    S/N
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Period
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Net Salary
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-200">
                {displayData.length > 0 ? (
                  displayData.map((salary, index) => (
                    <tr key={`${salary.employee_id}-${salary.due_year}-${salary.due_month}`} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {String(index + 1).padStart(2, '0')}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {getEmployeeName(salary.employee_id)}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatPeriod(salary.due_year, salary.due_month)}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-medium">
                          {formatCurrency(salary.net_salary)}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center">
                      <div className="text-gray-500">
                        <p className="text-sm">No salary data available</p>
                        <p className="text-xs mt-1">There are no salary records to display at this time.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 border-t border-gray-200">
            <button
              onClick={handleViewAllSalaries}
              className="w-full bg-white text-gray-900 py-2 px-4 rounded-lg font-medium transition-colors"
            >
              View All Salaries
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalariesTable;