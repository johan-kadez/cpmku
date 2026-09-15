import {
  Outlet
} from 'react-router-dom';

import Header from '../../components/layout/Header';
import BottomNav from '../../components/layout/BottomNav';

export default function AdminShell() {
  return (
    <div className="admin-shell">
      <Header />

      <main className="container admin-container">
        <section className="admin-content">
          <Outlet />
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
