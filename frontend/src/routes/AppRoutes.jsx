import { Routes, Route } from 'react-router-dom';

import Home from '../pages/public/Home';
import Products from '../pages/public/Products';
import ProductDetail from '../pages/public/ProductDetail';
import Profile from '../pages/public/Profile';
import Transactions from '../pages/public/Transactions';
import Favorites from '../pages/public/Favorites';

import ProtectedRoute from './ProtectedRoute';

import Login from '../pages/auth/Login';

import AdminLogin from '../pages/admin/Login';
import AdminDashboard from '../pages/admin/Dashboard';
import Manage from '../pages/admin/Manage';
import Settings from '../pages/admin/Settings';

import SellerDashboard from '../pages/seller/SellerDashboard';

export default function AppRoutes() {
  return (
    <Routes>

      {/* PUBLIC */}

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
        element={<ProductDetail />}
      />

      {/* BUYER */}

      <Route
        path="/login"
        element={<Login />}
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

      {/* ADMIN */}

      <Route
        path="/admin/login"
        element={<AdminLogin />}
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/manage"
        element={
          <ProtectedRoute>
            <Manage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />

      {/* SELLER */}

      <Route
        path="/seller"
        element={
          <ProtectedRoute>
            <SellerDashboard />
          </ProtectedRoute>
        }
      />

      {/* 404 */}

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
