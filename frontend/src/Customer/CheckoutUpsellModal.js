import React, { useState } from 'react';
import './CheckoutUpsellModal.css';

/**
 * CheckoutUpsellModal Component
 * 
 * Displays a modal popup during checkout that suggests additional items
 * (drinks/desserts) based on what's currently in the cart.
 * 
 * Props:
 *   isOpen: boolean - whether modal is visible
 *   upsellData: object - contains upsellHeading, upsellMessage, and recommendations array
 *   onAddToCart: function(item, quantity) - callback when customer adds an item
 *   onContinueCheckout: function() - callback when customer clicks "No Thanks, Continue"
 *   isLoading: boolean - whether recommendations are being fetched
 */
function CheckoutUpsellModal({ 
  isOpen, 
  upsellData = {}, 
  onAddToCart, 
  onContinueCheckout,
  isLoading = false 
}) {
  // Track quantity for each recommendation item
  const [quantities, setQuantities] = useState({});

  if (!isOpen) return null;

  // Helper function to get quantity for an item
  const getQuantity = (itemId) => quantities[itemId] || 1;

  // Helper function to update quantity
  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    setQuantities(prev => ({
      ...prev,
      [itemId]: newQuantity
    }));
  };

  const {
    upsellHeading = 'You Might Have Forgotten Something!',
    upsellMessage = 'Complete your order',
    recommendations = []
  } = upsellData;

  return (
    <div className="checkout-upsell-overlay">
      <div className="checkout-upsell-modal">
        {/* Close Button */}
        <button 
          className="upsell-close-button"
          onClick={onContinueCheckout}
          title="Close modal"
          aria-label="Close"
        >
          ×
        </button>

        {/* Loading State */}
        {isLoading ? (
          <div className="upsell-loading">
            <div className="spinner"></div>
            <p>Loading recommendations...</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="upsell-header">
              <h2 className="upsell-heading">{upsellHeading}</h2>
              <p className="upsell-message">{upsellMessage}</p>
            </div>

            {/* Recommendations */}
            {recommendations && recommendations.length > 0 ? (
              <div className="upsell-items-container">
                {recommendations.map((item) => {
                  const quantity = getQuantity(item._id);
                  const itemTotal = (item.price || 0) * quantity;

                  return (
                    <div key={item._id} className="upsell-item-card">
                      {/* Item Image */}
                      <div className="upsell-item-image">
                        {item.img ? (
                          <img 
                            src={item.img} 
                            alt={item.name}
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/150?text=No+Image';
                            }}
                          />
                        ) : (
                          <div className="upsell-item-placeholder">
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Item Details */}
                      <div className="upsell-item-details">
                        <h3 className="upsell-item-name">{item.name}</h3>
                        <p className="upsell-item-category">{item.category}</p>
                        <div className="upsell-item-price">₱{(item.price || 0).toFixed(2)}</div>
                        <div className="upsell-item-total">Total: ₱{itemTotal.toFixed(2)}</div>
                      </div>

                      {/* Quantity Controls */}
                      <div className="upsell-quantity-control">
                        <button
                          className="upsell-qty-btn"
                          onClick={() => updateQuantity(item._id, quantity - 1)}
                          title="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="upsell-qty-display">{quantity}</span>
                        <button
                          className="upsell-qty-btn"
                          onClick={() => updateQuantity(item._id, quantity + 1)}
                          title="Increase quantity"
                        >
                          +
                        </button>
                      </div>

                      {/* Add Button */}
                      <button
                        className="upsell-add-button"
                        onClick={() => onAddToCart(item, quantity)}
                        title={`Add ${quantity}x ${item.name} to order`}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="12" y1="5" x2="12" y2="19"></line>
                          <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        <span>Add</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="upsell-no-items">
                <p>No recommendations available at this time.</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="upsell-actions">
              <button
                className="upsell-button upsell-button-primary"
                onClick={onContinueCheckout}
              >
                No Thanks, Continue Checkout
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default CheckoutUpsellModal;
