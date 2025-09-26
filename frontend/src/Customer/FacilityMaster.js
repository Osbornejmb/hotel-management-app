import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const facilityContent = {
	Restaurant: {
		title: 'Restaurant',
		description: 'Enjoy freshly cooked meals every day at our restaurant, where good food and comfort come together for a satisfying dining experience.',
		img: 'https://img.icons8.com/color/96/000000/restaurant.png',
	},
	Pool: {
		title: 'Swimming Pool',
		description: 'Take a refreshing dip or spend a relaxing afternoon by the pool, perfect for unwinding with family and friends.',
		img: 'https://img.icons8.com/color/96/000000/pool.png',
	},
	Fitness: {
		title: 'Fitness Center',
		description: 'Stay active during your stay with our fitness center, offering the equipment you need for a simple workout or a full routine.',
		img: 'https://img.icons8.com/color/96/000000/dumbbell.png',
	},
	Parking: {
		title: 'Parking',
		description: 'Enjoy the convenience of secure on-site parking, giving you peace of mind while you focus on your stay.',
		img: 'https://img.icons8.com/color/96/000000/parking.png',
	},
	Garden: {
		title: 'Garden',
		description: 'Step into our garden and enjoy a peaceful space filled with greenery, ideal for a morning walk or quiet relaxation.',
		img: 'https://img.icons8.com/color/96/000000/garden.png',
	},
	Playground: {
		title: 'Playground',
		description: 'Let the kids have fun in our playground, a safe and lively spot where they can laugh, play, and make new friends.',
		img: 'https://img.icons8.com/color/96/000000/playground.png',
	},
	FrontDesk: {
		title: 'Front Desk',
		description: 'Our friendly front desk team is available around the clock to assist you with anything you need, anytime.',
		img: 'https://img.icons8.com/color/96/000000/front-desk.png',
	},
};

function FacilityMaster() {
	const { facility } = useParams();
	const navigate = useNavigate();
	const content = facilityContent[facility];

	if (!content) {
		return (
			<div style={{ textAlign: 'center', marginTop: '3rem', background: '#111', minHeight: '100vh', color: '#FFD700' }}>
				<h2 style={{ color: '#FFD700', textShadow: '0 2px 8px #000', letterSpacing: '2px' }}>Facility Not Found</h2>
				<p style={{ color: '#FFD700', textShadow: '0 2px 8px #000' }}>The requested facility does not exist.</p>
			</div>
		);
	}

	return (
		<div style={{ display: 'flex', minHeight: '60vh', marginTop: '3rem', background: '#111', color: '#FFD700' }}>
			<div style={{ position: 'absolute', left: 30, top: 30 }}>
				<button onClick={() => navigate(-1)} style={{ padding: '0.5rem 1.5rem', borderRadius: '8px', border: '2px solid #FFD700', background: '#222', color: '#FFD700', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 8px #FFD700', transition: 'background 0.2s, color 0.2s' }}
					onMouseOver={e => { e.target.style.background = '#FFD700'; e.target.style.color = '#222'; }}
					onMouseOut={e => { e.target.style.background = '#222'; e.target.style.color = '#FFD700'; }}>
					Back
				</button>
			</div>
			<div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#222', borderRadius: '16px 0 0 16px', boxShadow: '0 2px 16px #FFD700' }}>
				<img src={content.img} alt={content.title} style={{ borderRadius: '16px', boxShadow: '0 2px 16px #FFD700', width: '60%', maxWidth: '400px', height: 'auto', background: '#111' }} />
			</div>
			<div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start', padding: '2rem', background: '#222', borderRadius: '0 16px 16px 0', boxShadow: '0 2px 16px #FFD700', color: '#FFD700' }}>
				<h2 style={{ marginBottom: '1rem', color: '#FFD700', textShadow: '0 2px 8px #000', letterSpacing: '2px' }}>{content.title}</h2>
				<p style={{ marginBottom: '1.5rem', color: '#FFD700', textShadow: '0 2px 8px #000', fontSize: '1.15rem' }}>{content.description}</p>
			</div>
		</div>
	);
}

export default FacilityMaster;
