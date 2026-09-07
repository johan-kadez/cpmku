import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Header() {
  const { user, role } = useAuth();

  return (
    <header className="header">
      <Link className="brand" to="/">
        CPMKU<span>MARKETPLACE</span>
      </Link>
      
      <Link className="profile-pill" to="/profile">
        {user?.photoURL ? (
          <img src={user.photoURL} alt="" />
        ) : (
          '◎'
        )}
        <span>{user ? 'Profile' : 'Masuk'}</span>
      </Link>
    </header>
  );
}
