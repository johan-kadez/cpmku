import {
  Link,
  Outlet,
  useNavigate
} from 'react-router-dom';

import Header from '../../components/layout/Header';
import BottomNav from '../../components/layout/BottomNav';

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
      <Header />

      <main className="container admin-container">
        <div className="admin-shell-top">
          <div>
            <span className="admin-eyebrow">
              CPMKU
            </span>

            <h1>
              Dashboard Admin
            </h1>

            <p>
              Kelola marketplace CPMKU
              dari satu tempat.
            </p>
          </div>

          <div className="admin-shell-actions">
            <Link
              to="/"
              className="admin-public-link"
            >
              Marketplace
            </Link>

            <button
              type="button"
              onClick={doLogout}
              className="admin-logout-button"
            >
              Logout
            </button>
          </div>
        </div>

        <section className="admin-content">
          <Outlet />
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
