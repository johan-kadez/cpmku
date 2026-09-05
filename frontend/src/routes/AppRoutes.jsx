import {Routes,Route,Navigate} from 'react-router-dom';
import {Outlet} from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import Home from '../pages/public/Home';
import ProductDetail from '../pages/public/ProductDetail';
import SellerPage from '../pages/public/SellerPage';
import Login from '../pages/auth/Login';
import SellerApply from '../pages/auth/SellerApply';
import SellerLogin from '../pages/auth/SellerLogin';
import SellerDashboard from '../pages/seller/SellerDashboard';
import ChatPage from '../pages/chat/ChatPage';
import AdminShell from '../pages/admin/AdminShell';
import Dashboard from '../pages/admin/Dashboard';
import Manage from '../pages/admin/Manage';
import Settings from '../pages/admin/Settings';
import Rooms from '../pages/admin/Rooms';
import Users from '../pages/admin/Users';
import {useAuth} from '../context/AuthContext';
function Private({children,roles}){const {user,role,loading}=useAuth();
if(loading)return <div className="state">Memuat sesi...</div>;
if(!user)return <Navigate to="/login" replace/>;
if(roles&&!roles.includes(role))return <div className="state">Akses ditolak.</div>;
return children}
export default function AppRoutes(){return <Routes><Route element={<AppLayout/>}><Route path="/" element={<Home/>}/><Route path="/login" element={<Login/>}/><Route path="/seller/login" element={<SellerLogin/>}/><Route path="/seller/apply" element={<Private><SellerApply/></Private>}/><Route path="/seller/dashboard" element={<Private roles={['seller']}><SellerDashboard/></Private>}/><Route path="/product/:id" element={<ProductDetail/>}/><Route path="/seller/:uid" element={<SellerPage/>}/><Route path="/chat" element={<Private><ChatPage/></Private>}/><Route path="/chat/:roomId" element={<Private><ChatPage/></Private>}/><Route path="/admin" element={<Private roles={['admin']}><AdminShell/></Private>}><Route index element={<Dashboard/>}/><Route path="sellers" element={<Manage type="sellers" title="Seller Applications"/>}/><Route path="products" element={<Manage type="products" title="Products"/>}/><Route path="orders" element={<Manage type="orders" title="Orders"/>}/><Route path="payments" element={<Manage type="payments" title="Payments"/>}/><Route path="rooms" element={<Rooms/>}/><Route path="users" element={<Users/>}/><Route path="settings" element={<Settings/>}/></Route><Route path="*" element={<Navigate to="/" replace/>}/></Route></Routes>}
