import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users, DollarSign, UserCheck, Settings } from 'lucide-react';

const Block1Dashboard = () => {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
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
          setPermissions(userPermissions);
        }
      } catch (error) {
        console.error('Failed to fetch permissions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, []);

  const hasReadPermission = (moduleId, featureId) => {
    return permissions.some(
      perm => perm.module_id === moduleId && 
              perm.feature_id === featureId && 
              perm.d_read === true
    );
  };

  const moduleCards = [
    {
      id: 'employees',
      title: 'Employees',
      subtitle: 'show all Employees',
      icon: Users,
      bgColor: 'bg-orange-100',
      iconColor: 'text-orange-600',
      path: '/hr/employees',
      moduleId: 2, 
      featureId: 1,
    },
    {
      id: 'salaries',
      title: 'Salaries',
      subtitle: 'Show all Salaries',
      icon: DollarSign,
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-600',
      path: '/hr/salaries',
      moduleId: 2, 
      featureId: 2, 
    },
    {
      id: 'leads',
      title: 'Leads',
      subtitle: 'show all Leads',
      icon: UserCheck,
      bgColor: 'bg-purple-100',
      iconColor: 'text-purple-600',
      path: '/real-estate/leads',
      moduleId: 1, 
      featureId: 1, 
    },
    {
      id: 'actions',
      title: 'Actions',
      subtitle: 'show all Actions',
      icon: Settings,
      bgColor: 'bg-green-100',
      iconColor: 'text-green-600',
      path: '/real-estate/actions',
      moduleId: 1, 
      featureId: 2, 
    }
  ];

  const visibleCards = moduleCards.filter(card => 
    hasReadPermission(card.moduleId, card.featureId)
  );

  const handleCardClick = (path) => {
    navigate(path);
  };

  if (loading) {
    return (
      <div className="py-4 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap gap-4 sm:gap-6 justify-center sm:justify-start ">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 w-full sm:w-auto min-w-48 animate-pulse">
                <div className="flex flex-col items-center text-center">
                  <div className="w-8 h-8 bg-gray-200 rounded-lg mb-3"></div>
                  <div className="h-5 bg-gray-200 rounded w-20 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="sm:grid sm:grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {visibleCards.map((card) => {
            const IconComponent = card.icon;
            
            return (
              <div
                key={card.id}
                onClick={() => handleCardClick(card.path)}
                className="bg-white rounded-lg border border-white hover:border-gray-300 hover:shadow-md transition-all duration-200 cursor-pointer p-6 w-[385px] sm:w-auto "
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                    {card.title}
                  </h3>
                  
                  <div className={`${card.bgColor} rounded-lg p-2 flex items-center justify-center flex-shrink-0`}>
                    <IconComponent className={`h-6 w-6 sm:h-7 sm:w-7 ${card.iconColor}`} />
                  </div>
                </div>
                
                <p className="text-xs sm:text-sm text-gray-600 text-left">
                  {card.subtitle}
                </p>
              </div>
            );
          })}
        </div>
        
        {visibleCards.length === 0 && !loading && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center my-8">
            <p className="text-gray-600">No modules available based on your current permissions.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Block1Dashboard;