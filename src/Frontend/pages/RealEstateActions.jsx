import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { Plus, Trash2, AlertTriangle, Phone, Calendar } from 'lucide-react';

const RealEstateActions = ({ user, onLogout }) => {
  const [actions, setActions] = useState([]);
  const [leads, setLeads] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAction, setSelectedAction] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [actionToDelete, setActionToDelete] = useState(null);
  const [permissions, setPermissions] = useState({});
  const [deleteLoading, setDeleteLoading] = useState(false);
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
        const realEstateActionPerms = userPermissions.find(
          perm => perm.module_id === 1 && perm.feature_id === 2
        );
        
        setPermissions({
          canRead: realEstateActionPerms?.d_read || false,
          canWrite: realEstateActionPerms?.d_write || false,
          canEdit: realEstateActionPerms?.d_edit || false,
          canDelete: realEstateActionPerms?.d_delete || false
        });
      }
    } catch (error) {
      console.error('Failed to fetch permissions:', error);
    }
  };

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      
      const [leadsResponse, usersResponse] = await Promise.all([
        fetch('http://localhost:8000/api/real-estate/leads', {
          headers: { 'Authorization': `Basic ${token}` },
        }),
        fetch('http://localhost:8000/api/auth/users', {
          headers: { 'Authorization': `Basic ${token}` },
        }).catch(() => ({ ok: false }))
      ]);

      let allActions = [];
      
      if (leadsResponse.ok) {
        const leadsData = await leadsResponse.json();
        setLeads(leadsData);
        
        for (const lead of leadsData) {
          try {
            const [callsResponse, meetingsResponse] = await Promise.all([
              fetch(`http://localhost:8000/api/real-estate/leads/${lead.lead_id}/calls`, {
                headers: { 'Authorization': `Basic ${token}` },
              }).catch(() => ({ ok: false })),
              fetch(`http://localhost:8000/api/real-estate/leads/${lead.lead_id}/meetings`, {
                headers: { 'Authorization': `Basic ${token}` },
              }).catch(() => ({ ok: false }))
            ]);

            if (callsResponse.ok) {
              const calls = await callsResponse.json();
              calls.forEach(call => {
                allActions.push({
                  ...call,
                  type: 'call',
                  date: call.call_date,
                  status_id: call.call_status,
                  status_name: call.call_status_name,
                  lead_name: lead.name || lead.lead_phone,
                  lead_id: lead.lead_id,
                  id: call.call_id
                });
              });
            }

            if (meetingsResponse.ok) {
              const meetings = await meetingsResponse.json();
              meetings.forEach(meeting => {
                allActions.push({
                  ...meeting,
                  type: 'meeting',
                  date: meeting.meeting_date,
                  status_id: meeting.meeting_status,
                  status_name: meeting.meeting_status_name,
                  lead_name: lead.name || lead.lead_phone,
                  lead_id: lead.lead_id,
                  id: meeting.meeting_id
                });
              });
            }
          } catch (err) {
            console.warn(`Failed to fetch actions for lead ${lead.lead_id}:`, err);
          }
        }
        
        allActions.sort((a, b) => new Date(b.date) - new Date(a.date));
        setActions(allActions);
      } else if (leadsResponse.status === 403) {
        setError('You do not have permission to view actions');
      } else {
        setError('Failed to fetch actions data');
      }

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData);
      }

    } catch (error) {
      console.error('Failed to fetch data:', error);
      setError('Failed to load actions data');
    } finally {
      setLoading(false);
    }
  };

  const getLeadName = (leadId) => {
    const lead = leads.find(l => l.lead_id === leadId);
    return lead ? (lead.name || lead.lead_phone) : `Lead ${leadId}`;
  };

  const getUserName = (userId) => {
    if (!userId) return 'Unassigned';
    const user = users.find(u => u.id === userId);
    return user ? `${user.first_name} ${user.last_name}` : `User ${userId}`;
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const handleActionClick = (action) => {
    if (!permissions.canRead) {
      alert('You do not have permission to view action details');
      return;
    }
    setSelectedAction(action);
    setShowModal(true);
  };

  const handleDeleteAction = async () => {
    if (!actionToDelete || deleteLoading) return;

    setDeleteLoading(true);

    try {
      const token = localStorage.getItem('auth_token');
      const endpoint = actionToDelete.type === 'call' 
        ? `http://localhost:8000/api/real-estate/leads/${actionToDelete.lead_id}/calls/${actionToDelete.id}`
        : `http://localhost:8000/api/real-estate/leads/${actionToDelete.lead_id}/meetings/${actionToDelete.id}`;

      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          'Authorization': `Basic ${token}`,
        },
      });

      if (response.ok) {
        setActions(actions.filter(action => 
          !(action.type === actionToDelete.type && action.id === actionToDelete.id)
        ));
        setShowDeleteModal(false);
        setActionToDelete(null);
        
      } else if (response.status === 403) {
      } else if (response.status === 404) {
        setActions(actions.filter(action => 
          !(action.type === actionToDelete.type && action.id === actionToDelete.id)
        ));
        setShowDeleteModal(false);
        setActionToDelete(null);
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.detail || 'Failed to delete action');
      }
    } catch (error) {
      console.error('Failed to delete action:', error);
      alert('Failed to delete action. Please check your connection and try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteClick = (action) => {
    if (!permissions.canDelete) {
      alert('You do not have permission to delete actions');
      return;
    }
    setActionToDelete(action);
    setShowDeleteModal(true);
  };

  const handleAddAction = () => {
    if (!permissions.canWrite) {
      alert('You do not have permission to add new actions');
      return;
    }
    navigate('/real-estate/actions/add');
  };

  const DeleteModal = () => {
    if (!showDeleteModal || !actionToDelete) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md mx-auto transform transition-all">
          <div className="text-center pt-8 pb-6 px-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-1">Delete Action</h2>
            <p className="text-sm text-gray-500">This action cannot be undone</p>
          </div>

          <div className="px-8 pb-8">
            <p className="text-center text-gray-700 mb-6">
              Are you sure you want to delete this{' '}
              <span className="font-medium">{actionToDelete.type}</span>{' '}
              for <span className="font-medium">{actionToDelete.lead_name}</span>?
            </p>
            
            <div className="space-y-3">
              <button
                onClick={handleDeleteAction}
                disabled={deleteLoading}
                className={`w-full py-3 px-4 rounded-xl font-medium transition-colors ${
                  deleteLoading 
                    ? 'bg-gray-400 cursor-not-allowed text-white' 
                    : 'bg-red-500 text-white hover:bg-red-700'
                }`}
              >
                {deleteLoading ? 'Deleting...' : 'Yes, Delete Action'}
              </button>
              
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setActionToDelete(null);
                }}
                disabled={deleteLoading}
                className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-xl font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const ActionModal = () => {
    if (!showModal || !selectedAction) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md mx-auto transform transition-all">
          <div className="text-center pt-8 pb-6 px-8">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
              selectedAction.type === 'call' ? 'bg-blue-100' : 'bg-green-100'
            }`}>
              {selectedAction.type === 'call' ? (
                <Phone className="w-8 h-8 text-blue-600" />
              ) : (
                <Calendar className="w-8 h-8 text-green-600" />
              )}
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-1">
              {selectedAction.type === 'call' ? 'Call' : 'Meeting'} Details
            </h2>
            <p className="text-sm text-gray-500">View action information</p>
          </div>

          <div className="px-8 pb-8">
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-600">Type</span>
                <span className={`text-sm font-medium ${
                  selectedAction.type === 'call' ? 'text-blue-600' : 'text-green-600'
                }`}>
                  {selectedAction.type === 'call' ? 'Phone Call' : 'Meeting'}
                </span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-600">Lead</span>
                <span className="text-sm text-gray-900 font-medium">{selectedAction.lead_name}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-600">Assigned To</span>
                <span className="text-sm text-gray-900">{getUserName(selectedAction.assigned_to)}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-600">Date & Time</span>
                <span className="text-sm text-gray-900">{formatDateTime(selectedAction.date)}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-600">Status</span>
                <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                  selectedAction.status_name === 'Scheduled' ? 'bg-blue-100 text-blue-800' :
                  selectedAction.status_name === 'Done' ? 'bg-green-100 text-green-800' :
                  selectedAction.status_name === 'Cancelled' ? 'bg-red-100 text-red-800' :
                  selectedAction.status_name === 'Rescheduled' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {selectedAction.status_name || 'Unknown'}
                </span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-600">Created</span>
                <span className="text-sm text-gray-900">
                  {selectedAction.date_added ? formatDate(selectedAction.date_added) : 'N/A'}
                </span>
              </div>
            </div>
            
            <div className="mt-8 space-y-3">
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
            <h1 className="text-lg font-medium text-gray-900">Actions Management</h1>
          </header>
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-red-500 text-6xl mb-4">🔒</div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Access Denied</h2>
              <p className="text-gray-600">You do not have permission to view action records.</p>
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
              <h1 className="text-lg font-medium text-gray-900">Meetings/Calls Management</h1>
              <p className="text-gray-600 mt-1">
                Manage calls and meetings with leads
              </p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden w-[385px] sm:w-auto">
              <div className="px-6 py-4 flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900">All Actions</h2>
                {permissions.canWrite && (
                  <button
                    onClick={handleAddAction}
                    className="flex items-center bg-blue-500 py-2 px-4 rounded-lg font-medium text-white hover:bg-blue-800 text-sm transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Action
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lead</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        {permissions.canDelete && (
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {actions.length > 0 ? (
                        actions.map((action, index) => (
                          <tr 
                            key={`${action.type}-${action.id}`} 
                            className="hover:bg-gray-50 transition-colors cursor-pointer"
                            onClick={() => handleActionClick(action)}
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {String(index + 1).padStart(2, '0')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                {action.type === 'call' ? (
                                  <Phone className="h-4 w-4 text-blue-600 mr-2" />
                                ) : (
                                  <Calendar className="h-4 w-4 text-green-600 mr-2" />
                                )}
                                <span className={`text-sm font-medium ${
                                  action.type === 'call' ? 'text-blue-600' : 'text-green-600'
                                }`}>
                                  {action.type === 'call' ? 'Call' : 'Meeting'}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {action.lead_name}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {getUserName(action.assigned_to)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {formatDate(action.date)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                action.status_name === 'Scheduled' ? 'bg-blue-100 text-blue-800' :
                                action.status_name === 'Done' ? 'bg-green-100 text-green-800' :
                                action.status_name === 'Cancelled' ? 'bg-red-100 text-red-800' :
                                action.status_name === 'Rescheduled' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {action.status_name || 'Unknown'}
                              </span>
                            </td>
                            {permissions.canDelete && (
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteClick(action);
                                  }}
                                  className="text-red-600 hover:text-red-900 transition-colors p-1 rounded"
                                  title="Delete Action"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </td>
                            )}
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={permissions.canDelete ? 7 : 6} className="px-6 py-12 text-center">
                            <div className="text-gray-500">
                              <p className="text-sm">No actions found</p>
                              {permissions.canWrite && (
                                <p className="text-xs mt-1">Click "Add Action" to create your first call or meeting record.</p>
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

      <ActionModal />
      <DeleteModal />
    </div>
  );
};

export default RealEstateActions;