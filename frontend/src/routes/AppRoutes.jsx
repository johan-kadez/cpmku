import { Routes, Route } from 'react-router-dom';

import Home from '../pages/public/Home';
import Products from '../pages/public/Product';
import ProductDetail from '../pages/public/ProductDetail';
import Login from '../pages/auth/Login';
import Profile from '../pages/public/Profile';
import Transactions from '../pages/public/Transactions';
import Favorites from '../pages/public/Favorite';

import ProtectedRoute from './ProtectedRoute';

import AdminLogin from '../pages/admin/Login';
import AdminDashboard from '../pages/admin/Dashboard';
import Manage from '../pages/admin/Manage';import { Routes, Route } from 'react-router-dom';

import Home from '../pages/public/Home';
import Products from '../pages/public/Product';
import ProductDetail from '../pages/public/ProductDetail';
import Profile from '../pages/public/Profile';
import Transactions from '../pages/public/Transactions';
import Favorites from '../pages/public/Favorite';

import ProtectedRoute from './ProtectedRoute';

import Login from '../pages/auth/Login';

import AdminLogin from '../pages/admin/Login';
import AdminDashboard from '../pages/admin/Dashboard';
import Manage from '../pages/admin/Manage';
import Settings from '../pages/admin/Settings';

import SellerDashboard from '../pages/seller/Dashboard';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public pages */}
      <Route path="/" element={<Home />} />

      <Route path="/products" element={<Products />} />

      <Route
        path="/products/:id"
        element={<ProductDetail />}
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

      {/* Buyer authentication */}
      <Route
        path="/login"
        element={<Login />}
      />

      {/* Admin */}
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

      {/* Seller */}
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
import Settings from '../pages/admin/Settings';

import SellerDashboard from '../pages/seller/Dashboard';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />

      <Route
        path="/products"
        element={<Products />}
      />

      <Route
        path="/products/:id"
        element={<ProductDetail />}
      />

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

      <Route
        path="/seller/dashboard"
        element={
          <ProtectedRoute role="seller">
            <SellerDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/login"
        element={<AdminLogin />}
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute role="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/users"
        element={
          <ProtectedRoute role="admin">
            <Manage
              type="users"
              title="Users"
            />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/products"
        element={
          <ProtectedRoute role="admin">
            <Manage
              type="products"
              title="Products"
            />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/orders"
        element={
          <ProtectedRoute role="admin">
            <Manage
              type="orders"
              title="Orders"
            />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/payments"
        element={
          <ProtectedRoute role="admin">
            <Manage
              type="payments"
              title="Payments"
            />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/rooms"
        element={
          <ProtectedRoute role="admin">
            <Manage
              type="rooms"
              title="Rooms"
            />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/sellers"
        element={
          <ProtectedRoute role="admin">
            <Manage
              type="sellers"
              title="Seller Applications"
            />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute role="admin">
            <Settings />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
