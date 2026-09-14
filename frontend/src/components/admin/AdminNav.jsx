import {
  NavLink
} from 'react-router-dom';

const items = [
  {
    to: '/admin',
    label: 'Dashboard',
    end: true
  },
  {
    to: '/admin/sellers',
    label: 'Seller'
  },
  {
    to: '/admin/products',
    label: 'Produk'
  },
  {
    to: '/admin/orders',
    label: 'Order'
  },
  {
    to: '/admin/payments',
    label: 'Pembayaran'
  },
  {
    to: '/admin/rooms',
    label: 'Room'
  },
  {
    to: '/admin/users',
    label: 'User'
  },
  {
    to: '/admin/settings',
    label: 'Settings'
  }
];

export default function AdminNav() {
  return (
    <nav
      className="admin-nav"
      aria-label="Navigasi admin"
    >
      {items.map(item => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            isActive
              ? 'admin-nav-link active'
              : 'admin-nav-link'
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
