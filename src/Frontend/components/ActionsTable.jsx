import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Calendar } from 'lucide-react';

const ActionsTable = () => {
  const [actions, setActions] = useState([]);
  const [leads, setLeads] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasPermission, setHasPermission] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

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
        
        const leadsToFetch = leadsData.slice(0, 10);
        
        for (const lead of leadsToFetch) {
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
        setActions(allActions.slice(0, 5));
      } else if (leadsResponse.status === 403) {
        setHasPermission(false);
        setError('You do not have permission to view actions');
      } else {
        setError('Failed to fetch leads data');
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

  const getUserName = (userId) => {
    if (!userId) return 'Unassigned';
    const user = users.find(u => u.id === userId);
    return user ? `${user.first_name} ${user.last_name}` : `User ${userId}`;
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const handleViewAllActions = () => {
    navigate('/real-estate/actions');
  };

  if (loading) {
    return (
      <div className="py-4 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-32 mb-6"></div>
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex space-x-4">
                    <div className="h-4 bg-gray-200 rounded w-8"></div>
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                    <div className="h-4 bg-gray-200 rounded w-48"></div>
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!hasPermission) {
    return null;
  }

  if (error) {
    return (
      <div className="py-4 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Actions</h2>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-4 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden w-[385px] sm:w-auto">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Recent Calls/Meetings</h2>
            <button
              onClick={handleViewAllActions}
              className="flex items-center bg-blue-500 py-2 px-4 rounded-lg font-medium text-white hover:bg-blue-800 text-sm font-medium transition-colors"
            >
              More Actions
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    S/N
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lead
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-200">
                {actions.length > 0 ? (
                  actions.map((action, index) => (
                    <tr key={`${action.type}-${action.id}-${action.lead_id}`} className="hover:bg-gray-50 transition-colors">
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
                          {formatDateTime(action.date)}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="text-gray-500">
                        <p className="text-sm">No actions data available</p>
                        <p className="text-xs mt-1">There are no calls or meetings to display at this time.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 border-t border-gray-200">
            <button
              onClick={handleViewAllActions}
              className="w-full bg-white text-gray-900 py-2 px-4 rounded-lg font-medium transition-colors"
            >
              View All Actions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActionsTable;