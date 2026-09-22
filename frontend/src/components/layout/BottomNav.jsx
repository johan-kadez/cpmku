import {
  NavLink,
  useLocation
} from 'react-router-dom';

import {
  useAuth
} from '../../context/AuthContext';

import {
  useEffect,
  useRef,
  useState
} from 'react';

const helpIcon =
  'https://d1x91p7vw3vuq8.cloudfront.net/bottom_navigation_content/2026618/rro9ab3xmyany3dq4bde5.svg';

const profileIcon =
  'https://d1x91p7vw3vuq8.cloudfront.net/bottom_navigation_content/2024516/it6w8f7sn5wdrgmsnl4n.svg';

export default function BottomNav() {
  const {
    user
  } = useAuth();

  const location =
    useLocation();

  const [visible, setVisible] =
    useState(true);

  const lastScrollY =
    useRef(0);

  const ticking =
    useRef(false);

  useEffect(() => {
    lastScrollY.current =
      window.scrollY || 0;

    const handleScroll = () => {
      if (ticking.current) {
        return;
      }

      ticking.current = true;

      window.requestAnimationFrame(() => {
        const currentY =
          window.scrollY || 0;

        const previousY =
          lastScrollY.current;

        const difference =
          currentY - previousY;

        if (currentY <= 20) {
          setVisible(true);
        } else if (difference > 6) {
          setVisible(false);
        } else if (difference < -6) {
          setVisible(true);
        }

        lastScrollY.current =
          currentY;

        ticking.current = false;
      });
    };

    window.addEventListener(
      'scroll',
      handleScroll,
      {
        passive: true
      }
    );

    return () => {
      window.removeEventListener(
        'scroll',
        handleScroll
      );
    };
  }, []);

  useEffect(() => {
    setVisible(true);
  }, [location.pathname]);

  const isAdminPanel =
    location.pathname === '/admin' ||
    location.pathname.startsWith('/admin/');

  const publicItems = [
    ['/', '⌂', 'Home'],
    ['/products', '⛟', 'Produk'],
    ['/favorites', '♥', 'Favorite'],
    ['/transactions', '⇄', 'Transaksi']
  ];

  const adminItems = [
    ['/admin', '⌂', 'Dashboard'],
    ['/admin/sellers', '♙', 'Seller'],
    ['/admin/products', '⛟', 'Produk'],
    ['/admin/orders', '⇄', 'Order'],
    ['/admin/payments', '◈', 'Pembayaran'],
    ['/admin/rooms', '▣', 'Room'],
    ['/admin/users', '♙', 'User'],
    ['/admin/settings', '⚙', 'Settings']
  ];

  const items =
    isAdminPanel
      ? adminItems
      : publicItems;

  return (
    <nav
      className={[
        'bottom-nav',
        isAdminPanel
          ? 'bottom-nav-admin'
          : '',
        visible
          ? 'bottom-nav-visible'
          : 'bottom-nav-hidden'
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {items.map(
        ([to, icon, label]) => (
          <NavLink
            key={to}
            to={to}
            end={
              to === '/' ||
              to === '/admin'
            }
          >
            <b>
              {icon}
            </b>

            <span>
              {label}
            </span>
          </NavLink>
        )
      )}

      {!isAdminPanel && (
        <>
          <NavLink to="/help">
            <img
              src={helpIcon}
              alt="Bantuan"
            />

            <span>
              Bantuan
            </span>
          </NavLink>

          <NavLink to="/profile">
            <img
              src={profileIcon}
              alt="Profile"
            />

            <span>
              {user
                ? 'Profile'
                : 'Login'}
            </span>
          </NavLink>
        </>
      )}
    </nav>
  );
}
