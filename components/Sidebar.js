// components/Sidebar.js (UPDATED - Hidden Scrollbar)
'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';

export default function Sidebar({ user }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      window.location.href = '/login';
    }
  };

  const menuItems = [
    // {
    //   name: 'Dashboard',
    //   icon: '🏠',
    //   path: '/dashboard',
    //   permission: null
    // },
    {
      section: 'Hospital Management',
      items: [
        {
          name: 'Investigations',
          icon: '🔬',
          path: '/investigations',
          permission: 'view_investigations'
        },
        {
          name: 'Due collections',
          icon: '💰',
          path: '/due-collections',
          permission: 'due_collections'
        },
        {
          name: 'Admissions',
          icon: '🏥',
          path: '/admissions',
          permission: 'view_admissions'
        },
        {
          name: 'Patients',
          icon: '👤',
          path: '/patients',
          permission: 'view_patients'
        }
      ]
    },
    {
      section: 'Pharmacy',
      items: [
        {
          name: 'Inventory',
          icon: '💊',
          path: '/dashboard',
          permission: 'view_inventory'
        },
        {
          name: 'Outdoor Sales',
          icon: '🛒',
          path: '/outdoor-sales',
          permission: 'outdoor_sales'
        }
      ]
    },
    {
      section: 'Configuration',
      items: [
        {
          name: 'Doctors',
          icon: '👨‍⚕️',
          path: '/doctors',
          permission: 'manage_doctors'
        },
        {
          name: 'Beds',
          icon: '🛏️',
          path: '/beds',
          permission: 'manage_beds'
        },
        {
          name: 'Services',
          icon: '⚕️',
          path: '/services',
          permission: 'manage_services'
        },
        {
          name: 'Users',
          icon: '👥',
          path: '/users',
          permission: 'manage_users'
        }
      ]
    },
    {
      section: 'Reports',
      items: [
        {
          name: 'Reports',
          icon: '📊',
          path: '/reports',
          permission: 'view_reports'
        }
      ]
    }
  ];

  const hasPermission = (permission) => {
    if (!permission) return true;
    if (user?.role === 'admin') return true;
    return user?.permissions?.includes(permission);
  };

  const renderMenuItem = (item) => {
    if (!hasPermission(item.permission)) return null;

    return (
      <li key={item.path}>
        <button
          onClick={() => router.push(item.path)}
          className={`w-full flex items-center ${
            isCollapsed ? 'justify-center' : 'space-x-3'
          } px-4 py-3 rounded-lg transition-colors ${
            pathname === item.path
              ? 'bg-blue-600 text-white'
              : 'text-gray-300 hover:bg-gray-800'
          }`}
        >
          <span className="text-xl">{item.icon}</span>
          {!isCollapsed && <span>{item.name}</span>}
        </button>
      </li>
    );
  };

  return (
    <div
      className={`${
        isCollapsed ? 'w-20' : 'w-64'
      } bg-gray-900 text-white min-h-screen flex flex-col transition-all duration-300 max-h-screen`}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          {!isCollapsed && <h1 className="text-xl font-bold">Al Bayt Hospital</h1>}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 hover:bg-gray-800 rounded"
          >
            {isCollapsed ? '→' : '←'}
          </button>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-gray-700">
        <div
          className={`flex items-center ${
            isCollapsed ? 'justify-center' : 'space-x-3'
          }`}
        >
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
            {user?.fullName?.charAt(0) || 'U'}
          </div>
          {!isCollapsed && (
            <div>
              <p className="text-sm font-semibold">{user?.fullName}</p>
              <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
            </div>
          )}
        </div>
      </div>

      {/* Menu Items with Hidden Scrollbar */}
      <nav className="flex-1 p-4 overflow-y-auto scrollbar-hide">
        <style jsx>{`
          .scrollbar-hide {
            -ms-overflow-style: none;  /* IE and Edge */
            scrollbar-width: none;  /* Firefox */
          }
          .scrollbar-hide::-webkit-scrollbar {
            display: none;  /* Chrome, Safari and Opera */
          }
        `}</style>
        
        {menuItems.map((item, index) => {
          if (item.section) {
            const visibleItems = item.items.filter((subItem) =>
              hasPermission(subItem.permission)
            );

            if (visibleItems.length === 0) return null;

            return (
              <div key={index} className="mb-6">
                {!isCollapsed && (
                  <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2 px-2">
                    {item.section}
                  </h3>
                )}
                <ul className="space-y-1">{visibleItems.map(renderMenuItem)}</ul>
              </div>
            );
          }

          return (
            <ul key={index} className="space-y-1 mb-6">
              {renderMenuItem(item)}
            </ul>
          );
        })}
      </nav>

      {/* Permissions Badge */}
      {/* {!isCollapsed && (
        <div className="p-4 border-t border-gray-700">
          <div className="bg-gray-800 rounded-lg p-3">
            <p className="text-xs text-gray-400 mb-2">Quick Info</p>
            <div className="flex flex-wrap gap-1">
              <span className="text-xs bg-blue-900 text-blue-200 px-2 py-1 rounded">
                {user?.permissions?.length || 0} permissions
              </span>
              {user?.role === 'admin' && (
                <span className="text-xs bg-purple-900 text-purple-200 px-2 py-1 rounded">
                  Admin
                </span>
              )}
            </div>
          </div>
        </div>
      )} */}

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className={`w-full flex items-center ${
            isCollapsed ? 'justify-center' : 'space-x-3'
          } px-4 py-3 rounded-lg bg-red-600 hover:bg-red-700 transition-colors`}
        >
          <span className="text-xl">🚪</span>
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
}