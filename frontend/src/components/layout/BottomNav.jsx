import { NavLink } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';

const helpIcon =
  'https://d1x91p7vw3vuq8.cloudfront.net/bottom_navigation_content/2026618/rro9ab3xmyany3dq4bde5.svg';

const profileIcon =
  'https://d1x91p7vw3vuq8.cloudfront.net/bottom_navigation_content/2024516/it6w8f7sn5wdrgmsnl4n.svg';

export default function BottomNav() {
  const {
    user,
    role
  } = useAuth();

  const isAdmin =
    Boolean(user) &&
    role === 'admin';

  const userItems = [
    ['/','⌂','Home'],
    ['/products','⛟','Produk'],
    ['/favorites','♥','Favorite'],
    ['/transactions','⇄','Transaksi']
  ];

  const adminItems = [
    ['/admin','⌂','Dashboard'],
    ['/admin/sellers','♙','Seller'],
    ['/admin/products','⛟','Produk'],
    ['/admin/orders','⇄','Order'],
    ['/admin/payments','◈','Pembayaran'],
    ['/admin/rooms','▣','Room'],
    ['/admin/users','♙','User'],
    ['/admin/settings','⚙','Settings']
  ];

  const items =
    isAdmin
      ? adminItems
      : userItems;

  return (
    <nav
      className={
        isAdmin
          ? 'bottom-nav bottom-nav-admin'
          : 'bottom-nav'
      }
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
            <b>{icon}</b>
            <span>{label}</span>
          </NavLink>
        )
      )}

      {!isAdmin && (
        <>
          <NavLink to="/help">
            <img
              src={helpIcon}
              alt="Bantuan"
            />
            <span>Bantuan</span>
          </NavLink>

          <NavLink to="/profile">
            <img
              src={profileIcon}
              alt="Profile"
            />
            <span>
              {user ? 'Profile' : 'Login'}
            </span>
          </NavLink>
        </>
      )}
    </nav>
  );
}
