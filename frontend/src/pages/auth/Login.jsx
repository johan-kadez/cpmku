import {useLocation,useNavigate} from 'react-router-dom';
import {useAuth} from '../../context/AuthContext';
export default function Login(){const {login}=useAuth();
const nav=useNavigate();
const loc=useLocation();
const go=async()=>{try{await login();
nav(new URLSearchParams(loc.search).get('next')||'/')}catch(e){alert(e.message)}};
return <section className="auth-card"><h1>Masuk</h1><p>Gunakan akun Google untuk buyer. Akses seller dan admin diverifikasi sistem.</p><button className="button primary" onClick={go}>Lanjut dengan Google</button></section>}
