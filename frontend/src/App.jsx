import AppRoutes from './routes/AppRoutes';
import {AuthProvider} from './context/AuthContext';
import {NotificationProvider} from './context/NotificationContext';
export default function App(){return <AuthProvider><NotificationProvider><AppRoutes/></NotificationProvider></AuthProvider>}
