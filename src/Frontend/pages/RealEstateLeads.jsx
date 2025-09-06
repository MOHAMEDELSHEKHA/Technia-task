// src/Frontend/pages/RealEstateLeads.jsx - Enhanced with Consistent Design & Action Scheduling
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { Plus, Trash2, Settings, AlertTriangle, Save, UserCheck, Phone, Calendar, Clock, X } from 'lucide-react';

const RealEstateLeads = ({ user, onLogout }) => {
  const [leads, setLeads] = useState([]);
  const [users, setUsers] = useState([]);
  const [leadTypes, setLeadTypes] = useState([]);
  const [leadStatuses, setLeadStatuses] = useState([]);
  const [leadStages, setLeadStages] = useState([]);
  const [callStatuses, setCallStatuses] = useState([]);
  const [meetingStatuses, setMeetingStatuses] = useState([]);
  const [leadActions, setLeadActions] = useState({ calls: [], meetings: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLead, setSelectedLead] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [actionFormData, setActionFormData] = useState({
    action_type: '', // 'call' or 'meeting'
    date: '',
    time: '',
    status_id: ''
  });
  const [editLoading, setEditLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [editError, setEditError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [permissions, setPermissions] = useState({});
  const [actionsLoading, setActionsLoading] = useState(false);
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
        const realEstateActionPerms = userPermissions.find(
          perm => perm.module_id === 1 && perm.feature_id === 2
        );
        
        setPermissions({
          canRead: realEstateLeadPerms?.d_read || false,
          canWrite: realEstateLeadPerms?.d_write || false,
          canEdit: realEstateLeadPerms?.d_edit || false,
          canDelete: realEstateLeadPerms?.d_delete || false,
          canWriteActions: realEstateActionPerms?.d_write || false
        });
      }
    } catch (error) {
      console.error('Failed to fetch permissions:', error);
    }
  };

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      
      // Fetch all required data
      const [leadsResponse, usersResponse, typesResponse, statusesResponse, stagesResponse, callStatusesResponse, meetingStatusesResponse] = await Promise.all([
        fetch('http://localhost:8000/api/real-estate/leads', {
          headers: { 'Authorization': `Basic ${token}` },
        }),
        fetch('http://localhost:8000/api/auth/users', {
          headers: { 'Authorization': `Basic ${token}` },
        }).catch(() => ({ ok: false })),
        fetch('http://localhost:8000/api/real-estate/lookup/types', {
          headers: { 'Authorization': `Basic ${token}` },
        }).catch(() => ({ ok: false })),
        fetch('http://localhost:8000/api/real-estate/lookup/statuses', {
          headers: { 'Authorization': `Basic ${token}` },
        }).catch(() => ({ ok: false })),
        fetch('http://localhost:8000/api/real-estate/lookup/stages', {
          headers: { 'Authorization': `Basic ${token}` },
        }).catch(() => ({ ok: false })),
        fetch('http://localhost:8000/api/real-estate/lookup/call-statuses', {
          headers: { 'Authorization': `Basic ${token}` },
        }).catch(() => ({ ok: false })),
        fetch('http://localhost:8000/api/real-estate/lookup/meeting-statuses', {
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

        if (typesResponse.ok) {
          const typesData = await typesResponse.json();
          setLeadTypes(typesData);
        }

        if (statusesResponse.ok) {
          const statusesData = await statusesResponse.json();
          setLeadStatuses(statusesData);
        }

        if (stagesResponse.ok) {
          const stagesData = await stagesResponse.json();
          setLeadStages(stagesData);
        }

        if (callStatusesResponse.ok) {
          const callStatusesData = await callStatusesResponse.json();
          setCallStatuses(callStatusesData);
        }

        if (meetingStatusesResponse.ok) {
          const meetingStatusesData = await meetingStatusesResponse.json();
          setMeetingStatuses(meetingStatusesData);
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

  const fetchLeadActions = async (leadId) => {
    setActionsLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      
      const [callsResponse, meetingsResponse] = await Promise.all([
        fetch(`http://localhost:8000/api/real-estate/leads/${leadId}/calls`, {
          headers: { 'Authorization': `Basic ${token}` },
        }).catch(() => ({ ok: false })),
        fetch(`http://localhost:8000/api/real-estate/leads/${leadId}/meetings`, {
          headers: { 'Authorization': `Basic ${token}` },
        }).catch(() => ({ ok: false }))
      ]);

      const actions = { calls: [], meetings: [] };

      if (callsResponse.ok) {
        actions.calls = await callsResponse.json();
      }

      if (meetingsResponse.ok) {
        actions.meetings = await meetingsResponse.json();
      }

      setLeadActions(actions);
    } catch (error) {
      console.error('Failed to fetch lead actions:', error);
      setLeadActions({ calls: [], meetings: [] });
    } finally {
      setActionsLoading(false);
    }
  };

  const getUserName = (userId) => {
    if (!userId) return 'Unassigned';
    const user = users.find(u => u.id === userId);
    return user ? `${user.first_name} ${user.last_name}` : `User ${userId}`;
  };

  const getLeadTypeName = (typeId) => {
    if (!typeId) return 'Not specified';
    const type = leadTypes.find(t => t.id === typeId);
    return type ? type.name : `Type ${typeId}`;
  };

  const getLeadStatusName = (statusId) => {
    if (!statusId) return 'Not specified';
    const status = leadStatuses.find(s => s.id === statusId);
    return status ? status.name : `Status ${statusId}`;
  };

  const getLeadStageName = (stageId) => {
    if (!stageId) return 'Not specified';
    const stage = leadStages.find(s => s.id === stageId);
    return stage ? stage.name : `Stage ${stageId}`;
  };

  const formatPhone = (phone) => {
    if (!phone) return 'N/A';
    return phone;
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const handleLeadClick = async (lead) => {
    if (!permissions.canRead) {
      alert('You do not have permission to view lead details');
      return;
    }
    setSelectedLead(lead);
    setShowModal(true);
    
    // Fetch actions for this lead
    await fetchLeadActions(lead.lead_id);
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
      assigned_to: lead.assigned_to || '',
      lead_type: lead.lead_type || '',
      lead_status: lead.lead_status || '',
      lead_stage: lead.lead_stage || ''
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
        
        // If lead stage changed to "Action Taken" and user can write actions
        if (editFormData.lead_stage === 3 && permissions.canWriteActions) {
          setActionFormData({
            action_type: '',
            date: '',
            time: '',
            status_id: ''
          });
          setShowActionModal(true);
        }
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

  const handleActionInputChange = (e) => {
    const { name, value } = e.target;
    setActionFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleActionSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setActionError(null);

    if (!actionFormData.action_type || !actionFormData.date || !actionFormData.time || !actionFormData.status_id) {
      setActionError('All fields are required');
      setActionLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const dateTime = new Date(`${actionFormData.date}T${actionFormData.time}`).toISOString();
      
      const endpoint = actionFormData.action_type === 'call' 
        ? `http://localhost:8000/api/real-estate/leads/${selectedLead.lead_id}/calls`
        : `http://localhost:8000/api/real-estate/leads/${selectedLead.lead_id}/meetings`;

      const bodyData = actionFormData.action_type === 'call'
        ? {
            call_date: dateTime,
            call_status: parseInt(actionFormData.status_id)
          }
        : {
            meeting_date: dateTime,
            meeting_status: parseInt(actionFormData.status_id)
          };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${token}`,
        },
        body: JSON.stringify(bodyData)
      });

      if (response.ok) {
        setShowActionModal(false);
        setActionFormData({
          action_type: '',
          date: '',
          time: '',
          status_id: ''
        });
        
        // Refresh lead actions
        if (selectedLead) {
          await fetchLeadActions(selectedLead.lead_id);
        }
      } else if (response.status === 403) {
        setActionError('You do not have permission to create actions');
      } else {
        const errorData = await response.json();
        setActionError(errorData.detail || 'Failed to create action');
      }
    } catch (error) {
      console.error('Failed to create action:', error);
      setActionError('Failed to create action. Please try again.');
    } finally {
      setActionLoading(false);
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

  // Action Scheduling Modal
  const ActionModal = () => {
    if (!showActionModal || !selectedLead) return null;

    const currentStatuses = actionFormData.action_type === 'call' ? callStatuses : meetingStatuses;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md mx-auto transform transition-all">
          <div className="text-center pt-8 pb-6 px-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-1">Schedule Action</h2>
            <p className="text-sm text-gray-500">Since stage is "Action Taken", schedule a call or meeting</p>
          </div>

          <form onSubmit={handleActionSubmit} className="px-8 pb-8">
            {actionError && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-red-600 text-sm text-center">{actionError}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Action Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="action_type"
                  value={actionFormData.action_type}
                  onChange={handleActionInputChange}
                  className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  required
                >
                  <option value="">Select Action Type</option>
                  <option value="call">Phone Call</option>
                  <option value="meeting">Meeting</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={actionFormData.date}
                    onChange={handleActionInputChange}
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    name="time"
                    value={actionFormData.time}
                    onChange={handleActionInputChange}
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  name="status_id"
                  value={actionFormData.status_id}
                  onChange={handleActionInputChange}
                  className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  required
                >
                  <option value="">Select Status</option>
                  {currentStatuses.map(status => (
                    <option key={status.id} value={status.id}>
                      {status.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-8 space-y-3">
              <button
                type="submit"
                disabled={actionLoading}
                className="w-full bg-blue-500 text-white py-3 px-4 rounded-xl font-medium hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                <Save className="w-4 h-4 mr-2" />
                {actionLoading ? 'Scheduling...' : `Schedule ${actionFormData.action_type === 'call' ? 'Call' : 'Meeting'}`}
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setShowActionModal(false);
                  setActionFormData({
                    action_type: '',
                    date: '',
                    time: '',
                    status_id: ''
                  });
                  setActionError(null);
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

  // Edit Lead Modal - Consistent Design
  const EditModal = () => {
    if (!showEditModal || !selectedLead) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md mx-auto transform transition-all max-h-screen overflow-y-auto">
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

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Phone</label>
                <input
                  type="text"
                  value={selectedLead.lead_phone}
                  disabled
                  className="w-full px-4 py-3 bg-gray-100 border-0 rounded-xl text-gray-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Name</label>
                <input
                  type="text"
                  name="name"
                  value={editFormData.name}
                  onChange={handleEditInputChange}
                  placeholder="Enter name"
                  className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={editFormData.email}
                  onChange={handleEditInputChange}
                  placeholder="Enter email"
                  className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Gender</label>
                <select
                  name="gender"
                  value={editFormData.gender}
                  onChange={handleEditInputChange}
                  className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Job Title</label>
                <input
                  type="text"
                  name="job_title"
                  value={editFormData.job_title}
                  onChange={handleEditInputChange}
                  placeholder="Enter job title"
                  className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Lead Type</label>
                <select
                  name="lead_type"
                  value={editFormData.lead_type}
                  onChange={handleEditInputChange}
                  className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                >
                  <option value="">Select Type</option>
                  {leadTypes.map(type => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Lead Status</label>
                <select
                  name="lead_status"
                  value={editFormData.lead_status}
                  onChange={handleEditInputChange}
                  className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                >
                  <option value="">Select Status</option>
                  {leadStatuses.map(status => (
                    <option key={status.id} value={status.id}>
                      {status.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Lead Stage</label>
                <select
                  name="lead_stage"
                  value={editFormData.lead_stage}
                  onChange={handleEditInputChange}
                  className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                >
                  <option value="">Select Stage</option>
                  {leadStages.map(stage => (
                    <option key={stage.id} value={stage.id}>
                      {stage.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Assigned To</label>
                <select
                  name="assigned_to"
                  value={editFormData.assigned_to}
                  onChange={handleEditInputChange}
                  className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
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

  // Lead Detail Modal - Consistent Design
  const LeadModal = () => {
    if (!showModal || !selectedLead) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl mx-auto transform transition-all max-h-screen overflow-y-auto">
          <div className="text-center pt-8 pb-6 px-8">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserCheck className="w-8 h-8 text-purple-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-1">Lead Details</h2>
            <p className="text-sm text-gray-500">View complete lead information and actions</p>
          </div>

          <div className="px-8 pb-8">
            {/* Lead Information */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Lead Information</h3>
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
                  <span className="text-sm font-medium text-gray-600">Lead Type</span>
                  <span className="text-sm text-gray-900">{getLeadTypeName(selectedLead.lead_type)}</span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">Lead Status</span>
                  <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                    selectedLead.lead_status === 1 ? 'bg-red-100 text-red-800' :
                    selectedLead.lead_status === 2 ? 'bg-yellow-100 text-yellow-800' :
                    selectedLead.lead_status === 3 ? 'bg-blue-100 text-blue-800' :
                    selectedLead.lead_status === 4 ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {getLeadStatusName(selectedLead.lead_status)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">Lead Stage</span>
                  <span className="text-sm text-gray-900">{getLeadStageName(selectedLead.lead_stage)}</span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">Assigned To</span>
                  <span className="text-sm text-gray-900">{getUserName(selectedLead.assigned_to)}</span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">Date Added</span>
                  <span className="text-sm text-gray-900">
                    {selectedLead.date_added ? new Date(selectedLead.date_added).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions Section */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions History</h3>
              
              {actionsLoading ? (
                <div className="text-center py-4">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-gray-500"></div>
                  <p className="text-sm text-gray-500 mt-2">Loading actions...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Calls Section */}
                  <div>
                    <div className="flex items-center mb-2">
                      <Phone className="w-4 h-4 text-blue-600 mr-2" />
                      <h4 className="text-md font-medium text-gray-800">Calls ({leadActions.calls.length})</h4>
                    </div>
                    
                    {leadActions.calls.length > 0 ? (
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {leadActions.calls.map((call, index) => (
                          <div key={call.call_id || index} className="bg-blue-50 p-3 rounded-lg">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  Call #{call.call_id}
                                </p>
                                <p className="text-xs text-gray-600">
                                  Status: {call.call_status_name || 'Unknown'}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-gray-500">
                                  {formatDateTime(call.call_date)}
                                </p>
                                <p className="text-xs text-gray-500">
                                  by {getUserName(call.assigned_to)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">No calls recorded</p>
                    )}
                  </div>

                  {/* Meetings Section */}
                  <div>
                    <div className="flex items-center mb-2">
                      <Calendar className="w-4 h-4 text-green-600 mr-2" />
                      <h4 className="text-md font-medium text-gray-800">Meetings ({leadActions.meetings.length})</h4>
                    </div>
                    
                    {leadActions.meetings.length > 0 ? (
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {leadActions.meetings.map((meeting, index) => (
                          <div key={meeting.meeting_id || index} className="bg-green-50 p-3 rounded-lg">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  Meeting #{meeting.meeting_id}
                                </p>
                                <p className="text-xs text-gray-600">
                                  Status: {meeting.meeting_status_name || 'Unknown'}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-gray-500">
                                  {formatDateTime(meeting.meeting_date)}
                                </p>
                                <p className="text-xs text-gray-500">
                                  by {getUserName(meeting.assigned_to)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">No meetings scheduled</p>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="space-y-3">
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
                onClick={() => {
                  setShowModal(false);
                  setLeadActions({ calls: [], meetings: [] });
                }}
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
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
                                {getLeadTypeName(lead.lead_type)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                lead.lead_status === 1 ? 'bg-red-100 text-red-800' :
                                lead.lead_status === 2 ? 'bg-yellow-100 text-yellow-800' :
                                lead.lead_status === 3 ? 'bg-blue-100 text-blue-800' :
                                lead.lead_status === 4 ? 'bg-green-100 text-green-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {getLeadStatusName(lead.lead_status)}
                              </span>
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
                          <td colSpan={permissions.canEdit || permissions.canDelete ? 7 : 6} className="px-6 py-12 text-center">
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
      <ActionModal />
    </div>
  );
};

export default RealEstateLeads;
                