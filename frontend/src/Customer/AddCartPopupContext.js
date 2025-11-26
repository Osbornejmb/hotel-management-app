import React, { createContext, useContext, useRef, useState, useCallback, useEffect } from 'react';

const AddCartPopupContext = createContext(null);

export const AddCartPopupProvider = ({ children }) => {
  const [popup, setPopup] = useState(null);
  const timerRef = useRef(null);

  const showAddCartPopup = useCallback((item) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setPopup(item);
    timerRef.current = setTimeout(() => {
      setPopup(null);
      timerRef.current = null;
    }, 3500);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  return (
    <AddCartPopupContext.Provider value={showAddCartPopup}>
      {children}
      {popup && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-4 bg-white border border-amber-200 rounded-xl shadow-lg p-3 max-w-sm">
          <img src={popup.img} alt={popup.name} className="w-16 h-12 object-cover rounded-md border" />
          <div className="flex-1">
            <div className="font-semibold text-amber-900">{popup.name}</div>
            <div className="text-sm text-gray-600">Qty: {popup.quantity || 1} • ₱{(Number(popup.price) || 0).toFixed(2)}</div>
            {popup.error && <div className="text-xs text-red-600 mt-1">Failed to add. Try again.</div>}
          </div>
          <div className="flex flex-col items-end gap-2">
            <button onClick={() => { const evt = new CustomEvent('openCart'); window.dispatchEvent(evt); }} className="px-3 py-1 bg-amber-600 text-white rounded-md text-sm">View Cart</button>
            <button onClick={() => setPopup(null)} className="px-3 py-1 bg-white border border-amber-200 text-amber-700 rounded-md text-sm">Continue</button>
          </div>
        </div>
      )}
    </AddCartPopupContext.Provider>
  );
};

export const useAddCartPopup = () => {
  const ctx = useContext(AddCartPopupContext);
  if (ctx === null) {
    throw new Error('useAddCartPopup must be used within AddCartPopupProvider');
  }
  return ctx;
};

export default AddCartPopupContext;
