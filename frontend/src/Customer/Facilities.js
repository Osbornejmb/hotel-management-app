import React, { useState } from 'react';
import './Facilities.css';

const FACILITY_DATA = [
	{
		key: 'Restaurant',
		title: 'Restaurant',
		description: 'Enjoy freshly cooked meals every day at our restaurant, where good food and comfort come together for a satisfying dining experience.',
		img: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
		thumb: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80',
	},
	{
		key: 'Pool',
		title: 'Swimming Pool',
		description: 'Take a refreshing dip or spend a relaxing afternoon by the pool, perfect for unwinding with family and friends.',
		img: 'https://www.landcon.ca/wp-content/uploads/2019/01/Backyard-Pool-900x450.jpg',
		thumb: 'https://www.landcon.ca/wp-content/uploads/2019/01/Backyard-Pool-900x450.jpg',
	},
	{
		key: 'Fitness',
		title: 'Fitness Center',
		description: 'Stay active during your stay with our fitness center, offering the equipment you need for a simple workout or a full routine.',
		img: 'https://images.squarespace-cdn.com/content/v1/58471a2329687f12c60955a3/1709159979051-8UDTOGLV884UYMV5LW1T/fitness-center-design.jpg?format=1000w',
		thumb: 'https://images.squarespace-cdn.com/content/v1/58471a2329687f12c60955a3/1709159979051-8UDTOGLV884UYMV5LW1T/fitness-center-design.jpg?format=1000w',
	},
	{
		key: 'Parking',
		title: 'Parking',
		description: 'Enjoy the convenience of secure on-site parking, giving you peace of mind while you focus on your stay.',
		img: 'https://webbox.imgix.net/images/fkasnjcmlhnbwpkv/ac1975e4-f8ee-4b5c-b76d-321325562de3.jpg?auto=format,compress&fit=crop&crop=entropy',
		thumb: 'https://webbox.imgix.net/images/fkasnjcmlhnbwpkv/ac1975e4-f8ee-4b5c-b76d-321325562de3.jpg?auto=format,compress&fit=crop&crop=entropy',
	},
	{
		key: 'Garden',
		title: 'Garden',
		description: 'Step into our garden and enjoy a peaceful space filled with greenery, ideal for a morning walk or quiet relaxation.',
		img: 'https://cdn.britannica.com/42/91642-050-332E5C66/Keukenhof-Gardens-Lisse-Netherlands.jpg',
		thumb: 'https://cdn.britannica.com/42/91642-050-332E5C66/Keukenhof-Gardens-Lisse-Netherlands.jpg',
	},
	{
		key: 'Playground',
		title: 'Playground',
		description: 'Let the kids have fun in our playground, a safe and lively spot where they can laugh, play, and make new friends.',
		img: 'https://fastrackcms-nightcap.imgix.net/uploads/nc-playgrounds-cms-header.jpg?fit=min&ixlib=php-2.3.0&s=051f395d1718827bb734ca34516e27d6',
		thumb: 'https://fastrackcms-nightcap.imgix.net/uploads/nc-playgrounds-cms-header.jpg?fit=min&ixlib=php-2.3.0&s=051f395d1718827bb734ca34516e27d6',
	},
];

function Facilities() {
	const [modal, setModal] = useState({ open: false, facility: null });

	// Optionally keep the login redirect
	React.useEffect(() => {
		if (!localStorage.getItem('customerRoomNumber')) {
			window.location.replace('/customer/login');
		}
	}, []);

	const openModal = (facility) => setModal({ open: true, facility });
	const closeModal = () => setModal({ open: false, facility: null });

	// Back button: close modal if open, otherwise go back
	const handleBack = () => {
		if (modal.open) {
			closeModal();
		} else {
			window.history.back();
		}
	};

	return (
		<div className="facilities-root">
			{/* Header Bar */}
			<div className="facilities-header">
				<img src="/lumine_icon.png" alt="Lumine Logo" className="facilities-logo" />
				<span className="facilities-brand">Lumine</span>
			</div>

			{/* Back Button and Title */}
			<div className="facilities-topbar">
				<button className="facilities-back" onClick={handleBack}>
					<span className="facilities-back-arrow">←</span> Back
				</button>
			</div>

			<div className="facilities-titlebar-centered">
				<span className="facilities-title-highlight">Lumine Facilities</span>
			</div>

			{/* Facilities Grid */}
			<div className="facilities-grid">
				{FACILITY_DATA.map((facility) => (
					<div key={facility.key} className="facilities-card" onClick={() => openModal(facility)}>
						<div className="facilities-card-inner">
							<img src={facility.thumb} alt={facility.title} className="facilities-card-img" />
							<div className="facilities-card-name">{facility.title}</div>
						</div>
					</div>
				))}
			</div>

			{/* Modal Popup */}
			{modal.open && modal.facility && (
				<div className="facility-modal-overlay" onClick={closeModal}>
					<div className="facility-modal" onClick={e => e.stopPropagation()}>
						<img src={modal.facility.img} alt={modal.facility.title} className="facility-modal-img" />
						<h2 className="facility-modal-title">{modal.facility.title}</h2>
						<p className="facility-modal-desc">{modal.facility.description}</p>
						<button className="facility-modal-close" onClick={closeModal}>Close</button>
					</div>
				</div>
			)}
		</div>
	);
}

export default Facilities;