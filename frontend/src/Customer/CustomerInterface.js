import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function CustomerInterface() {
	const navigate = useNavigate();
	const [hovered, setHovered] = useState([false, false, false]);

	// Restore handleNavigate for card navigation
	const handleNavigate = (path) => {
		navigate(path);
	};

	// Removed unused orders state
	const [showPopup, setShowPopup] = useState(false);
	const [notifications, setNotifications] = useState([]); // delivered orders for popup
	const [counter, setCounter] = useState(0); // delivered order count
	const [viewedOrderIds, setViewedOrderIds] = useState(() => {
		const stored = localStorage.getItem('viewedOrderIds');
		return stored ? JSON.parse(stored) : [];
	});

	// Get current room number from localStorage (match FoodAndBeverages.js)
	const roomNumber = localStorage.getItem('customerRoomNumber');


	// Poll backend for orders every 5 seconds (like FoodAndBeverages)
	useEffect(() => {
		let interval;
		const fetchOrders = async () => {
			try {
				const res = await fetch(`${process.env.REACT_APP_API_URL}/api/cart/orders/all`);
				if (!res.ok) return;
				const allOrders = await res.json();
				const filtered = allOrders.filter(order => String(order.roomNumber) === String(roomNumber));
				// Only show delivered orders not in viewedOrderIds
				const newNotifications = filtered.filter(order => order.status === 'delivered' && !viewedOrderIds.includes(order._id));
				setNotifications(newNotifications);
				setCounter(newNotifications.length);
			} catch (e) {
				// ignore errors
			}
		};
		fetchOrders();
		interval = setInterval(fetchOrders, 5000);
		return () => {
			if (interval) clearInterval(interval);
		};
	}, [roomNumber, viewedOrderIds]);


	// Handle bell click - toggle popup
	const handleBellClick = () => {
		setShowPopup(prev => !prev);
	};

	// Handle removing individual notification
	const handleRemoveNotification = (orderId) => {
		setViewedOrderIds(prev => {
			const updated = [...prev, orderId];
			localStorage.setItem('viewedOrderIds', JSON.stringify(updated));
			return updated;
		});
		// Remove the notification from local state immediately
		setNotifications(prev => prev.filter(order => order._id !== orderId));
		setCounter(prev => prev - 1);
	};

	// Close popup when clicking outside
	useEffect(() => {
		const handleClickOutside = (event) => {
			// If popup is open and click is outside the popup and not on the bell
			if (showPopup) {
				const popup = document.querySelector('.notification-popup');
				const bell = document.querySelector('.notification-bell');
				
				if (popup && bell && 
					!popup.contains(event.target) && 
					!bell.contains(event.target)) {
					setShowPopup(false);
				}
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [showPopup]);

	// Persist viewedOrderIds to localStorage whenever it changes
	useEffect(() => {
		localStorage.setItem('viewedOrderIds', JSON.stringify(viewedOrderIds));
	}, [viewedOrderIds]);

	// Header style 
	const headerStyle = {
		width: '100%',
		background: '#4B2E06',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between',
		padding: '0.5rem 2.5rem',
		boxSizing: 'border-box',
		minHeight: 64,
		boxShadow: '0 2px 8px #0001',
		position: 'sticky',
		top: 0,
		zIndex: 100,
	};
	const logoutBtnStyle = {
		background: '#F7D774',
		color: '#4B2E06',
		border: 'none',
		borderRadius: '0.35em',
		fontSize: '1.08rem',
		fontFamily: 'inherit',
		fontWeight: 500,
		padding: '0.45em 1.5em',
		boxShadow: '0 2px 8px #e5c16c44',
		cursor: 'pointer',
		transition: 'background 0.2s, color 0.2s',
		outline: 'none',
		marginLeft: 24,
	};
	const bellStyle = {
		position: 'relative',
		background: 'none',
		border: 'none',
		cursor: 'pointer',
		marginLeft: 24,
		marginRight: 8,
		outline: 'none',
		padding: 0,
		display: 'flex',
		alignItems: 'center',
	};
	const bellIconStyle = {
		fontSize: 28,
		color: '#F7D700',
		transition: 'color 0.2s',
	};
	const bellCounterStyle = {
		position: 'absolute',
		top: -6,
		right: -6,
		background: '#e74c3c',
		color: '#fff',
		borderRadius: '50%',
		fontSize: 13,
		fontWeight: 700,
		minWidth: 22,
		height: 22,
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		boxShadow: '0 2px 8px #e74c3c44',
		zIndex: 2,
	};
	const popupStyle = {
		position: 'absolute',
		top: 60,
		right: 32,
		background: '#fff',
		borderRadius: '1em',
		boxShadow: '0 4px 24px #0002',
		padding: '1.2em 1.5em',
		minWidth: 320,
		maxWidth: 400,
		zIndex: 999,
	};
	const removeBtnStyle = {
		background: '#ff6b6b',
		color: '#fff',
		border: 'none',
		borderRadius: '50%',
		width: '20px',
		height: '20px',
		fontSize: '12px',
		fontWeight: 'bold',
		cursor: 'pointer',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		marginLeft: '8px',
		flexShrink: 0,
	};
	const handleLogout = () => {
		localStorage.clear();
		navigate('/customer/login', { replace: true });
	};
	const logoStyle = {
		height: 40,
		width: 40,
		marginRight: 12,
		objectFit: 'contain',
		background: 'transparent',
		borderRadius: 0,
		boxShadow: 'none',
	};
	const appNameStyle = {
		fontSize: 32,
		fontWeight: 400,
		color: '#fff',
		fontFamily: 'serif',
		letterSpacing: 1,
		textShadow: '0 1px 4px #0006',
	};

	return (
		<div style={{ background: '#fff', minHeight: '100vh', padding: 0, margin: 0 }}>
			{/* Header with logo and app name */}
			<div style={headerStyle}>
				<div style={{ display: 'flex', alignItems: 'center' }}>
					<img src={process.env.PUBLIC_URL + '/logo192.png'} alt="Lumine Logo" style={logoStyle} />
					<span style={appNameStyle}>Lumine</span>
				</div>
				<div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
					{/* Notification Bell */}
					<button 
						className="notification-bell"
						style={{...bellStyle, ...(showPopup ? { background: '#F7D700', borderRadius: '50%', padding: '4px' } : {})}} 
						onClick={handleBellClick} 
						aria-label="Notifications"
					>
						{/* Simple bell SVG */}
						<span style={{...bellIconStyle, ...(showPopup ? { color: '#4B2E06' } : {})}}>
							<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
								<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"></path>
								<path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
							</svg>
						</span>
						{/* Show counter for new delivered orders */}
						{counter > 0 && <span style={bellCounterStyle}>{counter}</span>}
					</button>
					<button style={logoutBtnStyle} onClick={handleLogout} onMouseOver={e => { e.target.style.background = '#ffe9a7'; }} onMouseOut={e => { e.target.style.background = '#F7D774'; }}>
						Log Out
					</button>
					{/* Notification Popup */}
					{showPopup && (
						<div className="notification-popup" style={popupStyle}>
							<div style={{ fontWeight: 600, fontSize: 18, marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
								<span>Delivered Items</span>
								{counter > 0 && (
									<span style={{ fontSize: 14, color: '#666', fontWeight: 400 }}>
										{counter} new notification{counter !== 1 ? 's' : ''}
									</span>
								)}
							</div>
							{notifications.length === 0 ? (
								<div style={{ color: '#888', fontSize: 15 }}>No new delivered items.</div>
							) : (
								<div style={{ maxHeight: '300px', overflowY: 'auto' }}>
									{notifications.map((order, idx) => (
										<div key={order._id} style={{ 
											border: '1px solid #f0f0f0', 
											borderRadius: '8px', 
											padding: '10px', 
											marginBottom: '10px',
											background: '#f9f9f9'
										}}>
											<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
												<div style={{ fontWeight: 500, fontSize: '14px' }}>
													Order #{order._id.slice(-6)}
												</div>
												<button 
													style={removeBtnStyle}
													onClick={() => handleRemoveNotification(order._id)}
													title="Remove notification"
												>
													×
												</button>
											</div>
											<ul style={{ paddingLeft: 18, margin: 0 }}>
												{order.items && order.items.length > 0 ? order.items.map((item, i) => (
													<li key={item.name + i} style={{ marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
														<span>
															{item.name} (x{item.quantity || 1})
														</span>
														<span style={{ fontWeight: 500, marginLeft: '1rem' }}>
															₱{((item.price || 0) * (item.quantity || 1)).toFixed(2)}
														</span>
													</li>
												)) : (
													<li style={{ marginBottom: 6 }}>
														Item delivered
													</li>
												)}
											</ul>
											<div style={{ borderTop: '1px solid #e0e0e0', paddingTop: '6px', marginTop: '6px', fontWeight: 600, display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
												<span>Order Total:</span>
												<span>
													₱{order.items.reduce((total, item) => 
														total + ((item.price || 0) * (item.quantity || 1)), 0).toFixed(2)
													}
												</span>
											</div>
										</div>
									))}
								</div>
							)}
						</div>
					)}
				</div>
			</div>
			{/* ...existing code... */}
			<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', minHeight: '80vh', marginTop: '3.5rem' }}>
				<div style={{ display: 'flex', gap: '32px' }}>
					{/* Facilities Card */}
					<div
						style={{
							background: '#e7c552',
							borderRadius: '1.2rem',
							boxShadow: hovered[0] ? '0 12px 24px #e5c16c99' : '0 6px 12px #e5c16c55',
							width: 320,
							height: 320,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							cursor: 'pointer',
							border: 'none',
							position: 'relative',
							transform: hovered[0] ? 'translateY(-8px) scale(1.03)' : 'none',
							transition: 'box-shadow 0.2s, transform 0.2s',
						}}
						onClick={() => handleNavigate('/customer/facilities')}
						onMouseEnter={() => setHovered([true, false, false])}
						onMouseLeave={() => setHovered([false, false, false])}
					>
						<div style={{
							background: '#fff',
							borderRadius: '2rem',
							boxShadow: '0 2px 8px #bbb',
							width: 240,
							height: 240,
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							justifyContent: 'center',
							position: 'relative',
						}}>
							<img src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80" alt="Facilities" style={{ width: 140, height: 100, objectFit: 'cover', borderRadius: '0.5rem', marginBottom: 16 }} />
							<div style={{ fontSize: 28, color: '#222', fontWeight: 400, fontFamily: 'serif', marginTop: 12 }}>Facilities</div>
						</div>
					</div>
					{/* ...existing code... */}
					<div
						style={{
							background: '#ffdc85',
							borderRadius: '1.2rem',
							boxShadow: hovered[1] ? '0 12px 24px #e5c16c99' : '0 6px 12px #e5c16c55',
							width: 320,
							height: 320,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							cursor: 'pointer',
							border: 'none',
							position: 'relative',
							transform: hovered[1] ? 'translateY(-8px) scale(1.03)' : 'none',
							transition: 'box-shadow 0.2s, transform 0.2s',
						}}
						onClick={() => handleNavigate('/customer/food')}
						onMouseEnter={() => setHovered([false, true, false])}
						onMouseLeave={() => setHovered([false, false, false])}
					>
						<div style={{
							background: '#fff',
							borderRadius: '2rem',
							boxShadow: '0 2px 8px #bbb',
							width: 240,
							height: 240,
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							justifyContent: 'center',
							position: 'relative',
						}}>
							<img src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80" alt="Food and Beverages" style={{ width: 140, height: 100, objectFit: 'cover', borderRadius: '0.5rem', marginBottom: 16 }} />
							<div style={{ fontSize: 28, color: '#222', fontWeight: 400, fontFamily: 'serif', marginTop: 12 }}>Food & Beverage</div>
						</div>
					</div>
					{/* ...existing code... */}
					<div
						style={{
							background: '#bfb08a',
							borderRadius: '1.2rem',
							boxShadow: hovered[2] ? '0 12px 24px #cfc6b099' : '0 6px 12px #cfc6b055',
							width: 320,
							height: 320,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							cursor: 'pointer',
							border: 'none',
							position: 'relative',
							transform: hovered[2] ? 'translateY(-8px) scale(1.03)' : 'none',
							transition: 'box-shadow 0.2s, transform 0.2s',
						}}
						onClick={() => handleNavigate('/customer/contact')}
						onMouseEnter={() => setHovered([false, false, true])}
						onMouseLeave={() => setHovered([false, false, false])}
					>
						<div style={{
							background: '#fff',
							borderRadius: '2rem',
							boxShadow: '0 2px 8px #bbb',
							width: 240,
							height: 240,
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							justifyContent: 'center',
							position: 'relative',
						}}>
							<img src="https://img.icons8.com/ios-filled/100/000000/contacts.png" alt="Contact Front Desk" style={{ width: 100, height: 100, objectFit: 'contain', marginBottom: 16 }} />
							<div style={{ fontSize: 28, color: '#222', fontWeight: 400, fontFamily: 'serif', marginTop: 12 }}>Contact Frontdesk</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}