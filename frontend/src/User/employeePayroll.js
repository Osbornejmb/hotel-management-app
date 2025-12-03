import React, { useState, useEffect } from 'react';

const EmployeePayroll = () => {
  const [payrollData, setPayrollData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('');

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://hotel-management-app-qo2l.onrender.com';

  const getEmployeeFromToken = () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return { employeeId: payload.employeeId };
      }
    } catch (error) {
      console.error('Error decoding token:', error);
    }
    return { employeeId: '' };
  };

  useEffect(() => {
    const fetchPayrollData = async () => {
      try {
        setLoading(true);
        const employee = getEmployeeFromToken();
        if (!employee.employeeId) {
          throw new Error('Employee ID not found in token.');
        }

        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/api/attendance/${employee.employeeId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        // Handle both 404 (no records) and other errors
        if (!response.ok) {
          if (response.status === 404) {
            // No attendance records for this employee yet
            setPayrollData([]);
            setError(null);
            return;
          }
          throw new Error('Failed to fetch attendance data');
        }

        const attendanceData = await response.json();
        
        // Handle empty data
        if (!Array.isArray(attendanceData) || attendanceData.length === 0) {
          setPayrollData([]);
          setError(null);
          return;
        }
        
        // Process attendance into payroll periods
        const processedPayroll = attendanceData.reduce((acc, entry) => {
          // Use clockIn date if available, fallback to date field
          const entryDate = entry.clockIn ? new Date(entry.clockIn) : new Date(entry.date);
          const period = entryDate.toLocaleString('default', { month: 'long', year: 'numeric' });
          
          if (!acc[period]) {
            acc[period] = {
              id: period,
              period: period,
              totalHours: 0,
              grossPay: 0,
              deductions: 0,
              netPay: 0,
              paymentDate: 'N/A',
              status: 'Processed'
            };
          }
          acc[period].totalHours += entry.totalHours || 0;
          return acc;
        }, {});

        const payrollArray = Object.values(processedPayroll).map(periodData => {
          // Calculate monetary values based on hours
          // NOTE: Using standard rate of $30/hr - can be updated with employee-specific rates
          const HOURLY_RATE = 30;
          const DEDUCTION_RATE = 0.15; // 15% for taxes, benefits, etc.
          
          const grossPay = periodData.totalHours * HOURLY_RATE;
          const deductions = grossPay * DEDUCTION_RATE;
          const netPay = grossPay - deductions;

          return {
            ...periodData,
            totalHours: periodData.totalHours.toFixed(2),
            grossPay: `$${grossPay.toFixed(2)}`,
            overtime: `$0.00`, // Overtime calculation requires employee-specific rates
            deductions: `$${deductions.toFixed(2)}`,
            netPay: `$${netPay.toFixed(2)}`,
          };
        });

        setPayrollData(payrollArray);
        if (payrollArray.length > 0) {
          setSelectedPeriod(payrollArray[0].period);
        }
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

  const currentPayroll = payrollData.find(item => item.period === selectedPeriod) || payrollData[0];

  if (loading) {
    return <div className="p-4">Loading payroll data...</div>;
  }

  if (error) {
    return <div className="p-4">Error: {error}</div>;
  }

  if (payrollData.length === 0) {
    return <div className="p-4 text-center">No Data Yet</div>;
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Payroll</h1>
        <select 
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          {payrollData.map(item => (
            <option key={item.period} value={item.period}>{item.period}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">Current Period Summary</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <div><div className="text-xs text-gray-500">Period</div><div className="font-medium">{currentPayroll.period}</div></div>
            <div><div className="text-xs text-gray-500">Total Hours</div><div className="font-medium">{currentPayroll.totalHours}</div></div>
            <div><div className="text-xs text-gray-500">Gross Pay</div><div className="font-medium text-green-600">{currentPayroll.grossPay}</div></div>
            <div><div className="text-xs text-gray-500">Overtime</div><div className="font-medium">{currentPayroll.overtime}</div></div>
          </div>
          <div className="space-y-3">
            <div><div className="text-xs text-gray-500">Deductions</div><div className="font-medium text-red-600">{currentPayroll.deductions}</div></div>
            <div><div className="text-xs text-gray-500">Net Pay</div><div className="font-bold text-lg text-blue-600">{currentPayroll.netPay}</div></div>
            <div><div className="text-xs text-gray-500">Payment Date</div><div className="font-medium">{currentPayroll.paymentDate}</div></div>
            <div><div className="text-xs text-gray-500">Status</div><span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">{currentPayroll.status}</span></div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="font-semibold text-gray-900 mb-4">Payroll History</h2>
        <div className="space-y-3">
          {payrollData.map(item => (
            <div 
              key={item.id} 
              className={`bg-white rounded-lg p-4 shadow-sm border cursor-pointer transition-colors ${
                item.period === selectedPeriod ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:border-gray-300'
              }`}
              onClick={() => setSelectedPeriod(item.period)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">{item.period}</div>
                  <div className="text-sm text-gray-500">{item.totalHours} hours</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">{item.netPay}</div>
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">{item.status}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EmployeePayroll;