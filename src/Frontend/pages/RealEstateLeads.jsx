// src/Frontend/pages/RealEstateLeads.jsx - Complete Lead Management
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { Plus, Trash2, Settings, AlertTriangle, Save, UserCheck } from 'lucide-react';

const RealEstateLeads = ({ user, onLogout }) => {
  const [leads, setLeads] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLead, setSelectedLead] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState(null);
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
        const realEstateLeadPerms = userPermissions.find(
          perm => perm.module_id === 1 && perm.feature_id === 1
        );
        
        setPermissions({
          canRead: realEstateLeadPerms?.d_read || false,
          canWrite: realEstateLeadPerms?.d_write || false,
          canEdit: realEstateLeadPerms?.d_edit || false,
          canDelete: realEstateLeadPerms?.d_delete || false
        });
      }
    } catch (error) {
      console.error('Failed to fetch permissions:', error);
    }
  };

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      
      // Fetch both leads and users
      const [leadsResponse, usersResponse] = await Promise.all([
        fetch('http://localhost:8000/api/real-estate/leads', {
          headers: { 'Authorization': `Basic ${token}` },
        }),
        fetch('http://localhost:8000/api/auth/users', {
          headers: { 'Authorization': `Basic ${token}` },
        }).catch(() => ({ ok: false }))
      ]);

      if (leadsResponse.ok) {
        const leadsData = await leadsResponse.json();
        setLeads(leadsData);
        
        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          setUsers(usersData);
        }
      } else if (leadsResponse.status === 403) {
        setError('You do not have permission to view leads');
      } else {
        setError('Failed to fetch leads data');
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setError('Failed to load leads data');
    } finally {
      setLoading(false);
    }
  };

  const getUserName = (userId) => {
    if (!userId) return 'Unassigned';
    const user = users.find(u => u.id === userId);
    return user ? `${user.first_name} ${user.last_name}` : `User ${userId}`;
  };

  const formatPhone = (phone) => {
    if (!phone) return 'N/A';
    return phone;
  };

  const handleLeadClick = (lead) => {
    if (!permissions.canRead) {
      alert('You do not have permission to view lead details');
      return;
    }
    setSelectedLead(lead);
    setShowModal(true);
  };

  const handleDeleteLead = async () => {
    if (!leadToDelete) return;

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(
        `http://localhost:8000/api/real-estate/leads/${leadToDelete.lead_id}`, 
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Basic ${token}`,
          },
        }
      );

      if (response.ok) {
        setLeads(leads.filter(lead => lead.lead_id !== leadToDelete.lead_id));
        setShowDeleteModal(false);
        setLeadToDelete(null);
      } else if (response.status === 403) {
        alert('You do not have permission to delete leads');
      } else {
        alert('Failed to delete lead');
      }
    } catch (error) {
      console.error('Failed to delete lead:', error);
      alert('Failed to delete lead');
    }
  };

  const handleDeleteClick = (lead) => {
    if (!permissions.canDelete) {
      alert('You do not have permission to delete leads');
      return;
    }
    setLeadToDelete(lead);
    setShowDeleteModal(true);
  };

  const handleEditClick = (lead) => {
    if (!permissions.canEdit) {
      alert('You do not have permission to edit leads');
      return;
    }
    setEditFormData({
      name: lead.name || '',
      email: lead.email || '',
      gender: lead.gender || '',
      job_title: lead.job_title || '',
      assigned_to: lead.assigned_to || ''
    });
    setSelectedLead(lead);
    setShowEditModal(true);
    setEditError(null);
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError(null);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(
        `http://localhost:8000/api/real-estate/leads/${selectedLead.lead_id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${token}`,
          },
          body: JSON.stringify(editFormData)
        }
      );

      if (response.ok) {
        const updatedLead = await response.json();
        setLeads(leads.map(lead => 
          lead.lead_id === selectedLead.lead_id ? updatedLead : lead
        ));
        setShowEditModal(false);
        setSelectedLead(null);
      } else if (response.status === 403) {
        setEditError('You do not have permission to edit leads');
      } else {
        const errorData = await response.json();
        setEditError(errorData.detail || 'Failed to update lead');
      }
    } catch (error) {
      console.error('Failed to update lead:', error);
      setEditError('Failed to update lead. Please try again.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleAddLead = () => {
    if (!permissions.canWrite) {
      alert('You do not have permission to add new leads');
      return;
    }
    navigate('/real-estate/leads/add');
  };

  // Delete Confirmation Modal
  const DeleteModal = () => {
    if (!showDeleteModal || !leadToDelete) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md mx-auto transform transition-all">
          <div className="text-center pt-8 pb-6 px-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-1">Delete Lead</h2>
            <p className="text-sm text-gray-500">This action cannot be undone</p>
          </div>

          <div className="px-8 pb-8">
            <p className="text-center text-gray-700 mb-6">
              Are you sure you want to delete the lead{' '}
              <span className="font-medium">{leadToDelete.name || leadToDelete.lead_phone}</span>?
            </p>
            
            <div className="space-y-3">
              <button
                onClick={handleDeleteLead}
                className="w-full bg-red-500 text-white py-3 px-4 rounded-xl font-medium hover:bg-red-700 transition-colors"
              >
                Yes, Delete Lead
              </button>
              
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setLeadToDelete(null);
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

  // Edit Lead Modal
  const EditModal = () => {
    if (!showEditModal || !selectedLead) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md mx-auto transform transition-all">
          <div className="text-center pt-8 pb-6 px-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Settings className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-1">Edit Lead</h2>
            <p className="text-sm text-gray-500">Update lead information</p>
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
                  <span className="text-sm font-medium text-gray-600">Phone</span>
                  <span className="text-sm text-gray-900 font-medium">{selectedLead.lead_phone}</span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">Name</span>
                  <input
                    type="text"
                    name="name"
                    value={editFormData.name}
                    onChange={handleEditInputChange}
                    placeholder="Not provided"
                    className="text-sm text-gray-900 bg-transparent border-none outline-none text-right max-w-40"
                  />
                </div>
                
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">Email</span>
                  <input
                    type="email"
                    name="email"
                    value={editFormData.email}
                    onChange={handleEditInputChange}
                    placeholder="Not provided"
                    className="text-sm text-gray-900 bg-transparent border-none outline-none text-right max-w-40"
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
                
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">Job Title</span>
                  <input
                    type="text"
                    name="job_title"
                    value={editFormData.job_title}
                    onChange={handleEditInputChange}
                    placeholder="Not provided"
                    className="text-sm text-gray-900 bg-transparent border-none outline-none text-right max-w-32"
                  />
                </div>
                
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">Assigned To</span>
                  <select
                    name="assigned_to"
                    value={editFormData.assigned_to}
                    onChange={handleEditInputChange}
                    className="text-sm text-gray-900 bg-transparent border-none outline-none"
                  >
                    <option value="">Unassigned</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.first_name} {user.last_name}
                      </option>
                    ))}
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
                {editLoading ? 'Updating...' : 'Update Lead'}
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedLead(null);
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

  // Lead Detail Modal
  const LeadModal = () => {
    if (!showModal || !selectedLead) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md mx-auto transform transition-all">
          <div className="text-center pt-8 pb-6 px-8">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserCheck className="w-8 h-8 text-purple-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-1">Lead Details</h2>
            <p className="text-sm text-gray-500">View lead information</p>
          </div>

          <div className="px-8 pb-8 space-y-4 max-h-96 overflow-y-auto">
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-600">Phone</span>
                <span className="text-sm text-gray-900 font-medium">{selectedLead.lead_phone}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-600">Name</span>
                <span className="text-sm text-gray-900">{selectedLead.name || 'Not provided'}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-600">Email</span>
                <span className="text-sm text-gray-900">{selectedLead.email || 'Not provided'}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-600">Gender</span>
                <span className="text-sm text-gray-900">{selectedLead.gender || 'Not specified'}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-600">Job Title</span>
                <span className="text-sm text-gray-900">{selectedLead.job_title || 'Not provided'}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-600">Assigned To</span>
                <span className="text-sm text-gray-900">{getUserName(selectedLead.assigned_to)}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-600">Lead Type</span>
                <span className="text-sm text-gray-900">{getLeadTypeName(selectedLead.lead_type)}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-600">Date Added</span>
                <span className="text-sm text-gray-900">
                  {selectedLead.date_added ? new Date(selectedLead.date_added).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="px-8 pb-8 space-y-3">
            {permissions.canEdit && (
              <button
                onClick={() => {
                  setShowModal(false);
                  handleEditClick(selectedLead);
                }}
                className="w-full bg-blue-500 text-white py-3 px-4 rounded-xl font-medium hover:bg-blue-800 transition-colors flex items-center justify-center"
              >
                <Settings className="w-4 h-4 mr-2" />
                Edit Lead
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
            <h1 className="text-lg font-medium text-gray-900">Lead Management</h1>
          </header>
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-red-500 text-6xl mb-4">🔒</div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Access Denied</h2>
              <p className="text-gray-600">You do not have permission to view lead records.</p>
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-medium text-gray-900">Lead Management</h1>
              <p className="text-gray-600 mt-1">
                Manage customer leads and prospects
              </p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="px-6 py-4 flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900">All Leads</h2>
                {permissions.canWrite && (
                  <button
                    onClick={handleAddLead}
                    className="flex items-center bg-blue-500 py-2 px-4 rounded-lg font-medium text-white hover:bg-blue-800 text-sm transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Lead
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lead Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                        {(permissions.canEdit || permissions.canDelete) && (
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {leads.length > 0 ? (
                        leads.map((lead, index) => (
                          <tr 
                            key={lead.lead_id} 
                            className="hover:bg-gray-50 transition-colors cursor-pointer"
                            onClick={() => handleLeadClick(lead)}
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {String(index + 1).padStart(2, '0')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {lead.name || 'N/A'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {formatPhone(lead.lead_phone)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {lead.email || 'N/A'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {getUserName(lead.assigned_to)}
                              </div>
                            </td>
                            {(permissions.canEdit || permissions.canDelete) && (
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex space-x-2">
                                  {permissions.canEdit && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditClick(lead);
                                      }}
                                      className="text-blue-600 hover:text-blue-900 transition-colors p-1 rounded"
                                      title="Edit Lead"
                                    >
                                      <Settings className="h-4 w-4" />
                                    </button>
                                  )}
                                  {permissions.canDelete && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteClick(lead);
                                      }}
                                      className="text-red-600 hover:text-red-900 transition-colors p-1 rounded"
                                      title="Delete Lead"
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
                              <p className="text-sm">No leads found</p>
                              {permissions.canWrite && (
                                <p className="text-xs mt-1">Click "Add Lead" to create your first lead record.</p>
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

      <LeadModal />
      <DeleteModal />
      <EditModal />
    </div>
  );
};

export default RealEstateLeads;