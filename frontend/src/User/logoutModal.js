import React from "react";

const LogoutModal = ({ isOpen, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-xl shadow-lg p-6 w-[90%] max-w-sm text-center">
        <h2 className="text-2xl font-bold text-brown-700 mb-2">Log out</h2>
        <p className="text-brown-500 mb-6">Are you sure you want to log out?</p>

        <div className="flex justify-center gap-4">
          <button
            onClick={onConfirm}
            className="bg-[#4B2E1E] text-white px-6 py-2 rounded-md font-semibold hover:bg-[#3a2316] transition"
          >
            LOGOUT
          </button>
          <button
            onClick={onCancel}
            className="border border-[#4B2E1E] text-[#4B2E1E] bg-[#F9F6F2] px-6 py-2 rounded-md font-semibold hover:bg-[#f0eae4] transition"
          >
            CANCEL
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoutModal;
