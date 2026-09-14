import {
  Routes,
  Route,
  Navigate
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
import AdminDashboard from '../pages/admin/Dashboard';
import Manage from '../pages/admin/Manage';
import Rooms from '../pages/admin/Rooms';
import Users from '../pages/admin/Users';
import Settings from '../pages/admin/Settings';

import SellerDashboard from '../pages/seller/SellerDashboard';

import { useAuth } from '../context/AuthContext';

function AdminRoute({ children }) {
  const {
    user,
    loading,
    role
  } = useAuth();

  if (loading) {
    return (
      <div className="notice">
        Memuat...
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/admin/login"
        replace
      />
    );
  }

  if (role !== 'admin') {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  return children;
}

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

        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/sellers"
          element={
            <AdminRoute>
              <Manage
                type="sellers"
                title="Seller"
              />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/products"
          element={
            <AdminRoute>
              <Manage
                type="products"
                title="Produk"
              />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/orders"
          element={
            <AdminRoute>
              <Manage
                type="orders"
                title="Order"
              />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/payments"
          element={
            <AdminRoute>
              <Manage
                type="payments"
                title="Pembayaran"
              />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/rooms"
          element={
            <AdminRoute>
              <Rooms />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/users"
          element={
            <AdminRoute>
              <Users />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/settings"
          element={
            <AdminRoute>
              <Settings />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/manage"
          element={
            <AdminRoute>
              <Manage
                type="products"
                title="Kelola Produk"
              />
            </AdminRoute>
          }
        />

      </Route>

      <Route
        path="/admin/login"
        element={<AdminLogin />}
      />

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
