// src/Frontend/components/Sidebar.jsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  DollarSign, 
  UserCheck, 
  Settings,
  Menu,
  X,
  User,
  LogOut
} from 'lucide-react';

const Sidebar = ({ user, onLogout }) => {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Fetch user permissions on component mount
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

  // Check if user has read permission for a specific module/feature
  const hasReadPermission = (moduleId, featureId) => {
    return permissions.some(
      perm => perm.module_id === moduleId && 
              perm.feature_id === featureId && 
              perm.d_read === true
    );
  };

  // Define all possible menu items with their permission requirements
  const menuItems = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      icon: LayoutDashboard,
      path: '/',
      always: true // Dashboard is always visible
    },
    {
      id: 'staff',
      name: 'Staff',
      icon: Users,
      path: '/hr/employees',
      moduleId: 2, // HR module
      featureId: 1, // Employees feature
    },
    {
      id: 'salaries',
      name: 'Salaries',
      icon: DollarSign,
      path: '/hr/salaries',
      moduleId: 2, // HR module
      featureId: 2, // Salaries feature
    },
    {
      id: 'leads',
      name: 'Leads',
      icon: UserCheck,
      path: '/real-estate/leads',
      moduleId: 1, // Real Estate module
      featureId: 1, // Leads feature
    },
    {
      id: 'actions',
      name: 'Actions',
      icon: Settings,
      path: '/real-estate/actions',
      moduleId: 1, // Real Estate module
      featureId: 2, // Actions feature
    }
  ];

  // Filter menu items based on permissions
  const visibleMenuItems = menuItems.filter(item => {
    if (item.always) return true;
    return hasReadPermission(item.moduleId, item.featureId);
  });

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleLogout = () => {
    closeMobileMenu();
    onLogout();
  };

  // Mobile hamburger button (only visible on small screens)
  const MobileMenuButton = () => (
    <div className="lg:hidden fixed top-4 left-4 z-50">
      <button
        onClick={toggleMobileMenu}
        className="p-2 rounded-lg bg-white shadow-md border border-gray-200 hover:bg-gray-50 transition-colors"
      >
        {isMobileMenuOpen ? (
          <X className="h-6 w-6 text-gray-600" />
        ) : (
          <Menu className="h-6 w-6 text-gray-600" />
        )}
      </button>
    </div>
  );

  // Sidebar content component
  const SidebarContent = ({ isMobile = false }) => (
    <div className={`bg-white border-r border-gray-200 flex flex-col h-full ${isMobile ? 'w-full' : 'w-64'}`}>
      {/* Header with Logo */}
      <div className="flex items-center justify-center py-8 border-b border-gray-100">
        <div className="text-center">
          {/* Technia Logo */}
          <div className="w-12 h-12 mx-auto mb-3">
            <img 
              src="/assets/technia-logo.png" 
              alt="Technia Logo" 
              className="w-full h-full object-contain"
              onError={(e) => {
                // Fallback if image doesn't load
                e.target.style.display = 'none';
                e.target.nextElementSibling.style.display = 'flex';
              }}
            />
            {/* Fallback logo */}
            <div className="hidden w-12 h-12 bg-blue-600 rounded-lg items-center justify-center">
              <span className="text-white font-bold text-lg">T</span>
            </div>
          </div>
          <h2 className="text-sm font-semibold text-gray-800">Technia</h2>
          <p className="text-xs text-gray-500 mt-1">ERP System</p>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 py-4">
        <div className="space-y-1">
          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.id}
                to={item.path}
                onClick={isMobile ? closeMobileMenu : undefined}
                className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className={`h-5 w-5 mr-3 ${
                  isActive ? 'text-blue-600' : 'text-gray-400'
                }`} />
                {item.name}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User Profile Section (All Screen Sizes) */}
      <div className=" p-4">
        <div className="mb-4">
          <div className="flex items-center space-x-3 px-2 py-2">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <button
            className="flex items-center w-full px-2 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <User className="h-4 w-4 mr-3 text-gray-400" />
            Profile
          </button>
          
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-2 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="h-4 w-4 mr-3 text-red-400" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <MobileMenuButton />

      {/* Desktop Sidebar (always visible on large screens) */}
      <div className="hidden lg:block h-screen">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={closeMobileMenu}
          ></div>
          
          {/* Sidebar */}
          <div className="fixed inset-y-0 left-0 w-80 max-w-full">
            <SidebarContent isMobile={true} />
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;