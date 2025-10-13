'use client';

import { PERMISSIONS, getPermissionLabel } from '@/lib/permissions';

export default function PermissionSelector({ selectedPermissions, onChange, disabled }) {
  const handleToggle = (permission) => {
    if (disabled) return;
    
    const newPermissions = selectedPermissions.includes(permission)
      ? selectedPermissions.filter(p => p !== permission)
      : [...selectedPermissions, permission];
    
    onChange(newPermissions);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-gray-700 mb-3">
        Permissions
      </label>
      
      <div className="grid grid-cols-2 gap-3">
        {Object.values(PERMISSIONS).map((permission) => (
          <label
            key={permission}
            className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
              selectedPermissions.includes(permission) ? 'bg-blue-50 border-blue-500' : 'border-gray-300'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input
              type="checkbox"
              checked={selectedPermissions.includes(permission)}
              onChange={() => handleToggle(permission)}
              disabled={disabled}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">
              {getPermissionLabel(permission)}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

