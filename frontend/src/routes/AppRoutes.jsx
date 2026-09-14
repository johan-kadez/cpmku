import {
  Routes,
  Route
} from 'react-router-dom';

import AppLayout from '../components/layout/AppLayout';

import Home from '../pages/public/Home';
import Products from '../pages/public/Products';
import ProductDetail from '../pages/public/ProductDetail';
import Profile from '../pages/public/Profile';
import Transactions from '../pages/public/Transactions';
import Favorites from '../pages/public/Favorites';
import Help from '../pages/public/Help';

import ProtectedRoute from './ProtectedRoute';

import Login from '../pages/auth/Login';

import ChatPage from '../pages/chat/ChatPage';

import AdminLogin from '../pages/admin/AdminLogin';
import AdminShell from '../pages/admin/AdminShell';
import AdminDashboard from '../pages/admin/Dashboard';
import Manage from '../pages/admin/Manage';
import Rooms from '../pages/admin/Rooms';
import Users from '../pages/admin/Users';
import Settings from '../pages/admin/Settings';

import SellerDashboard from '../pages/seller/SellerDashboard';

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/products"
          element={<Products />}
        />

        <Route
          path="/products/:id"
          element={
            <ProductDetail />
          }
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/help"
          element={<Help />}
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/transactions"
          element={
            <ProtectedRoute>
              <Transactions />
            </ProtectedRoute>
          }
        />

        <Route
          path="/favorites"
          element={
            <ProtectedRoute>
              <Favorites />
            </ProtectedRoute>
          }
        />

        <Route
          path="/chat/:roomId"
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route
        path="/admin/login"
        element={<AdminLogin />}
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminShell />
          </ProtectedRoute>
        }
      >
        <Route
          index
          element={
            <AdminDashboard />
          }
        />

        <Route
          path="sellers"
          element={
            <Manage
              type="sellers"
              title="Seller"
            />
          }
        />

        <Route
          path="products"
          element={
            <Manage
              type="products"
              title="Produk"
            />
          }
        />

        <Route
          path="orders"
          element={
            <Manage
              type="orders"
              title="Order"
            />
          }
        />

        <Route
          path="payments"
          element={
            <Manage
              type="payments"
              title="Pembayaran"
            />
          }
        />

        <Route
          path="rooms"
          element={<Rooms />}
        />

        <Route
          path="users"
          element={<Users />}
        />

        <Route
          path="settings"
          element={<Settings />}
        />

        <Route
          path="manage"
          element={
            <Manage
              type="products"
              title="Kelola Produk"
            />
          }
        />
      </Route>

      <Route
        path="/seller"
        element={
          <ProtectedRoute>
            <SellerDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="*"
        element={
          <div className="notice error">
            Halaman tidak ditemukan.
          </div>
        }
      />
    </Routes>
  );
}
