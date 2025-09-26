import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function CustomerInterface() {
	const navigate = useNavigate();
	const [hovered, setHovered] = useState([false, false, false]);

	const handleNavigate = (path) => {
		navigate(path);
	};

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
						<button style={logoutBtnStyle} onClick={handleLogout} onMouseOver={e => { e.target.style.background = '#ffe9a7'; }} onMouseOut={e => { e.target.style.background = '#F7D774'; }}>
							Log Out
						</button>
					</div>
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
					{/* Food & Beverage Card */}
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
					{/* Contact Front Desk Card */}
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


