import React from 'react';
import './OrderConfirmationModal.css';

/**
 * OrderConfirmationModal Component
 * 
 * Displays order summary and total before final checkout confirmation.
 * Shows all items in cart with quantities and prices.
 * 
 * Props:
 *   isOpen: boolean - whether modal is visible
 *   items: array - cart items with name, price, quantity, category
 *   onConfirm: function() - callback when customer confirms order
 *   onCancel: function() - callback when customer cancels
 *   isLoading: boolean - whether order is being processed
 */
function OrderConfirmationModal({ 
  isOpen, 
  items = [], 
  onConfirm, 
  onCancel,
  isLoading = false 
}) {
  if (!isOpen) return null;

  // Calculate totals (no tax)
  const subtotal = items.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);
  const total = subtotal; // tax removed per request

  return (
    <div className="order-confirmation-overlay">
      <div className="order-confirmation-modal">
        {/* Header */}
        <div className="confirmation-header">
          <h2 className="confirmation-heading">Confirm Your Order</h2>
          <p className="confirmation-message">Review your order before checkout</p>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="confirmation-loading">
            <div className="spinner"></div>
            <p>Processing your order...</p>
          </div>
        ) : (
          <>
            {/* Items List */}
            <div className="confirmation-items-container">
              {items.length > 0 ? (
                <div className="confirmation-items-list">
                  {items.map((item, idx) => {
                    const itemTotal = (item.price || 0) * (item.quantity || 1);
                    return (
                      <div key={idx} className="confirmation-item">
                        <div className="confirmation-item-image">
                          {item.img ? (
                            <img 
                              src={item.img} 
                              alt={item.name}
                              onError={(e) => {
                                e.target.src = 'https://via.placeholder.com/80?text=No+Image';
                              }}
                            />
                          ) : (
                            <div className="confirmation-item-placeholder">
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m0 0h6m-6-6h-6" />
                              </svg>
                            </div>
                          )}
                        </div>

                        <div className="confirmation-item-details">
                          <h4 className="confirmation-item-name">{item.name}</h4>
                          <p className="confirmation-item-category">{item.category}</p>
                          <div className="confirmation-item-qty">Qty: {item.quantity || 1}</div>
                        </div>

                        <div className="confirmation-item-price">
                          <div className="confirmation-item-unit">₱{(item.price || 0).toFixed(2)}</div>
                          <div className="confirmation-item-total">₱{itemTotal.toFixed(2)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="confirmation-no-items">
                  <p>No items in your order.</p>
                </div>
              )}
            </div>

            {/* Summary Section */}
            <div className="confirmation-summary">
              <div className="confirmation-summary-row">
                <span className="summary-label">Total:</span>
                <span className="summary-value">₱{total.toFixed(2)}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="confirmation-actions">
              <button
                className="confirmation-button confirmation-button-confirm"
                onClick={onConfirm}
                disabled={isLoading}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>Confirm Order</span>
              </button>

              <button
                className="confirmation-button confirmation-button-cancel"
                onClick={onCancel}
                disabled={isLoading}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
                <span>Back to Cart</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default OrderConfirmationModal;
