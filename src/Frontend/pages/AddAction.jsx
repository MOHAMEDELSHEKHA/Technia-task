import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { ArrowLeft, Save, Calendar, Phone } from 'lucide-react';

const AddAction = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [callStatuses, setCallStatuses] = useState([]);
  const [meetingStatuses, setMeetingStatuses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [leadsLoading, setLeadsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasWritePermission, setHasWritePermission] = useState(false);
  const [checkingPermissions, setCheckingPermissions] = useState(true);
  const [formData, setFormData] = useState({
    lead_id: '',
    action_type: '',
    date: '',
    time: '',
    status_id: ''
  });

  useEffect(() => {
    checkPermissions();
    fetchLookupData();
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
        const realEstateActionPerms = userPermissions.find(
          perm => perm.module_id === 1 && perm.feature_id === 2
        );
        
        const canWrite = realEstateActionPerms?.d_write || false;
        setHasWritePermission(canWrite);
        
        if (!canWrite) {
          setError('You do not have permission to add new actions');
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

  const fetchLookupData = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      
      const [leadsResponse, callStatusesResponse, meetingStatusesResponse] = await Promise.all([
        fetch('http://localhost:8000/api/real-estate/leads', {
          headers: { 'Authorization': `Basic ${token}` },
        }),
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
      } else {
        setError('Failed to fetch leads data');
      }

      if (callStatusesResponse.ok) {
        const callStatusesData = await callStatusesResponse.json();
        setCallStatuses(callStatusesData);
      }

      if (meetingStatusesResponse.ok) {
        const meetingStatusesData = await meetingStatusesResponse.json();
        setMeetingStatuses(meetingStatusesData);
      }
    } catch (error) {
      console.error('Failed to fetch lookup data:', error);
      setError('Failed to load form data');
    } finally {
      setLeadsLoading(false);
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
      alert('You do not have permission to add actions');
      return;
    }

    setLoading(true);
    setError(null);

    if (!formData.lead_id || !formData.action_type || !formData.date || 
        !formData.time || !formData.status_id) {
      setError('All fields are required');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const dateTime = new Date(`${formData.date}T${formData.time}`).toISOString();
      
      const endpoint = formData.action_type === 'call' 
        ? `http://localhost:8000/api/real-estate/leads/${formData.lead_id}/calls`
        : `http://localhost:8000/api/real-estate/leads/${formData.lead_id}/meetings`;

      const bodyData = formData.action_type === 'call'
        ? {
            call_date: dateTime,
            call_status: parseInt(formData.status_id)
          }
        : {
            meeting_date: dateTime,
            meeting_status: parseInt(formData.status_id)
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
        const newAction = await response.json();
        console.log('Action created successfully:', newAction);
        navigate('/real-estate/actions');
      } else if (response.status === 403) {
        setError('You do not have permission to add actions');
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to create action');
      }
    } catch (error) {
      console.error('Failed to create action:', error);
      setError('Failed to create action. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/real-estate/actions');
  };

  const getCurrentStatuses = () => {
    return formData.action_type === 'call' ? callStatuses : meetingStatuses;
  };

  const getActionIcon = () => {
    return formData.action_type === 'call' ? Phone : Calendar;
  };

  const getActionColor = () => {
    return formData.action_type === 'call' ? 'text-blue-600' : 'text-green-600';
  };

  const getActionBgColor = () => {
    return formData.action_type === 'call' ? 'bg-blue-100' : 'bg-green-100';
  };

  const formatPreviewDateTime = () => {
    if (!formData.date || !formData.time) return '';
    const dateTime = new Date(`${formData.date}T${formData.time}`);
    return `${dateTime.toLocaleDateString()} at ${dateTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
  };

  if (checkingPermissions || leadsLoading) {
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
              <h1 className="text-lg font-medium text-gray-900">Add New Action</h1>
            </div>
          </header>
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-red-500 text-6xl mb-4">🚫</div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Access Denied</h2>
              <p className="text-gray-600 mb-4">You do not have permission to add new actions.</p>
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

  const ActionIcon = getActionIcon();

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
              <h1 className="text-lg font-medium text-gray-900">Add New Action</h1>
              <p className="text-gray-600 mt-1">
                Schedule a new call or meeting with a lead
              </p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-3xl shadow-2xl">
              <div className="text-center pt-8 pb-6 px-8">
                <div className={`w-16 h-16 ${formData.action_type ? getActionBgColor() : 'bg-gray-100'} rounded-full flex items-center justify-center mx-auto mb-4`}>
                  {formData.action_type ? (
                    <ActionIcon className={`w-8 h-8 ${getActionColor()}`} />
                  ) : (
                    <Calendar className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-1">New Action</h2>
                <p className="text-sm text-gray-500">Schedule a call or meeting with a lead</p>
              </div>

              <form onSubmit={handleSubmit} className="px-8 pb-8">
                {error && (
                  <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
                    <p className="text-red-600 text-sm text-center">{error}</p>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label htmlFor="lead_id" className="block text-sm font-medium text-gray-600 mb-2">
                      Select Lead <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="lead_id"
                      name="lead_id"
                      value={formData.lead_id}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                      required
                    >
                      <option value="">Choose a lead</option>
                      {leads.map(lead => (
                        <option key={lead.lead_id} value={lead.lead_id}>
                          {lead.name || lead.lead_phone} {lead.email && `(${lead.email})`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="action_type" className="block text-sm font-medium text-gray-600 mb-2">
                      Action Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="action_type"
                      name="action_type"
                      value={formData.action_type}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                      required
                    >
                      <option value="">Select action type</option>
                      <option value="call">📞 Phone Call</option>
                      <option value="meeting">📅 Meeting</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="date" className="block text-sm font-medium text-gray-600 mb-2">
                        Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        id="date"
                        name="date"
                        value={formData.date}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="time" className="block text-sm font-medium text-gray-600 mb-2">
                        Time <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="time"
                        id="time"
                        name="time"
                        value={formData.time}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="status_id" className="block text-sm font-medium text-gray-600 mb-2">
                      Status <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="status_id"
                      name="status_id"
                      value={formData.status_id}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                      required
                      disabled={!formData.action_type}
                    >
                      <option value="">
                        {!formData.action_type ? 'Select action type first' : 'Select status'}
                      </option>
                      {getCurrentStatuses().map(status => (
                        <option key={status.id} value={status.id}>
                          {status.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {formData.action_type && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center space-x-3">
                        <ActionIcon className={`w-5 h-5 ${getActionColor()}`} />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {formData.action_type === 'call' ? 'Phone Call' : 'Meeting'} Preview
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formData.date && formData.time ? (
                              `Scheduled for ${formatPreviewDateTime()}`
                            ) : (
                              'Select date and time to see preview'
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-8 space-y-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-500 text-white py-3 px-4 rounded-xl font-medium hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {loading ? 'Creating...' : `Create ${formData.action_type === 'call' ? 'Call' : formData.action_type === 'meeting' ? 'Meeting' : 'Action'}`}
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

export default AddAction;