import React, { createContext, useContext, useState } from 'react';

const CheckoutPopupContext = createContext(null);

export const CheckoutPopupProvider = ({ children }) => {
  const [popup, setPopup] = useState(null);

  const showCheckoutPopup = (payload = {}) => {
    setPopup({ ...payload, open: true });
  };

  const close = () => setPopup(null);

  return (
    <CheckoutPopupContext.Provider value={showCheckoutPopup}>
      {children}

      {popup && popup.open && (
        <div className="fixed inset-0 z-60 flex items-center justify-center">
          <div className="absolute inset-0 bg-black bg-opacity-40" onClick={close} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 mx-4 border border-amber-200 z-70">
            <div className={`w-full rounded-lg p-4 mb-4 ${popup.success ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">
                    {popup.success ? '✅' : '❌'}
                  </div>
                  <div>
                    <div className="font-semibold text-lg text-amber-900">{popup.success ? 'Checkout Successful' : 'Checkout Failed'}</div>
                    {popup.orderId && <div className="text-sm text-gray-600">Order #{String(popup.orderId).slice(-8)}</div>}
                  </div>
                </div>
                <button onClick={close} className="text-gray-500 hover:text-gray-700">×</button>
              </div>
            </div>

            <div className="mb-4 text-center text-amber-800">
              {popup.message || (popup.success ? 'Your order has been sent to the restaurant.' : 'Please try again.')}
            </div>

            <div className="flex justify-center gap-4 mt-3">
              <button
                onClick={() => {
                  // Dispatch a global event for opening order status in the main interface
                  const evt = new CustomEvent('openOrderStatus');
                  window.dispatchEvent(evt);
                  close();
                }}
                className="px-5 py-2 rounded-xl bg-amber-600 text-white font-semibold"
              >
                View Orders
              </button>

              <button onClick={close} className="px-5 py-2 rounded-xl border border-amber-300 bg-white text-amber-700 font-semibold">Close</button>
            </div>
          </div>
        </div>
      )}
    </CheckoutPopupContext.Provider>
  );
};

export const useCheckoutPopup = () => {
  const ctx = useContext(CheckoutPopupContext);
  if (ctx === null) throw new Error('useCheckoutPopup must be used within CheckoutPopupProvider');
  return ctx;
};

export default CheckoutPopupContext;
