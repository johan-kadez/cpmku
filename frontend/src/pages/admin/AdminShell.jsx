import {Outlet} from 'react-router-dom';
import AdminNav from '../../components/admin/AdminNav';
export default function AdminShell(){return <><section className="page-title"><h1>Admin Panel</h1><p>Kontrol marketplace tanpa custom claim. Admin ditentukan dari email environment backend.</p></section><AdminNav/><Outlet/></>}
