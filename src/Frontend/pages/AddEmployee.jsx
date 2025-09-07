import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { ArrowLeft, Save, User } from 'lucide-react';

const AddEmployee = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasWritePermission, setHasWritePermission] = useState(false);
  const [checkingPermissions, setCheckingPermissions] = useState(true);
  const [formData, setFormData] = useState({
    contact_name: '',
    business_phone: '',
    personal_phone: '',
    business_email: '',
    personal_email: '',
    gender: '',
    is_company_admin: false
  });

  useEffect(() => {
    checkPermissions();
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
        const hrEmployeePerms = userPermissions.find(
          perm => perm.module_id === 2 && perm.feature_id === 1
        );
        
        const canWrite = hrEmployeePerms?.d_write || false;
        setHasWritePermission(canWrite);
        
        if (!canWrite) {
          setError('You do not have permission to add new employees');
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

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!hasWritePermission) {
      alert('You do not have permission to add employees');
      return;
    }

    setLoading(true);
    setError(null);

    if (!formData.contact_name.trim()) {
      setError('Contact name is required');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:8000/api/hr/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${token}`,
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const newEmployee = await response.json();
        console.log('Employee created successfully:', newEmployee);
        navigate('/hr/employees');
      } else if (response.status === 403) {
        setError('You do not have permission to add employees');
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to create employee');
      }
    } catch (error) {
      console.error('Failed to create employee:', error);
      setError('Failed to create employee. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/hr/employees');
  };

  if (checkingPermissions) {
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
              <h1 className="text-lg font-medium text-gray-900">Add New Employee</h1>
            </div>
          </header>
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-red-500 text-6xl mb-4">🚫</div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Access Denied</h2>
              <p className="text-gray-600 mb-4">You do not have permission to add new employees.</p>
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
              className="mr-4 p-2 ml-10 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-lg font-medium text-gray-900">Add New Employee</h1>
              <p className="text-gray-600 mt-1">
                Create a new employee record
              </p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-3xl shadow-2xl">
              <div className="text-center pt-8 pb-6 px-8">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-1">New Employee</h2>
                <p className="text-sm text-gray-500">Fill in the employee details</p>
              </div>

              <form onSubmit={handleSubmit} className="px-8 pb-8">
                {error && (
                  <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
                    <p className="text-red-600 text-sm text-center">{error}</p>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label htmlFor="contact_name" className="block text-sm font-medium text-gray-600 mb-2">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="contact_name"
                      name="contact_name"
                      value={formData.contact_name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                      placeholder="Enter full name"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="business_phone" className="block text-sm font-medium text-gray-600 mb-2">
                        Business Phone <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        id="business_phone"
                        name="business_phone"
                        value={formData.business_phone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                        placeholder="+1 (555) 123-4567"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="personal_phone" className="block text-sm font-medium text-gray-600 mb-2">
                        Personal Phone <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        id="personal_phone"
                        name="personal_phone"
                        value={formData.personal_phone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                        placeholder="+1 (555) 123-4567"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="business_email" className="block text-sm font-medium text-gray-600 mb-2">
                        Business Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        id="business_email"
                        name="business_email"
                        value={formData.business_email}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                        placeholder="john@company.com"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="personal_email" className="block text-sm font-medium text-gray-600 mb-2">
                        Personal Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        id="personal_email"
                        name="personal_email"
                        value={formData.personal_email}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                        placeholder="john@personal.com"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="gender" className="block text-sm font-medium text-gray-600 mb-2">
                      Gender <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="gender"
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                      required
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl">
                    <input
                      type="checkbox"
                      id="is_company_admin"
                      name="is_company_admin"
                      checked={formData.is_company_admin}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="is_company_admin" className="block text-sm text-gray-900">
                      <span className="font-medium">Company Administrator</span>
                      <p className="text-xs text-gray-500 mt-1">Grant administrative privileges</p>
                    </label>
                  </div>
                </div>

                <div className="mt-8 space-y-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-500 text-white py-3 px-4 rounded-xl font-medium hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {loading ? 'Creating...' : 'Create Employee'}
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

export default AddEmployee;