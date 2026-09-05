import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { api } from '../../services/api';

export default function Settings() {
  const [qrisUrl, setQrisUrl] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => onSnapshot(doc(db, 'settings', 'main'), snap => {
    if (snap.exists()) setQrisUrl(snap.data().qrisUrl || '');
  }), []);

  const save = async e => {
    e.preventDefault();
    setBusy(true);
    try {
      await api('/admin/settings', {
        method: 'PATCH',
        body: JSON.stringify({ qrisUrl })
      });
      alert('Settings tersimpan.');
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="form-card" onSubmit={save}>
      <h2>QRIS Utama</h2>
      <label>
        URL QRIS
        <input type="url" required value={qrisUrl} onChange={e => setQrisUrl(e.target.value)} />
      </label>
      <button className="button primary" disabled={busy}>{busy ? 'Menyimpan...' : 'Simpan'}</button>
    </form>
  );
}
