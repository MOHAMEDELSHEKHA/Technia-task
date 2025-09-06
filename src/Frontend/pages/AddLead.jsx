// src/Frontend/pages/AddLead.jsx - All Fields Required
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { ArrowLeft, Save, UserCheck } from 'lucide-react';

const AddLead = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasWritePermission, setHasWritePermission] = useState(false);
  const [checkingPermissions, setCheckingPermissions] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    lead_phone: '',
    email: '',
    gender: '',
    job_title: '',
    assigned_to: ''
  });

  useEffect(() => {
    checkPermissions();
    fetchUsers();
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
        const realEstateLeadPerms = userPermissions.find(
          perm => perm.module_id === 1 && perm.feature_id === 1
        );
        
        const canWrite = realEstateLeadPerms?.d_write || false;
        setHasWritePermission(canWrite);
        
        if (!canWrite) {
          setError('You do not have permission to add new leads');
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

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:8000/api/auth/users', {
        headers: {
          'Authorization': `Basic ${token}`,
        },
      });

      if (response.ok) {
        const usersData = await response.json();
        setUsers(usersData);
      } else {
        setError('Failed to fetch users list');
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setError('Failed to load users data');
    } finally {
      setUsersLoading(false);
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
      alert('You do not have permission to add leads');
      return;
    }

    setLoading(true);
    setError(null);

    // Validate ALL required fields
    if (!formData.name || !formData.lead_phone || !formData.email || 
        !formData.gender || !formData.job_title || !formData.assigned_to) {
      setError('All fields are required. Please fill in every field.');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(
        'http://localhost:8000/api/real-estate/leads',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${token}`,
          },
          body: JSON.stringify({
            name: formData.name.trim(),
            lead_phone: formData.lead_phone.trim(),
            email: formData.email.trim(),
            gender: formData.gender,
            job_title: formData.job_title.trim(),
            assigned_to: parseInt(formData.assigned_to)
          })
        }
      );

      if (response.ok) {
        const newLead = await response.json();
        console.log('Lead created successfully:', newLead);
        navigate('/real-estate/leads');
      } else if (response.status === 403) {
        setError('You do not have permission to add leads');
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to create lead');
      }
    } catch (error) {
      console.error('Failed to create lead:', error);
      setError('Failed to create lead. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/real-estate/leads');
  };

  if (checkingPermissions || usersLoading) {
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
              <h1 className="text-lg font-medium text-gray-900">Add New Lead</h1>
            </div>
          </header>
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-red-500 text-6xl mb-4">🚫</div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Access Denied</h2>
              <p className="text-gray-600 mb-4">You do not have permission to add new leads.</p>
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
              <h1 className="text-lg font-medium text-gray-900">Add New Lead</h1>
              <p className="text-gray-600 mt-1">
                Create a new customer lead - all fields required
              </p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-3xl shadow-2xl">
              {/* Header */}
              <div className="text-center pt-8 pb-6 px-8">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserCheck className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-1">New Lead</h2>
                <p className="text-sm text-gray-500">Fill in all lead details</p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="px-8 pb-8">
                {error && (
                  <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
                    <p className="text-red-600 text-sm text-center">{error}</p>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Phone Number */}
                  <div>
                    <label htmlFor="lead_phone" className="block text-sm font-medium text-gray-600 mb-2">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      id="lead_phone"
                      name="lead_phone"
                      value={formData.lead_phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                      placeholder="+1 (555) 123-4567"
                      required
                    />
                  </div>

                  {/* Name */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-600 mb-2">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                      placeholder="Enter full name"
                      required
                    />
                  </div>

                  {/* Email and Gender - Side by Side */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-600 mb-2">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                        placeholder="john@example.com"
                        required
                      />
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
                  </div>

                  {/* Job Title and Lead Type - Side by Side */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="job_title" className="block text-sm font-medium text-gray-600 mb-2">
                        Job Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="job_title"
                        name="job_title"
                        value={formData.job_title}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                        placeholder="e.g., Software Engineer"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="lead_type" className="block text-sm font-medium text-gray-600 mb-2">
                        Lead Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="lead_type"
                        name="lead_type"
                        value={formData.lead_type}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                        required
                      >
                        <option value="">Select Lead Type</option>
                        {leadTypes.map(type => (
                          <option key={type.id} value={type.id}>
                            {type.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Assigned To - NO "Leave Unassigned" option */}
                  <div>
                    <label htmlFor="assigned_to" className="block text-sm font-medium text-gray-600 mb-2">
                      Assign To User <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="assigned_to"
                      name="assigned_to"
                      value={formData.assigned_to}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                      required
                    >
                      <option value="">Select User</option>
                      {users.map(user => (
                        <option key={user.id} value={user.id}>
                          {user.first_name} {user.last_name} ({user.email})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-8 space-y-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-500 text-white py-3 px-4 rounded-xl font-medium hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {loading ? 'Creating...' : 'Create Lead'}
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

export default AddLead;