import {
  Outlet,
  useLocation
} from 'react-router-dom';

import Header from './Header';

import Footer from './Footer';

import BottomNav from './BottomNav';

import {
  useMaintenance
} from '../../context/MaintenanceContext';

import {
  useAuth
} from '../../context/AuthContext';

import {
  useNotifications
} from '../../context/NotificationContext';

import TransactionChatFloat from '../chat/TransactionChatFloat';

export default function AppLayout() {
  const {
    settings,
    loading
  } = useMaintenance();

  const {
    role
  } = useAuth();

  const {
    toast,
    dismissToast
  } = useNotifications();

  const loc =
    useLocation();

  const admin =
  role === 'admin';

  if (
    !loading &&
    settings?.maintenanceMode &&
    !admin
  ) {
    return (
      <main className="maintenance">
        <div>
          <span>
            Cpmku Marketplace
          </span>

          <h1>
            WEBSITE SEDANG DALAM PEMELIHARAAN
          </h1>

          <p>
            {
              settings.maintenanceMessage ||
              'Kami sedang melakukan pemeliharaan sistem. Silakan kembali beberapa saat lagi.'
            }
          </p>
        </div>
      </main>
    );
  }

  return (
    <>
      <Header />

      <main className="container">
        <Outlet />
      </main>

      <Footer />

      <BottomNav />

      <TransactionChatFloat />

      {toast && (
        <div
          className="cpmku-toast"
          role="status"
        >
          <div className="cpmku-toast-content">
            <strong>
              {
                toast.title
              }
            </strong>

            <p>
              {
                toast.message
              }
            </p>
          </div>

          <button
            type="button"
            onClick={
              dismissToast
            }
            aria-label="Tutup notifikasi"
          >
            ×
          </button>
        </div>
      )}
    </>
  );
}
