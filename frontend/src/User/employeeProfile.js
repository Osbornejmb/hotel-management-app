import React, { useState, useEffect } from 'react';

const EmployeeProfile = () => {
  const [employeeData, setEmployeeData] = useState(null);
  const [credentials, setCredentials] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' or 'credentials'

  useEffect(() => {
    fetchEmployeeData();
  }, []);

  const fetchEmployeeData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to view your profile');
        setLoading(false);
        return;
      }

      // Fetch employee profile
          const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:5000';
          const profileResponse = await fetch(`${apiBase}/api/employee/my-profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!profileResponse.ok) {
        throw new Error('Failed to fetch profile data');
      }

      const profileData = await profileResponse.json();
      setEmployeeData(profileData);

      // Fetch employee credentials
      const credentialsResponse = await fetch(`${apiBase}/api/employee/my-credentials`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (credentialsResponse.ok) {
        const credentialsData = await credentialsResponse.json();
        setCredentials(credentialsData);
      }

    } catch (err) {
      setError(err.message);
      console.error('Error fetching employee data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const currentPassword = formData.get('currentPassword');
    const newPassword = formData.get('newPassword');
    const confirmPassword = formData.get('confirmPassword');

    if (newPassword !== confirmPassword) {
      alert('New passwords do not match');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiBase}/api/employee/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const result = await response.json();

      if (response.ok) {
        alert('Password changed successfully!');
        e.target.reset();
      } else {
        alert(result.error || 'Failed to change password');
      }
    } catch (err) {
      alert('Error changing password');
      console.error('Password change error:', err);
    }
  };

  const requestPasswordReset = async () => {
    if (!employeeData?.email) return;

    try {
      const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiBase}/api/employee/reset-password-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: employeeData.email })
      });

      const result = await response.json();

      if (response.ok) {
        alert(result.message || 'Password reset instructions sent to your email');
      } else {
        alert(result.error || 'Failed to request password reset');
      }
    } catch (err) {
      alert('Error requesting password reset');
      console.error('Password reset error:', err);
    }
  };

  if (loading) {
    return (
      <div className="p-4 flex justify-center items-center h-64">
        <div className="text-gray-600">Loading your profile...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800 font-medium">Error</div>
          <div className="text-red-600">{error}</div>
          <button 
            onClick={fetchEmployeeData}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!employeeData) {
    return (
      <div className="p-4">
        <div className="text-gray-600">No employee data found.</div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">My Profile</h1>
      
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === 'profile'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('profile')}
        >
          Profile Information
        </button>
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === 'credentials'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('credentials')}
        >
          Login Credentials
        </button>
      </div>

      {/* Profile Picture */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 mb-6 flex justify-center">
        <div className="w-32 h-32 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-3xl">
          {employeeData.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
        </div>
      </div>

      {activeTab === 'profile' && (
        <>
          {/* Personal Information */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">Personal Information</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-500">Full Name</div>
                  <div className="font-medium">{employeeData.name || 'Not provided'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Phone</div>
                  <div className="font-medium">{employeeData.contactNumber || employeeData.phone || 'Not provided'}</div>
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Email</div>
                <div className="font-medium">{employeeData.email || 'Not provided'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Address</div>
                <div className="font-medium">{employeeData.address || employeeData.notes || 'Not provided'}</div>
              </div>
            </div>
          </div>

          {/* Employment Information */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-4">Employment Information</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-500">Position</div>
                  <div className="font-medium">{employeeData.position || employeeData.jobTitle || 'Not provided'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Department</div>
                  <div className="font-medium">{employeeData.department || 'Not provided'}</div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-500">Employee ID</div>
                  <div className="font-medium">{employeeData.employeeId || 'Not provided'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Join Date</div>
                  <div className="font-medium">
                    {employeeData.dateHired ? new Date(employeeData.dateHired).toLocaleDateString() : 
                     employeeData.joinDate || 'Not provided'}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-500">Role</div>
                  <div className="font-medium capitalize">{employeeData.role || 'employee'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Status</div>
                  <div className="font-medium capitalize">{employeeData.status || 'active'}</div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'credentials' && (
        <div className="space-y-6">
          {/* Login Credentials */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-4">Login Credentials</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-500">Username</div>
                  <div className="font-medium">{credentials?.username || employeeData.username || 'Not set'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Employee ID</div>
                  <div className="font-medium">{credentials?.employeeId || employeeData.employeeId || 'Not set'}</div>
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Email</div>
                <div className="font-medium">{credentials?.email || employeeData.email || 'Not set'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Login URL</div>
                <div className="font-medium">
                  <a href={credentials?.loginUrl} className="text-blue-600 hover:text-blue-800">
                    {credentials?.loginUrl || (process.env.REACT_APP_API_URL || 'http://localhost:5000')}
                  </a>
                </div>
              </div>
              {credentials?.message && (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                  <div className="text-yellow-800 text-sm">{credentials.message}</div>
                </div>
              )}
            </div>
          </div>

          {/* Password Reset */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-4">Password Management</h3>
            
            {/* Change Password Form */}
            <form onSubmit={handlePasswordChange} className="space-y-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Current Password</label>
                  <input
                    type="password"
                    name="currentPassword"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">New Password</label>
                  <input
                    type="password"
                    name="newPassword"
                    required
                    minLength="6"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  minLength="6"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Change Password
              </button>
            </form>

            {/* Forgot Password */}
            <div className="border-t pt-4">
              <button
                onClick={requestPasswordReset}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Forgot Password? Request Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeProfile;