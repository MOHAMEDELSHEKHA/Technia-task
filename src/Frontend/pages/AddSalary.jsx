import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { ArrowLeft, Save, DollarSign } from 'lucide-react';

const AddSalary = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [employeesLoading, setEmployeesLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasWritePermission, setHasWritePermission] = useState(false);
  const [checkingPermissions, setCheckingPermissions] = useState(true);
  const [formData, setFormData] = useState({
    employee_id: '',
    due_year: new Date().getFullYear(),
    due_month: new Date().getMonth() + 1,
    gross_salary: '',
    insurance: '',
    taxes: '',
    net_salary: '',
    due_date: ''
  });

  useEffect(() => {
    checkPermissions();
    fetchEmployees();
  }, []);

  const checkPermissions = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:8000/api/auth/permissions', {
        headers: {
          'Authorization': `Basic ${token}`,
        },
      });

      if (response.ok) {
        const userPermissions = await response.json();
        const hrSalaryPerms = userPermissions.find(
          perm => perm.module_id === 2 && perm.feature_id === 2
        );
        
        const canWrite = hrSalaryPerms?.d_write || false;
        setHasWritePermission(canWrite);
        
        if (!canWrite) {
          setError('You do not have permission to add new salary records');
        }
      } else {
        setError('Failed to check permissions');
      }
    } catch (error) {
      console.error('Failed to check permissions:', error);
      setError('Failed to verify permissions');
    } finally {
      setCheckingPermissions(false);
    }
  };

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
      } else {
        setError('Failed to fetch employees list');
      }
    } catch (error) {
      console.error('Failed to fetch employees:', error);
      setError('Failed to load employees data');
    } finally {
      setEmployeesLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!hasWritePermission) {
      alert('You do not have permission to add salary records');
      return;
    }

    setLoading(true);
    setError(null);

    if (!formData.employee_id || !formData.gross_salary || !formData.insurance || 
        !formData.taxes || !formData.net_salary || !formData.due_date) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(
        `http://localhost:8000/api/hr/employees/${formData.employee_id}/salaries`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${token}`,
          },
          body: JSON.stringify({
            due_year: parseInt(formData.due_year),
            due_month: parseInt(formData.due_month),
            gross_salary: parseFloat(formData.gross_salary),
            insurance: parseFloat(formData.insurance),
            taxes: parseFloat(formData.taxes),
            net_salary: parseFloat(formData.net_salary),
            due_date: formData.due_date
          })
        }
      );

      if (response.ok) {
        const newSalary = await response.json();
        console.log('Salary record created successfully:', newSalary);
        navigate('/hr/salaries');
      } else if (response.status === 403) {
        setError('You do not have permission to add salary records');
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to create salary record');
      }
    } catch (error) {
      console.error('Failed to create salary record:', error);
      setError('Failed to create salary record. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/hr/salaries');
  };

  if (checkingPermissions || employeesLoading) {
    return (
      <div className="flex h-screen bg-gray-50 font-poppins">
        <Sidebar user={user} onLogout={onLogout} />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (!hasWritePermission) {
    return (
      <div className="flex h-screen bg-gray-50 font-poppins">
        <Sidebar user={user} onLogout={onLogout} />
        <div className="flex-1 flex flex-col">
          <header className="px-6 py-8">
            <div className="flex items-center">
              <button
                onClick={handleCancel}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h1 className="text-lg font-medium text-gray-900">Add New Salary Record</h1>
            </div>
          </header>
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-red-500 text-6xl mb-4">🚫</div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Access Denied</h2>
              <p className="text-gray-600 mb-4">You do not have permission to add new salary records.</p>
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-800"
              >
                Go Back
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 font-poppins">
      <Sidebar user={user} onLogout={onLogout} />
      
      <div className="flex-1 flex flex-col">
        <header className="px-6 py-8">
          <div className="flex items-center">
            <button
              onClick={handleCancel}
              className="mr-4 p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-lg font-medium text-gray-900">Add New Salary Record</h1>
              <p className="text-gray-600 mt-1">
                Create a new salary record for an employee
              </p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-3xl shadow-2xl">
              <div className="text-center pt-8 pb-6 px-8">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-1">New Salary Record</h2>
                <p className="text-sm text-gray-500">Fill in the salary details</p>
              </div>

              <form onSubmit={handleSubmit} className="px-8 pb-8">
                {error && (
                  <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
                    <p className="text-red-600 text-sm text-center">{error}</p>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label htmlFor="employee_id" className="block text-sm font-medium text-gray-600 mb-2">
                      Employee <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="employee_id"
                      name="employee_id"
                      value={formData.employee_id}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                      required
                    >
                      <option value="">Select Employee</option>
                      {employees.map(emp => (
                        <option key={emp.employee_id} value={emp.employee_id}>
                          {emp.contact_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="due_year" className="block text-sm font-medium text-gray-600 mb-2">
                        Year <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        id="due_year"
                        name="due_year"
                        value={formData.due_year}
                        onChange={handleInputChange}
                        min="2020"
                        max="2030"
                        className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="due_month" className="block text-sm font-medium text-gray-600 mb-2">
                        Month <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="due_month"
                        name="due_month"
                        value={formData.due_month}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                        required
                      >
                        {Array.from({length: 12}, (_, i) => (
                          <option key={i + 1} value={i + 1}>
                            {new Date(2000, i).toLocaleDateString('en-US', { month: 'long' })}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="gross_salary" className="block text-sm font-medium text-gray-600 mb-2">
                        Gross Salary <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        id="gross_salary"
                        name="gross_salary"
                        value={formData.gross_salary}
                        onChange={handleInputChange}
                        min="0.01"
                        className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                        placeholder="0.00"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="insurance" className="block text-sm font-medium text-gray-600 mb-2">
                        Insurance <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        id="insurance"
                        name="insurance"
                        value={formData.insurance}
                        onChange={handleInputChange}
                        min="0"
                        className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                        placeholder="0.00"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="taxes" className="block text-sm font-medium text-gray-600 mb-2">
                        Taxes <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        id="taxes"
                        name="taxes"
                        value={formData.taxes}
                        onChange={handleInputChange}
                        min="0"
                        className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                        placeholder="0.00"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="net_salary" className="block text-sm font-medium text-gray-600 mb-2">
                        Net Salary <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        id="net_salary"
                        name="net_salary"
                        value={formData.net_salary}
                        onChange={handleInputChange}
                        min="0.01"
                        className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                        placeholder="0.00"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="due_date" className="block text-sm font-medium text-gray-600 mb-2">
                      Due Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      id="due_date"
                      name="due_date"
                      value={formData.due_date}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                      required
                    />
                  </div>
                </div>

                <div className="mt-8 space-y-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-500 text-white py-3 px-4 rounded-xl font-medium hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {loading ? 'Creating...' : 'Create Salary Record'}
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AddSalary;