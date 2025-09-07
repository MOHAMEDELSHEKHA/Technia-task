import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { Plus, Trash2, Settings, AlertTriangle, Save, DollarSign } from 'lucide-react';

const HRSalaries = ({ user, onLogout }) => {
  const [salaries, setSalaries] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSalary, setSelectedSalary] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [salaryToDelete, setSalaryToDelete] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [permissions, setPermissions] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    fetchPermissions();
  }, []);

  useEffect(() => {
    fetchData();
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
        const hrSalaryPerms = userPermissions.find(
          perm => perm.module_id === 2 && perm.feature_id === 2
        );
        
        setPermissions({
          canRead: hrSalaryPerms?.d_read || false,
          canWrite: hrSalaryPerms?.d_write || false,
          canEdit: hrSalaryPerms?.d_edit || false,
          canDelete: hrSalaryPerms?.d_delete || false
        });
      }
    } catch (error) {
      console.error('Failed to fetch permissions:', error);
    }
  };

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
      } else if (salariesResponse.status === 403) {
        setError('You do not have permission to view salaries');
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
    if (!amount) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPeriod = (year, month) => {
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  };

  const validateSalaryField = (value, fieldName) => {
    if (!value || value.trim() === '') {
      return null;
    }

    const cleanValue = value.replace(/[$,\s]/g, '');
    const numericValue = parseFloat(cleanValue);
    
    if (isNaN(numericValue)) {
      return `${fieldName} must be a valid number`;
    }

    if (numericValue < 0) {
      return `${fieldName} cannot be negative`;
    }

    if (numericValue > 999999999) {
      return `${fieldName} is too large`;
    }

    return null;
  };

  const handleSalaryClick = (salary) => {
    if (!permissions.canRead) {
      alert('You do not have permission to view salary details');
      return;
    }
    setSelectedSalary(salary);
    setShowModal(true);
  };

  const handleDeleteSalary = async () => {
    if (!salaryToDelete) return;

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(
        `http://localhost:8000/api/hr/employees/${salaryToDelete.employee_id}/salaries/${salaryToDelete.due_year}/${salaryToDelete.due_month}`, 
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Basic ${token}`,
          },
        }
      );

      if (response.ok) {
        setSalaries(salaries.filter(sal => 
          !(sal.employee_id === salaryToDelete.employee_id && 
            sal.due_year === salaryToDelete.due_year && 
            sal.due_month === salaryToDelete.due_month)
        ));
        setShowDeleteModal(false);
        setSalaryToDelete(null);
      } else if (response.status === 403) {
        alert('You do not have permission to delete salary records');
      } else {
        alert('Failed to delete salary record');
      }
    } catch (error) {
      console.error('Failed to delete salary:', error);
      alert('Failed to delete salary record');
    }
  };

  const handleDeleteClick = (salary) => {
    if (!permissions.canDelete) {
      alert('You do not have permission to delete salary records');
      return;
    }
    setSalaryToDelete(salary);
    setShowDeleteModal(true);
  };

  const handleEditClick = (salary) => {
    if (!permissions.canEdit) {
      alert('You do not have permission to edit salary records');
      return;
    }
    setEditFormData({
      gross_salary: salary.gross_salary || '',
      insurance: salary.insurance || '',
      taxes: salary.taxes || '',
      net_salary: salary.net_salary || '',
      due_date: salary.due_date ? salary.due_date.split('T')[0] : ''
    });
    setSelectedSalary(salary);
    setShowEditModal(true);
    setEditError(null);
    setFieldErrors({});
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (fieldErrors[name]) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }

    if (['gross_salary', 'insurance', 'taxes', 'net_salary'].includes(name)) {
      const error = validateSalaryField(value, name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()));
      if (error) {
        setFieldErrors(prev => ({
          ...prev,
          [name]: error
        }));
      }
    }
  };

  const validateAllFields = () => {
    const errors = {};
    
    const salaryFields = [
      { name: 'gross_salary', label: 'Gross Salary' },
      { name: 'insurance', label: 'Insurance' },
      { name: 'taxes', label: 'Taxes' },
      { name: 'net_salary', label: 'Net Salary' }
    ];

    salaryFields.forEach(field => {
      const error = validateSalaryField(editFormData[field.name], field.label);
      if (error) {
        errors[field.name] = error;
      }
    });

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateAllFields()) {
      setEditError('Please fix the validation errors before submitting');
      return;
    }

    setEditLoading(true);
    setEditError(null);

    try {
      const submissionData = { ...editFormData };
      
      ['gross_salary', 'insurance', 'taxes', 'net_salary'].forEach(field => {
        if (submissionData[field]) {
          const cleanValue = submissionData[field].toString().replace(/[$,\s]/g, '');
          submissionData[field] = parseFloat(cleanValue) || 0;
        }
      });

      const token = localStorage.getItem('auth_token');
      const response = await fetch(
        `http://localhost:8000/api/hr/employees/${selectedSalary.employee_id}/salaries/${selectedSalary.due_year}/${selectedSalary.due_month}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${token}`,
          },
          body: JSON.stringify(submissionData)
        }
      );

      if (response.ok) {
        const updatedSalary = await response.json();
        setSalaries(salaries.map(sal => 
          (sal.employee_id === selectedSalary.employee_id && 
           sal.due_year === selectedSalary.due_year && 
           sal.due_month === selectedSalary.due_month) ? updatedSalary : sal
        ));
        setShowEditModal(false);
        setSelectedSalary(null);
        setFieldErrors({});
      } else if (response.status === 403) {
        setEditError('You do not have permission to edit salary records');
      } else {
        const errorData = await response.json();
        setEditError(errorData.detail || 'Failed to update salary record');
      }
    } catch (error) {
      console.error('Failed to update salary:', error);
      setEditError('Failed to update salary record. Please try again.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleAddSalary = () => {
    if (!permissions.canWrite) {
      alert('You do not have permission to add new salary records');
      return;
    }
    navigate('/hr/salaries/add');
  };

  const DeleteModal = () => {
    if (!showDeleteModal || !salaryToDelete) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md mx-auto transform transition-all">
          <div className="text-center pt-8 pb-6 px-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-1">Delete Salary Record</h2>
            <p className="text-sm text-gray-500">This action cannot be undone</p>
          </div>

          <div className="px-8 pb-8">
            <p className="text-center text-gray-700 mb-6">
              Are you sure you want to delete the salary record for{' '}
              <span className="font-medium">{getEmployeeName(salaryToDelete.employee_id)}</span>{' '}
              for <span className="font-medium">{formatPeriod(salaryToDelete.due_year, salaryToDelete.due_month)}</span>?
            </p>
            
            <div className="space-y-3">
              <button
                onClick={handleDeleteSalary}
                className="w-full bg-red-500 text-white py-3 px-4 rounded-xl font-medium hover:bg-red-700 transition-colors"
              >
                Yes, Delete Record
              </button>
              
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSalaryToDelete(null);
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
    if (!showEditModal || !selectedSalary) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md mx-auto transform transition-all">
          <div className="text-center pt-8 pb-6 px-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Settings className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-1">Edit Salary</h2>
            <p className="text-sm text-gray-500">Update salary information</p>
          </div>

          <form onSubmit={handleEditSubmit} className="px-8 pb-8">
            {editError && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-red-600 text-sm text-center">{editError}</p>
              </div>
            )}

            <div className="space-y-4 max-h-96 overflow-y-auto">
              <div className="space-y-3">
                {/* Employee - Read Only */}
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">Employee</span>
                  <span className="text-sm text-gray-900 font-medium">{getEmployeeName(selectedSalary.employee_id)}</span>
                </div>
                
                {/* Period - Read Only */}
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">Period</span>
                  <span className="text-sm text-gray-900">{formatPeriod(selectedSalary.due_year, selectedSalary.due_month)}</span>
                </div>
                
                {/* Gross Salary */}
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">Gross Salary</span>
                  <div className="flex flex-col items-end">
                    <input
                      type="text"
                      name="gross_salary"
                      value={editFormData.gross_salary}
                      onChange={handleEditInputChange}
                      placeholder="0.00"
                      className="text-sm text-gray-900 bg-gray-100 border-none outline-none text-right max-w-24 px-2 py-1 rounded"
                    />
                    {fieldErrors.gross_salary && (
                      <span className="text-xs text-red-600 mt-1">{fieldErrors.gross_salary}</span>
                    )}
                  </div>
                </div>
                
                {/* Insurance */}
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">Insurance</span>
                  <div className="flex flex-col items-end">
                    <input
                      type="text"
                      name="insurance"
                      value={editFormData.insurance}
                      onChange={handleEditInputChange}
                      placeholder="0.00"
                      className="text-sm text-gray-900 bg-gray-100 border-none outline-none text-right max-w-24 px-2 py-1 rounded"
                    />
                    {fieldErrors.insurance && (
                      <span className="text-xs text-red-600 mt-1">{fieldErrors.insurance}</span>
                    )}
                  </div>
                </div>
                
                {/* Taxes */}
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">Taxes</span>
                  <div className="flex flex-col items-end">
                    <input
                      type="text"
                      name="taxes"
                      value={editFormData.taxes}
                      onChange={handleEditInputChange}
                      placeholder="0.00"
                      className="text-sm text-gray-900 bg-gray-100 border-none outline-none text-right max-w-24 px-2 py-1 rounded"
                    />
                    {fieldErrors.taxes && (
                      <span className="text-xs text-red-600 mt-1">{fieldErrors.taxes}</span>
                    )}
                  </div>
                </div>
                
                {/* Net Salary */}
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">Net Salary</span>
                  <div className="flex flex-col items-end">
                    <input
                      type="text"
                      name="net_salary"
                      value={editFormData.net_salary}
                      onChange={handleEditInputChange}
                      placeholder="0.00"
                      className="text-sm text-gray-900 bg-gray-100 border-none outline-none text-right max-w-24 font-medium text-green-600 px-2 py-1 rounded"
                    />
                    {fieldErrors.net_salary && (
                      <span className="text-xs text-red-600 mt-1">{fieldErrors.net_salary}</span>
                    )}
                  </div>
                </div>
                
                {/* Due Date */}
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">Due Date</span>
                  <input
                    type="date"
                    name="due_date"
                    value={editFormData.due_date}
                    onChange={handleEditInputChange}
                    className="text-sm text-gray-900 bg-gray-100 border-none outline-none text-right px-2 py-1 rounded"
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 space-y-3">
              <button
                type="submit"
                disabled={editLoading || Object.keys(fieldErrors).some(key => fieldErrors[key])}
                className={`w-full py-3 px-4 rounded-xl font-medium transition-colors flex items-center justify-center ${
                  Object.keys(fieldErrors).some(key => fieldErrors[key])
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-800'
                }`}
              >
                <Save className="w-4 h-4 mr-2" />
                {editLoading ? 'Updating...' : 'Update Salary'}
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedSalary(null);
                  setEditError(null);
                  setFieldErrors({});
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

  const SalaryModal = () => {
    if (!showModal || !selectedSalary) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md mx-auto transform transition-all">
          <div className="text-center pt-8 pb-6 px-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-1">Salary Details</h2>
            <p className="text-sm text-gray-500">View salary information</p>
          </div>

          <div className="px-8 pb-8">
            <div className="space-y-4 max-h-96 overflow-y-auto mb-8">
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">Employee</span>
                  <span className="text-sm text-gray-900 font-medium">{getEmployeeName(selectedSalary.employee_id)}</span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">Period</span>
                  <span className="text-sm text-gray-900">{formatPeriod(selectedSalary.due_year, selectedSalary.due_month)}</span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">Gross Salary</span>
                  <span className="text-sm text-gray-900 font-medium">{formatCurrency(selectedSalary.gross_salary)}</span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">Insurance</span>
                  <span className="text-sm text-gray-900">{formatCurrency(selectedSalary.insurance)}</span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">Taxes</span>
                  <span className="text-sm text-gray-900">{formatCurrency(selectedSalary.taxes)}</span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">Net Salary</span>
                  <span className="text-sm text-gray-900 font-bold text-green-600">{formatCurrency(selectedSalary.net_salary)}</span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">Due Date</span>
                  <span className="text-sm text-gray-900">
                    {selectedSalary.due_date ? new Date(selectedSalary.due_date).toLocaleDateString() : 'Not set'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              {permissions.canEdit && (
                <button
                  onClick={() => {
                    setShowModal(false);
                    handleEditClick(selectedSalary);
                  }}
                  className="w-full bg-blue-500 text-white py-3 px-4 rounded-xl font-medium hover:bg-blue-800 transition-colors flex items-center justify-center"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Edit Salary
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
            <h1 className="text-lg font-medium text-gray-900">Salary Management</h1>
          </header>
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-red-500 text-6xl mb-4">🔒</div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Access Denied</h2>
              <p className="text-gray-600">You do not have permission to view salary records.</p>
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
              <h1 className="text-lg font-medium text-gray-900">Salary Management</h1>
              <p className="text-gray-600 mt-1">
                Manage employee salary records and payroll
              </p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden w-[385px] sm:w-auto">
              <div className="px-6 py-4 flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900">All Salary Records</h2>
                {permissions.canWrite && (
                  <button
                    onClick={handleAddSalary}
                    className="flex items-center bg-blue-500 py-2 px-4 rounded-lg font-medium text-white hover:bg-blue-800 text-sm transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Salary
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gross Salary</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net Salary</th>
                        {(permissions.canEdit || permissions.canDelete) && (
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {salaries.length > 0 ? (
                        salaries.map((salary, index) => (
                          <tr 
                            key={`${salary.employee_id}-${salary.due_year}-${salary.due_month}`} 
                            className="hover:bg-gray-50 transition-colors cursor-pointer"
                            onClick={() => handleSalaryClick(salary)}
                          >
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
                              <div className="text-sm text-gray-900">
                                {formatCurrency(salary.gross_salary)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 font-medium">
                                {formatCurrency(salary.net_salary)}
                              </div>
                            </td>
                            {(permissions.canEdit || permissions.canDelete) && (
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex space-x-2">
                                  {permissions.canEdit && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditClick(salary);
                                      }}
                                      className="text-blue-600 hover:text-blue-900 transition-colors p-1 rounded"
                                      title="Edit Salary"
                                    >
                                      <Settings className="h-4 w-4" />
                                    </button>
                                  )}
                                  {permissions.canDelete && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteClick(salary);
                                      }}
                                      className="text-red-600 hover:text-red-900 transition-colors p-1 rounded"
                                      title="Delete Salary"
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
                          <td colSpan={permissions.canEdit || permissions.canDelete ? 6 : 5} className="px-6 py-12 text-center">
                            <div className="text-gray-500">
                              <p className="text-sm">No salary records found</p>
                              {permissions.canWrite && (
                                <p className="text-xs mt-1">Click "Add Salary" to create your first salary record.</p>
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

      <SalaryModal />
      <DeleteModal />
      <EditModal />
    </div>
  );
};

export default HRSalaries;