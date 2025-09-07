import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const LeadsTable = () => {
  const [leads, setLeads] = useState([]);
  const [users, setUsers] = useState([]);
  const [leadTypes, setLeadTypes] = useState([]);
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
      
      // Fetch leads, users, and lead types for assignment resolution
      const [leadsResponse, usersResponse, typesResponse] = await Promise.all([
        fetch('http://localhost:8000/api/real-estate/leads', {
          headers: { 'Authorization': `Basic ${token}` },
        }),
        fetch('http://localhost:8000/api/auth/users', {
          headers: { 'Authorization': `Basic ${token}` },
        }).catch(() => ({ ok: false })), 
        fetch('http://localhost:8000/api/real-estate/lookup/types', {
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
      } else if (leadsResponse.status === 403) {
        setHasPermission(false);
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

  const getLeadTypeName = (typeId) => {
    if (!typeId) return 'Not specified';
    const type = leadTypes.find(t => t.id === typeId);
    return type ? type.name : `Type ${typeId}`;
  };

  const formatPhone = (phone) => {
    if (!phone) return 'N/A';
    return phone;
  };

  const displayData = leads.slice(-5);

  const handleViewAllLeads = () => {
    navigate('/real-estate/leads');
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
                    <div className="h-4 bg-gray-200 rounded w-48"></div>
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                    <div className="h-4 bg-gray-200 rounded w-40"></div>
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
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
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Leads</h2>
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
            <h2 className="text-lg font-medium text-gray-900">Recent Leads</h2>
            <button
              onClick={handleViewAllLeads}
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
                    Lead Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned To
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-200">
                {displayData.length > 0 ? (
                  displayData.map((lead, index) => (
                    <tr key={lead.lead_id || index} className="hover:bg-gray-50 transition-colors">
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
                        <div className="text-sm text-gray-900">
                          {getUserName(lead.assigned_to)}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="text-gray-500">
                        <p className="text-sm">No leads data available</p>
                        <p className="text-xs mt-1">There are no leads to display at this time.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 border-t border-gray-200">
            <button
              onClick={handleViewAllLeads}
              className="w-full bg-white text-gray-900 py-2 px-4 rounded-lg font-medium transition-colors"
            >
              View All Leads
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadsTable;