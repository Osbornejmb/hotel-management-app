import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function GlobalPopupBridge() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const onOpenCart = () => {
      // If already on customer interface, let it handle the event
      if (location.pathname === '/customer/interface') return;
      navigate('/customer/interface', { state: { openCart: true } });
    };

    const onOpenOrderStatus = () => {
      if (location.pathname === '/customer/interface') return;
      navigate('/customer/interface', { state: { openStatus: true } });
    };

    window.addEventListener('openCart', onOpenCart);
    window.addEventListener('openOrderStatus', onOpenOrderStatus);

    return () => {
      window.removeEventListener('openCart', onOpenCart);
      window.removeEventListener('openOrderStatus', onOpenOrderStatus);
    };
  }, [location.pathname, navigate]);

  return null;
}
