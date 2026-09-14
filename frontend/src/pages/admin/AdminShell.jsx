import {
  Link,
  Outlet,
  useNavigate
} from 'react-router-dom';

import AdminNav from '../../components/admin/AdminNav';

import {
  useAuth
} from '../../context/AuthContext';

export default function AdminShell() {
  const {
    logout
  } = useAuth();

  const navigate =
    useNavigate();

  const doLogout =
    async () => {
      await logout();

      navigate(
        '/admin/login',
        {
          replace: true
        }
      );
    };

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <span className="brand">
          JOHAN
          <span>
            ADMIN
          </span>
        </span>

        <div className="admin-header-actions">
          <Link
            to="/"
            className="admin-public-link"
          >
            Public Web
          </Link>

          <button
            type="button"
            onClick={
              doLogout
            }
          >
            Logout
          </button>
        </div>
      </header>

      <div className="container">
        <section className="page-title">
          <h1>
            Admin Panel
          </h1>

          <p>
            Kontrol marketplace
            dengan sistem UID
            admin.
          </p>
        </section>

        <AdminNav />

        <Outlet />
      </div>
    </div>
  );
}
