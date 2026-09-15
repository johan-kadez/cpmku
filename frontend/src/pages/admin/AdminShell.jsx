import {
Link,
Outlet
} from 'react-router-dom';

import {
useAuth
} from '../../context/AuthContext';

import AdminNav from '../../components/admin/AdminNav';

import logo from '../../assets/file_0000000060d481fab374b11e35f23cf9.png';

export default function AdminShell() {
const {
user
} = useAuth();

return (
<div className="admin-shell">
<header className="header admin-header">
<Link
className="brand"
to="/admin"
>
<img
src={logo}
alt="Logo"
className="brand-logo"
/>
</Link>

    <div className="admin-header-actions">
      <Link
        className="profile-pill"
        to="/admin/profile"
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
          Admin
        </span>
      </Link>

      <Link
        className="admin-public-link"
        to="/"
      >
        Public Web
      </Link>
    </div>
  </header>

  <AdminNav />

  <main className="container admin-container">
    <section className="admin-content">
      <Outlet />
    </section>
  </main>
</div>

);
}
