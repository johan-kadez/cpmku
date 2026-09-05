import Header from './Header';
import Footer from './Footer';
import {Outlet} from 'react-router-dom';
export default function AppLayout(){return <><Header/><main className="container"><Outlet/></main><Footer/></>}
