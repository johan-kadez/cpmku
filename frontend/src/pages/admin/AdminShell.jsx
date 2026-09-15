import {
  Outlet
} from 'react-router-dom';

import BottomNav from '../../components/layout/BottomNav';

export default function AdminShell() {
  return (
    <div className="admin-shell">
      <main className="container admin-container">
        <section className="admin-content">
          <Outlet />
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
