import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { Plus, Trash2, Settings, X, AlertTriangle, Save } from 'lucide-react';

const HREmployees = ({ user, onLogout }) => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState(null);
  const [permissions, setPermissions] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    fetchPermissions();
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchPermissions = async () => {
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
        
        setPermissions({
          canRead: hrEmployeePerms?.d_read || false,
          canWrite: hrEmployeePerms?.d_write || false,
          canEdit: hrEmployeePerms?.d_edit || false,
          canDelete: hrEmployeePerms?.d_delete || false
        });
      }
    } catch (error) {
      console.error('Failed to fetch permissions:', error);
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

  const handleEmployeeClick = (employee) => {
    if (!permissions.canRead) {
      alert('You do not have permission to view employee details');
      return;
    }
    setSelectedEmployee(employee);
    setShowModal(true);
  };

  const handleDeleteEmployee = async () => {
    if (!employeeToDelete) return;

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`http://localhost:8000/api/hr/employees/${employeeToDelete.employee_id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Basic ${token}`,
        },
      });

      if (response.ok) {
        setEmployees(employees.filter(emp => emp.employee_id !== employeeToDelete.employee_id));
        setShowDeleteModal(false);
        setEmployeeToDelete(null);
      } else if (response.status === 403) {
        alert('You do not have permission to delete employees');
      } else {
        alert('Failed to delete employee');
      }
    } catch (error) {
      console.error('Failed to delete employee:', error);
      alert('Failed to delete employee');
    }
  };

  const handleDeleteClick = (employee) => {
    if (!permissions.canDelete) {
      alert('You do not have permission to delete employees');
      return;
    }
    setEmployeeToDelete(employee);
    setShowDeleteModal(true);
  };

  const handleEditClick = (employee) => {
    if (!permissions.canEdit) {
      alert('You do not have permission to edit employees');
      return;
    }
    setEditFormData({
      contact_name: employee.contact_name || '',
      business_phone: employee.business_phone || '',
      personal_phone: employee.personal_phone || '',
      business_email: employee.business_email || '',
      personal_email: employee.personal_email || '',
      gender: employee.gender || '',
      is_company_admin: employee.is_company_admin || false
    });
    setSelectedEmployee(employee);
    setShowEditModal(true);
    setEditError(null);
  };

  const handleEditInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError(null);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`http://localhost:8000/api/hr/employees/${selectedEmployee.employee_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${token}`,
        },
        body: JSON.stringify(editFormData)
      });

      if (response.ok) {
        const updatedEmployee = await response.json();
        setEmployees(employees.map(emp => 
          emp.employee_id === selectedEmployee.employee_id ? updatedEmployee : emp
        ));
        setShowEditModal(false);
        setSelectedEmployee(null);
      } else if (response.status === 403) {
        setEditError('You do not have permission to edit employees');
      } else {
        const errorData = await response.json();
        setEditError(errorData.detail || 'Failed to update employee');
      }
    } catch (error) {
      console.error('Failed to update employee:', error);
      setEditError('Failed to update employee. Please try again.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleAddEmployee = () => {
    if (!permissions.canWrite) {
      alert('You do not have permission to add new employees');
      return;
    }
    navigate('/hr/employees/add');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const DeleteModal = () => {
    if (!showDeleteModal || !employeeToDelete) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md mx-auto transform transition-all">
          <div className="text-center pt-8 pb-6 px-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-1">Delete Employee</h2>
            <p className="text-sm text-gray-500">This action cannot be undone</p>
          </div>

          <div className="px-8 pb-8">
            <p className="text-center text-gray-700 mb-6">
              Are you sure you want to delete <span className="font-medium">{employeeToDelete.contact_name}</span>?
            </p>
            
            <div className="space-y-3">
              <button
                onClick={handleDeleteEmployee}
                className="w-full bg-red-500 text-white py-3 px-4 rounded-xl font-medium hover:bg-red-700 transition-colors"
              >
                Yes, Delete Employee
              </button>
              
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setEmployeeToDelete(null);
                }}
                className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const EditModal = () => {
    if (!showEditModal || !selectedEmployee) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md mx-auto transform transition-all">
          <div className="text-center pt-8 pb-6 px-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Settings className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-1">Edit Employee</h2>
            <p className="text-sm text-gray-500">Update employee information</p>
          </div>

          <form onSubmit={handleEditSubmit} className="px-8 pb-8">
            {editError && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-red-600 text-sm text-center">{editError}</p>
              </div>
            )}

            <div className="space-y-4 max-h-96 overflow-y-auto">
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">Full Name</span>
                  <input
                    type="text"
                    name="contact_name"
                    value={editFormData.contact_name}
                    onChange={handleEditInputChange}
                    className="text-sm text-gray-900 font-medium bg-transparent border-none outline-none text-right max-w-32"
                    required
                  />
                </div>
                
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">Role</span>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="is_company_admin"
                      checked={editFormData.is_company_admin}
                      onChange={handleEditInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2"
                    />
                    <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                      editFormData.is_company_admin 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {editFormData.is_company_admin ? 'Admin' : 'Employee'}
                    </span>
                  </label>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">Business Email</span>
                  <input
                    type="email"
                    name="business_email"
                    value={editFormData.business_email}
                    onChange={handleEditInputChange}
                    placeholder="Not provided"
                    className="text-sm text-gray-900 bg-transparent border-none outline-none text-right max-w-40"
                  />
                </div>
                
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">Business Phone</span>
                  <input
                    type="tel"
                    name="business_phone"
                    value={editFormData.business_phone}
                    onChange={handleEditInputChange}
                    placeholder="Not provided"
                    className="text-sm text-gray-900 bg-transparent border-none outline-none text-right max-w-32"
                  />
                </div>
                
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">Personal Email</span>
                  <input
                    type="email"
                    name="personal_email"
                    value={editFormData.personal_email}
                    onChange={handleEditInputChange}
                    placeholder="Not provided"
                    className="text-sm text-gray-900 bg-transparent border-none outline-none text-right max-w-40"
                  />
                </div>
                
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">Personal Phone</span>
                  <input
                    type="tel"
                    name="personal_phone"
                    value={editFormData.personal_phone}
                    onChange={handleEditInputChange}
                    placeholder="Not provided"
                    className="text-sm text-gray-900 bg-transparent border-none outline-none text-right max-w-32"
                  />
                </div>
                
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">Gender</span>
                  <select
                    name="gender"
                    value={editFormData.gender}
                    onChange={handleEditInputChange}
                    className="text-sm text-gray-900 bg-transparent border-none outline-none"
                  >
                    <option value="">Not specified</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-8 space-y-3">
              <button
                type="submit"
                disabled={editLoading}
                className="w-full bg-blue-500 text-white py-3 px-4 rounded-xl font-medium hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                <Save className="w-4 h-4 mr-2" />
                {editLoading ? 'Updating...' : 'Update Employee'}
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedEmployee(null);
                  setEditError(null);
                }}
                className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const EmployeeModal = () => {
    if (!showModal || !selectedEmployee) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md mx-auto transform transition-all">
          <div className="text-center pt-8 pb-6 px-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-1">Employee Details</h2>
            <p className="text-sm text-gray-500">View employee information</p>
          </div>

          <div className="px-8 pb-8 space-y-4 max-h-96 overflow-y-auto">
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-600">Full Name</span>
                <span className="text-sm text-gray-900 font-medium">{selectedEmployee.contact_name}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-600">Role</span>
                <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                  selectedEmployee.is_company_admin 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {selectedEmployee.is_company_admin ? 'Admin' : 'Employee'}
                </span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-600">Business Email</span>
                <span className="text-sm text-gray-900">{selectedEmployee.business_email || 'Not provided'}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-600">Business Phone</span>
                <span className="text-sm text-gray-900">{selectedEmployee.business_phone || 'Not provided'}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-600">Personal Email</span>
                <span className="text-sm text-gray-900">{selectedEmployee.personal_email || 'Not provided'}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-600">Personal Phone</span>
                <span className="text-sm text-gray-900">{selectedEmployee.personal_phone || 'Not provided'}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-600">Gender</span>
                <span className="text-sm text-gray-900">{selectedEmployee.gender || 'Not specified'}</span>
              </div>
            </div>
          </div>
          
          <div className="px-8 pb-8 space-y-3">
            {permissions.canEdit && (
              <button
                onClick={() => {
                  setShowModal(false);
                  handleEditClick(selectedEmployee);
                }}
                className="w-full bg-blue-500 text-white py-3 px-4 rounded-xl font-medium hover:bg-blue-800 transition-colors flex items-center justify-center"
              >
                <Settings className="w-4 h-4 mr-2" />
                Edit Employee
              </button>
            )}
            
            <button
              onClick={() => setShowModal(false)}
              className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50 font-poppins">
        <Sidebar user={user} onLogout={onLogout} />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (!permissions.canRead) {
    return (
      <div className="flex h-screen bg-gray-50 font-poppins">
        <Sidebar user={user} onLogout={onLogout} />
        <div className="flex-1 flex flex-col">
          <header className="px-6 py-8">
            <h1 className="text-lg font-medium text-gray-900">Staff Management</h1>
          </header>
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-red-500 text-6xl mb-4">🔒</div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Access Denied</h2>
              <p className="text-gray-600">You do not have permission to view employee records.</p>
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
          <header className="px-6 lg:px-6 py-8 pl-20 lg:pl-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-medium text-gray-900">Employee Management</h1>
                          
                <p className="text-gray-600 mt-1">
                  Manage employee records
                </p>
              </div>
            </div>
          </header>

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden w-[385px] sm:w-auto">
              <div className="px-6 py-4 flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900">All Employees</h2>
                {permissions.canWrite && (
                  <button
                    onClick={handleAddEmployee}
                    className="flex items-center bg-blue-500 py-2 px-4 rounded-lg font-medium text-white hover:bg-blue-800 text-sm transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Employee
                  </button>
                )}
              </div>

              {error ? (
                <div className="p-6">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S/N</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        {(permissions.canEdit || permissions.canDelete) && (
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {employees.length > 0 ? (
                        employees.map((employee, index) => (
                          <tr 
                            key={employee.employee_id} 
                            className="hover:bg-gray-50 transition-colors cursor-pointer"
                            onClick={() => handleEmployeeClick(employee)}
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {String(index + 1).padStart(2, '0')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {employee.contact_name}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {employee.is_company_admin ? 'Admin' : 'Employee'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {employee.business_email || 'N/A'}
                              </div>
                            </td>
                            {(permissions.canEdit || permissions.canDelete) && (
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex space-x-2">
                                  {permissions.canEdit && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditClick(employee);
                                      }}
                                      className="text-blue-600 hover:text-blue-900 transition-colors p-1 rounded"
                                      title="Edit Employee"
                                    >
                                      <Settings className="h-4 w-4" />
                                    </button>
                                  )}
                                  {permissions.canDelete && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteClick(employee);
                                      }}
                                      className="text-red-600 hover:text-red-900 transition-colors p-1 rounded"
                                      title="Delete Employee"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            )}
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={permissions.canEdit || permissions.canDelete ? 5 : 4} className="px-6 py-12 text-center">
                            <div className="text-gray-500">
                              <p className="text-sm">No employees found</p>
                              {permissions.canWrite && (
                                <p className="text-xs mt-1">Click "Add Employee" to create your first employee record.</p>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      <EmployeeModal />
      <DeleteModal />
      <EditModal />
    </div>
  );
};

export default HREmployees; 