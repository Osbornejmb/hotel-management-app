import React, { useState, useEffect } from 'react';

const EmployeePayroll = () => {
  const [payrollData, setPayrollData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [employeeInfo, setEmployeeInfo] = useState({ name: '', employeeId: '' });

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://hotel-management-app-qo2l.onrender.com';

  const getEmployeeFromToken = () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return { 
          cardId: payload.cardId || '',
          name: payload.name || '',
          id: payload.id || ''
        };
      }
    } catch (error) {
      console.error('Error decoding token:', error);
    }
    return { cardId: '', name: '', id: '' };
  };

  useEffect(() => {
    const fetchPayrollData = async () => {
      try {
        setLoading(true);
        const employee = getEmployeeFromToken();
        setEmployeeInfo(employee);
        
        if (!employee.cardId) {
          throw new Error('Card ID not found in token.');
        }

        const token = localStorage.getItem('token');
        
        // Fetch attendance data for current employee
        const response = await fetch(`${API_BASE_URL}/api/attendance?cardId=${employee.cardId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 404) {
            setPayrollData([]);
            setError(null);
            return;
          }
          throw new Error('Failed to fetch attendance data');
        }

        const attendanceData = await response.json();
        
        if (!Array.isArray(attendanceData) || attendanceData.length === 0) {
          setPayrollData([]);
          setError(null);
          return;
        }
        
        // Group attendance by month/period and calculate payroll
        const payrollByPeriod = {};
        const HOURLY_RATE = 95; // PHP per hour
        const TAX_RATE = 0.10; // 10% tax/deductions
        
        attendanceData.forEach(record => {
          // Get the month-year as period
          const recordDate = record.clockIn ? new Date(record.clockIn) : new Date(record.date);
          const period = recordDate.toLocaleString('default', { month: 'long', year: 'numeric' });
          
          if (!payrollByPeriod[period]) {
            payrollByPeriod[period] = {
              period: period,
              totalHours: 0,
              recordCount: 0
            };
          }
          
          payrollByPeriod[period].totalHours += record.totalHours || 0;
          payrollByPeriod[period].recordCount += 1;
        });
        
        // Calculate payroll amounts for each period
        const formattedPayroll = Object.values(payrollByPeriod).map(record => {
          const totalHours = parseFloat(record.totalHours).toFixed(2);
          const grossPay = totalHours * HOURLY_RATE;
          const deductions = grossPay * TAX_RATE;
          const netPay = grossPay - deductions;
          
          return {
            id: record.period,
            period: record.period,
            totalHours: totalHours,
            hourlyRate: `₱${HOURLY_RATE.toFixed(2)}`,
            grossPay: `₱${grossPay.toFixed(2)}`,
            deductions: `₱${deductions.toFixed(2)}`,
            netPay: `₱${netPay.toFixed(2)}`,
            status: 'Processed',
            paymentDate: 'N/A',
            recordCount: record.recordCount
          };
        }).sort((a, b) => {
          // Sort by period (most recent first)
          return new Date(b.period) - new Date(a.period);
        });

        setPayrollData(formattedPayroll);
        setError(null);

      } catch (err) {
        console.error('Error fetching payroll data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPayrollData();
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">Loading payroll data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-red-800 font-semibold mb-2">Error</h3>
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Payroll</h1>
          {employeeInfo.name && (
            <p className="text-gray-600 mt-1">Employee: {employeeInfo.name}</p>
          )}
        </div>

        {payrollData.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center border border-gray-200 shadow-sm">
            <div className="text-gray-500 text-lg">No payroll records found</div>
            <p className="text-gray-400 mt-2">Your payroll history will appear here</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Period</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Total Hours</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Hourly Rate</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Gross Pay</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Deductions</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Net Pay</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Payment Date</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {payrollData.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{record.period}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{record.totalHours} hrs</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{record.hourlyRate}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-green-600">{record.grossPay}</td>
                      <td className="px-6 py-4 text-sm text-red-600">{record.deductions}</td>
                      <td className="px-6 py-4 text-sm font-bold text-blue-600">{record.netPay}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{record.paymentDate}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          record.status === 'Paid' 
                            ? 'bg-green-100 text-green-800'
                            : record.status === 'Pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {record.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};