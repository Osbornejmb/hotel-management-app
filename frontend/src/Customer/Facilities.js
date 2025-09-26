import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Facilities.css';

function Facilities() {
	const navigate = useNavigate();

	React.useEffect(() => {
		if (!localStorage.getItem('customerRoomNumber')) {
			navigate('/customer/login', { replace: true });
		}
	}, [navigate]);

	const facilities = [
		{
			name: 'Fitness Center',
			img: 'https://img.icons8.com/color/96/000000/dumbbell.png',
			path: '/customer/facilities/Fitness',
		},
		{
			name: 'Restaurant',
			img: 'https://img.icons8.com/color/96/000000/restaurant.png',
			path: '/customer/facilities/Restaurant',
		},
		{
			name: 'Swimming Pool',
			img: 'https://img.icons8.com/color/96/000000/pool.png',
			path: '/customer/facilities/Pool',
		},
		{
			name: 'Parking',
			img: 'https://img.icons8.com/color/96/000000/parking.png',
			path: '/customer/facilities/Parking',
		},
		{
			name: 'Playground',
			img: 'https://img.icons8.com/color/96/000000/playground.png',
			path: '/customer/facilities/Playground',
		},
		{
			name: 'Garden',
			img: 'https://img.icons8.com/color/96/000000/garden.png',
			path: '/customer/facilities/Garden',
		},
		{
			name: 'Front Desk',
			img: 'https://img.icons8.com/color/96/000000/front-desk.png',
			path: '/customer/facilities/FrontDesk',
		},
	];

	return (
		<div className="facilities-container">
			<h2 className="facilities-title">Facilities</h2>
			<button onClick={() => navigate('/customer/interface')} className="back-button">Back to Customer Interface</button>
			<div className="facilities-list">
				{facilities.map((facility) => (
					<div key={facility.name} className="facility-item" onClick={() => navigate(facility.path)}>
						<img src={facility.img} alt={facility.name} className="facility-image" />
						<div className="facility-name">{facility.name}</div>
					</div>
				))}
			</div>
		</div>
	);
}

export default Facilities;
