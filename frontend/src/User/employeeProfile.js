import React, { useState } from 'react';

const EmployeeProfile = () => {
  const [userData] = useState({
    name: 'This is static',
    email: 'thisisstatic@gmail.com',
    phone: '091111111111111',
    position: 'Cleaner',
    department: 'Engineering',
    employeeId: 'EMP-2024-001',
    joinDate: '2023-01-15',
    address: 'Tindahan ni Aling Puring'
  });

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Profile</h1>
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 mb-6 flex justify-center">
        <div className="w-32 h-32 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-3xl">
          {userData.name.split(' ').map(n => n[0]).join('')}
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Personal Information</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><div className="text-xs text-gray-500">Full Name</div><div className="font-medium">{userData.name}</div></div>
            <div><div className="text-xs text-gray-500">Phone</div><div className="font-medium">{userData.phone}</div></div>
          </div>
          <div><div className="text-xs text-gray-500">Email</div><div className="font-medium">{userData.email}</div></div>
          <div><div className="text-xs text-gray-500">Address</div><div className="font-medium">{userData.address}</div></div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-900 mb-4">Employment Information</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><div className="text-xs text-gray-500">Position</div><div className="font-medium">{userData.position}</div></div>
            <div><div className="text-xs text-gray-500">Department</div><div className="font-medium">{userData.department}</div></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><div className="text-xs text-gray-500">Employee ID</div><div className="font-medium">{userData.employeeId}</div></div>
            <div><div className="text-xs text-gray-500">Join Date</div><div className="font-medium">{userData.joinDate}</div></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeProfile;
