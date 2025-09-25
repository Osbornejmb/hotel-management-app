import React, { useState } from 'react';

const EmployeePayroll = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('January 2024');

  const payrollData = [
    {
      id: 1,
      period: 'January 2024',
      totalHours: '160',
      grossPay: '$4,800.00',
      overtime: '$600.00',
      deductions: '$980.50',
      netPay: '$4,419.50',
      paymentDate: '2024-02-01',
      status: 'Paid'
    },
    {
      id: 2,
      period: 'December 2023',
      totalHours: '152',
      grossPay: '$4,560.00',
      overtime: '$450.00',
      deductions: '$920.25',
      netPay: '$4,089.75',
      paymentDate: '2024-01-01',
      status: 'Paid'
    }
  ];

  const currentPayroll = payrollData.find(item => item.period === selectedPeriod) || payrollData[0];

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

      <div className="mt-6 flex">
        <button className="flex-1 bg-green-500 text-white px-4 py-3 rounded-lg font-medium hover:bg-green-600 transition-colors">
          📥 Download Payslip
        </button>
      </div>
    </div>
  );
};

export default EmployeePayroll;
