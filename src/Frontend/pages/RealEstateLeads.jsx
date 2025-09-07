import React, { useState, useEffect, useRef } from "react";
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
  const [leadToDelete, setLeadToDelete] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [actionFormData, setActionFormData] = useState({
    action_type: '', 
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
  const [showActionForm, setShowActionForm] = useState(false);
  
  // Add ref for scroll position
  const editModalScrollRef = useRef(null);
  
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
    setShowActionForm(false);
    setActionFormData({
      action_type: '', 
      date: '',
      time: '',
      status_id: ''
    });
    setActionError(null);
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    
    const currentScrollTop = editModalScrollRef.current?.scrollTop || 0;
    
    setEditFormData(prev => {
      const newData = {
        ...prev,
        [name]: value
      };
      
      if (name === 'lead_stage' && value === '3' && permissions.canWriteActions) {
        setShowActionForm(true);
      } else if (name === 'lead_stage' && value !== '3') {
        setShowActionForm(false);
        setActionFormData({
          action_type: '', 
          date: '',
          time: '',
          status_id: ''
        });
        setActionError(null);
      }
      
      return newData;
    });

    setTimeout(() => {
      if (editModalScrollRef.current) {
        editModalScrollRef.current.scrollTop = currentScrollTop;
      }
    }, 0);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError(null);
    setActionError(null);

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

      if (!response.ok) {
        if (response.status === 403) {
          setEditError('You do not have permission to edit leads');
          return;
        } else {
          const errorData = await response.json();
          setEditError(errorData.detail || 'Failed to update lead');
          return;
        }
      }

      const updatedLead = await response.json();
      
      setLeads(leads.map(lead => 
        lead.lead_id === selectedLead.lead_id ? updatedLead : lead
      ));

      if (editFormData.lead_stage === '3' && permissions.canWriteActions) {
        if (!actionFormData.action_type || !actionFormData.date || !actionFormData.time || !actionFormData.status_id) {
          setActionError('All action fields are required when setting stage to Action Taken');
          return;
        }

        try {
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

          const actionResponse = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Basic ${token}`,
            },
            body: JSON.stringify(bodyData)
          });

          if (!actionResponse.ok) {
            if (actionResponse.status === 403) {
              setActionError('You do not have permission to create actions');
              return;
            } else {
              const errorData = await actionResponse.json();
              setActionError(errorData.detail || 'Failed to create action');
              return;
            }
          }

          console.log('Action created successfully');
          
        } catch (actionError) {
          console.error('Failed to create action:', actionError);
          setActionError('Failed to create action. Please try again.');
          return;
        }
      }

   
      setShowEditModal(false);
      setSelectedLead(null);
      setEditError(null);
      setActionError(null);
      setActionFormData({
        action_type: '',
        date: '',
        time: '',
        status_id: ''
      });

      if (showModal) {
        await fetchLeadActions(selectedLead.lead_id);
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
    
    const currentScrollTop = editModalScrollRef.current?.scrollTop || 0;
    
    setActionFormData(prev => ({
      ...prev,
      [name]: value
    }));

    setTimeout(() => {
      if (editModalScrollRef.current) {
        editModalScrollRef.current.scrollTop = currentScrollTop;
      }
    }, 0);
  };

  const handleAddLead = () => {
    if (!permissions.canWrite) {
      alert('You do not have permission to add new leads');
      return;
    }
    navigate('/real-estate/leads/add');
  };

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

const EditModal = () => {
  if (!showEditModal || !selectedLead) return null;

  const currentStatuses = actionFormData.action_type === 'call' ? callStatuses : meetingStatuses;
  const isActionRequired = editFormData.lead_stage === '3'; 
  const isActionCompleted = isActionRequired && actionFormData.action_type && actionFormData.date && actionFormData.time && actionFormData.status_id;
  const canSubmit = !isActionRequired || isActionCompleted;

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

          {actionError && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-red-600 text-sm text-center">{actionError}</p>
            </div>
          )}

          <div ref={editModalScrollRef} className="space-y-4 max-h-96 overflow-y-auto">
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-600">Phone</span>
                <span className="text-sm text-gray-500 font-medium">{selectedLead.lead_phone}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-600">Name</span>
                <input
                  type="text"
                  name="name"
                  value={editFormData.name}
                  onChange={handleEditInputChange}
                  placeholder="Enter name"
                  className="text-sm text-gray-900 font-medium bg-transparent border-none outline-none text-right max-w-32"
                />
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-600">Email</span>
                <input
                  type="email"
                  name="email"
                  value={editFormData.email}
                  onChange={handleEditInputChange}
                  placeholder="Enter email"
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
                  <option value="">Select Gender</option>
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
                  placeholder="Enter job title"
                  className="text-sm text-gray-900 bg-transparent border-none outline-none text-right max-w-32"
                />
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-600">Lead Type</span>
                <select
                  name="lead_type"
                  value={editFormData.lead_type}
                  onChange={handleEditInputChange}
                  className="text-sm text-gray-900 bg-transparent border-none outline-none"
                >
                  <option value="">Select Type</option>
                  {leadTypes.map(type => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-600">Lead Status</span>
                <select
                  name="lead_status"
                  value={editFormData.lead_status}
                  onChange={handleEditInputChange}
                  className="text-sm text-gray-900 bg-transparent border-none outline-none"
                >
                  <option value="">Select Status</option>
                  {leadStatuses.map(status => (
                    <option key={status.id} value={status.id}>
                      {status.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-600">Lead Stage</span>
                <select
                  name="lead_stage"
                  value={editFormData.lead_stage}
                  onChange={handleEditInputChange}
                  className="text-sm text-gray-900 bg-transparent border-none outline-none"
                >
                  <option value="">Select Stage</option>
                  {leadStages.map(stage => (
                    <option key={stage.id} value={stage.id}>
                      {stage.name}
                    </option>
                  ))}
                </select>
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

              {isActionRequired && permissions.canWriteActions && (
                <>
                  {/* Action Type */}
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">
                      Action Type <span className="text-red-500">*</span>
                    </span>
                    <select
                      name="action_type"
                      value={actionFormData.action_type}
                      onChange={handleActionInputChange}
                      className="text-sm text-gray-900 bg-transparent border-none outline-none"
                      required
                    >
                      <option value="">Select Action</option>
                      <option value="call">Phone Call</option>
                      <option value="meeting">Meeting</option>
                    </select>
                  </div>

                  {/* Action Date */}
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">
                      Action Date <span className="text-red-500">*</span>
                    </span>
                    <input
                      type="date"
                      name="date"
                      value={actionFormData.date}
                      onChange={handleActionInputChange}
                      className="text-sm text-gray-900 bg-transparent border-none outline-none text-right"
                      required
                    />
                  </div>

                  {/* Action Time */}
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">
                      Action Time <span className="text-red-500">*</span>
                    </span>
                    <input
                      type="time"
                      name="time"
                      value={actionFormData.time}
                      onChange={handleActionInputChange}
                      className="text-sm text-gray-900 bg-transparent border-none outline-none text-right"
                      required
                    />
                  </div>

                  {/* Action Status */}
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">
                      Action Status <span className="text-red-500">*</span>
                    </span>
                    <select
                      name="status_id"
                      value={actionFormData.status_id}
                      onChange={handleActionInputChange}
                      className="text-sm text-gray-900 bg-transparent border-none outline-none"
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
                </>
              )}

              {isActionRequired && !permissions.canWriteActions && (
                <div className="py-4 px-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                  <p className="text-yellow-800 text-sm text-center">
                    Action scheduling required but you don't have permission to create actions.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 space-y-3">
            <button
              type="submit"
              disabled={editLoading || !canSubmit}
              className={`w-full py-3 px-4 rounded-xl font-medium transition-colors flex items-center justify-center ${
                canSubmit
                  ? 'bg-blue-500 text-white hover:bg-blue-800'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Save className="w-4 h-4 mr-2" />
              {editLoading ? 'Updating...' : 'Update Lead'}
            </button>
            
            {isActionRequired && !isActionCompleted && permissions.canWriteActions && (
              <p className="text-xs text-red-500 text-center">
                Please complete all action scheduling fields to update the lead
              </p>
            )}
            
            <button
              type="button"
              onClick={() => {
                setShowEditModal(false);
                setSelectedLead(null);
                setEditError(null);
                setShowActionForm(false);
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
            <p className="text-sm text-gray-500">View complete lead information</p>
          </div>

          <div className="px-8 pb-8">
            <div className="space-y-4 max-h-96 overflow-y-auto mb-8">
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

                {/* Actions History Section */}
                <div className="pt-4">
                  <h3 className="text-sm font-medium text-gray-600 mb-3 pb-2 border-b border-gray-100">Actions History</h3>
                  
                  {actionsLoading ? (
                    <div className="text-center py-4">
                      <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-gray-500"></div>
                      <p className="text-sm text-gray-500 mt-2">Loading actions...</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Calls Section */}
                      <div className="flex justify-between items-center py-1">
                        <div className="flex items-center">
                          <Phone className="w-3 h-3 text-blue-600 mr-2" />
                          <span className="text-xs font-medium text-gray-600">Calls</span>
                        </div>
                        <span className="text-xs text-gray-500">{leadActions.calls.length}</span>
                      </div>
                      
                      {leadActions.calls.length > 0 && (
                        <div className="space-y-1 max-h-24 overflow-y-auto pl-5">
                          {leadActions.calls.slice(0, 3).map((call, index) => (
                            <div key={call.call_id || index} className="text-xs text-gray-500">
                              {formatDateTime(call.call_date)} - {call.call_status_name || 'Unknown'}
                            </div>
                          ))}
                          {leadActions.calls.length > 3 && (
                            <div className="text-xs text-gray-400">+ {leadActions.calls.length - 3} more</div>
                          )}
                        </div>
                      )}

                      {/* Meetings Section */}
                      <div className="flex justify-between items-center py-1">
                        <div className="flex items-center">
                          <Calendar className="w-3 h-3 text-green-600 mr-2" />
                          <span className="text-xs font-medium text-gray-600">Meetings</span>
                        </div>
                        <span className="text-xs text-gray-500">{leadActions.meetings.length}</span>
                      </div>
                      
                      {leadActions.meetings.length > 0 && (
                        <div className="space-y-1 max-h-24 overflow-y-auto pl-5">
                          {leadActions.meetings.slice(0, 3).map((meeting, index) => (
                            <div key={meeting.meeting_id || index} className="text-xs text-gray-500">
                              {formatDateTime(meeting.meeting_date)} - {meeting.meeting_status_name || 'Unknown'}
                            </div>
                          ))}
                          {leadActions.meetings.length > 3 && (
                            <div className="text-xs text-gray-400">+ {leadActions.meetings.length - 3} more</div>
                          )}
                        </div>
                      )}

                      {leadActions.calls.length === 0 && leadActions.meetings.length === 0 && (
                        <p className="text-xs text-gray-500 text-center py-2">No actions recorded</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
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
        <header className="px-6 lg:px-6 py-8 pl-20 lg:pl-6">
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
            <div className="bg-white rounded-lg shadow-sm overflow-hidden w-[385px] sm:w-auto">
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
    </div>
  );
};

export default RealEstateLeads;