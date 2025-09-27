import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function CustomerInterface() {
	const navigate = useNavigate();
	const [hovered, setHovered] = useState([false, false, false]);

	// Notification state
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
				const res = await fetch('/api/cart/orders/all');
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


	// Handle bell click
	const handleBellClick = () => {
		setShowPopup(true);
	};
	// Handle popup close
	const handleClosePopup = () => {
		// Mark all currently notified orders as viewed and persist to localStorage
		setViewedOrderIds(prev => {
			const updated = [...prev, ...notifications.map(o => o._id)];
			localStorage.setItem('viewedOrderIds', JSON.stringify(updated));
			return updated;
		});
		setShowPopup(false);
		setNotifications([]); // clear notifications in popup only
		setCounter(0); // reset counter
	};
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
		color: '#F7D774',
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
		zIndex: 999,
	};
	const closeBtnStyle = {
		background: '#F7D774',
		color: '#4B2E06',
		border: 'none',
		borderRadius: '0.35em',
		fontSize: '1rem',
		fontWeight: 500,
		padding: '0.3em 1em',
		cursor: 'pointer',
		marginTop: 12,
		float: 'right',
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
					<button style={bellStyle} onClick={handleBellClick} aria-label="Notifications">
						{/* Simple bell SVG */}
						<span style={bellIconStyle}>
							<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F7D774" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
						</span>
						{/* Show counter for new delivered orders */}
						{counter > 0 && <span style={bellCounterStyle}>{counter}</span>}
					</button>
					<button style={logoutBtnStyle} onClick={handleLogout} onMouseOver={e => { e.target.style.background = '#ffe9a7'; }} onMouseOut={e => { e.target.style.background = '#F7D774'; }}>
						Log Out
					</button>
					{/* Notification Popup */}
					{showPopup && (
						<div style={popupStyle}>
							<div style={{ fontWeight: 600, fontSize: 18, marginBottom: 10 }}>Delivered Items</div>
							{notifications.length === 0 ? (
								<div style={{ color: '#888', fontSize: 15 }}>No new delivered items.</div>
							) : (
								<ul style={{ paddingLeft: 18, marginBottom: 8 }}>
									{notifications.map((order, idx) => (
										order.items && order.items.length > 0 ? order.items.map((item, i) => (
											<li key={item.name + i} style={{ marginBottom: 6 }}>
												{item.name} delivered
											</li>
										)) : (
											<li key={idx} style={{ marginBottom: 6 }}>
												Item delivered
											</li>
										)
									))}
								</ul>
							)}
							<button style={closeBtnStyle} onClick={handleClosePopup}>Close</button>
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


