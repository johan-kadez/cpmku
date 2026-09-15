import {
  Link,
  useLocation
} from 'react-router-dom';

import {
  useAuth
} from '../../context/AuthContext';

import logo from '../../assets/file_0000000060d481fab374b11e35f23cf9.png';

export default function Header() {
  const {
    user,
    role
  } = useAuth();

  const location = useLocation();

  const isAdminPanel =
    location.pathname === '/admin' ||
    location.pathname.startsWith('/admin/');

  const profilePath =
    role === 'admin' && isAdminPanel
      ? '/admin/profile'
      : '/profile';

  return (
    <header className="header">
      <Link
        className="brand"
        to={isAdminPanel ? '/admin' : '/'}
      >
        <img
          src={logo}
          alt="Logo"
          className="brand-logo"
        />
      </Link>

      <Link
        className="profile-pill"
        to={profilePath}
      >
        {user?.photoURL ? (
          <img
            src={user.photoURL}
            alt=""
          />
        ) : (
          '◎'
        )}

        <span>
          {user
            ? 'Profile'
            : 'Masuk'}
        </span>
      </Link>
    </header>
  );
}
