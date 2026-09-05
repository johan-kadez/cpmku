import { firebaseConfigError } from '../../services/firebase';

export default function FirebaseSetup() {
  return (
    <div className="fatal-state">
      <span className="eyebrow">JOHAN MARKETPLACE</span>
      <h1>Firebase belum dikonfigurasi</h1>
      <p>{firebaseConfigError}</p>
      <div className="setup-list">
        <strong>Perbaikan di Vercel:</strong>
        <ol>
          <li>Project Settings → Environment Variables.</li>
          <li>Tambahkan semua VITE_FIREBASE_* dari Firebase Web App.</li>
          <li>Pastikan Root Directory adalah <code>frontend</code> jika deploy frontend terpisah.</li>
          <li>Redeploy project.</li>
        </ol>
      </div>
    </div>
  );
}
