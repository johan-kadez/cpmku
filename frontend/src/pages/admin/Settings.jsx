import {
  useEffect,
  useState
} from 'react';

import {
  doc,
  onSnapshot
} from 'firebase/firestore';

import {
  db
} from '../../services/firebase';

import {
  api
} from '../../services/api';

export default function Settings() {
  const [
    qrisUrl,
    setQrisUrl
  ] = useState('');

  const [
    maintenanceMode,
    setMaintenanceMode
  ] = useState(false);

  const [
    maintenanceTitle,
    setMaintenanceTitle
  ] = useState('');

  const [
    maintenanceMessage,
    setMaintenanceMessage
  ] = useState('');

  const [
    busy,
    setBusy
  ] = useState(false);

  const [
    error,
    setError
  ] = useState('');

  const [
    notice,
    setNotice
  ] = useState('');

  useEffect(() => {
    const unsubscribe =
      onSnapshot(
        doc(
          db,
          'settings',
          'main'
        ),
        (snapshot) => {
          const data =
            snapshot.data() || {};

          setQrisUrl(
            data.qrisUrl || ''
          );

          setMaintenanceMode(
            Boolean(
              data.maintenanceMode
            )
          );

          setMaintenanceTitle(
            data.maintenanceTitle ||
              ''
          );

          setMaintenanceMessage(
            data.maintenanceMessage ||
              ''
          );
        },
        (snapshotError) => {
          setError(
            snapshotError.message ||
              'Gagal membaca settings.'
          );
        }
      );

    return unsubscribe;
  }, []);

  const save = async (
    event
  ) => {
    event.preventDefault();

    if (busy) {
      return;
    }

    setBusy(true);
    setError('');
    setNotice('');

    try {
      await api(
        '/admin/settings',
        {
          method: 'PATCH',
          body: JSON.stringify({
            qrisUrl:
              qrisUrl.trim(),

            maintenanceMode,

            maintenanceTitle:
              maintenanceTitle.trim(),

            maintenanceMessage:
              maintenanceMessage.trim()
          })
        }
      );

      setNotice(
        'Settings berhasil disimpan.'
      );
    } catch (e) {
      setError(
        e.message ||
          'Settings gagal disimpan.'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <section>
      <div className="section-head">
        <div>
          <span className="admin-eyebrow">
            CPMKU
          </span>

          <h2>
            Settings
          </h2>

          <p>
            Atur konfigurasi
            marketplace dan
            maintenance mode.
          </p>
        </div>
      </div>

      {error && (
        <div className="notice error">
          {error}
        </div>
      )}

      {notice && (
        <div className="notice success">
          {notice}
        </div>
      )}

      <form
        className="form-card"
        onSubmit={save}
      >
        <div>
          <h3>
            Pembayaran
          </h3>

          <p>
            Masukkan URL QRIS yang
            digunakan untuk
            pembayaran CPMKU.
          </p>
        </div>

        <label>
          URL QRIS

          <input
            type="url"
            value={qrisUrl}
            onChange={(event) => {
              setQrisUrl(
                event.target.value
              );
            }}
            placeholder="https://..."
            disabled={busy}
          />
        </label>

        <div>
          <h3>
            Maintenance
          </h3>

          <p>
            Aktifkan maintenance
            mode ketika marketplace
            sedang dalam pemeliharaan.
          </p>
        </div>

        <label className="check">
          <input
            type="checkbox"
            checked={maintenanceMode}
            onChange={(event) => {
              setMaintenanceMode(
                event.target.checked
              );
            }}
            disabled={busy}
          />

          <span>
            Maintenance Mode
          </span>
        </label>

        <label>
          Judul Maintenance

          <input
            type="text"
            value={maintenanceTitle}
            onChange={(event) => {
              setMaintenanceTitle(
                event.target.value
              );
            }}
            placeholder="CPMKU sedang dalam pemeliharaan"
            disabled={busy}
          />
        </label>

        <label>
          Pesan Maintenance

          <textarea
            value={maintenanceMessage}
            onChange={(event) => {
              setMaintenanceMessage(
                event.target.value
              );
            }}
            placeholder="Kami sedang melakukan pemeliharaan sistem. Silakan kembali beberapa saat lagi."
            rows={5}
            disabled={busy}
          />
        </label>

        {maintenanceMode && (
          <div className="notice">
            Maintenance Mode sedang
            aktif. Pastikan judul dan
            pesan maintenance sudah
            sesuai sebelum menyimpan.
          </div>
        )}

        <div>
          <button
            type="submit"
            className="button primary"
            disabled={busy}
          >
            {busy
              ? 'Menyimpan...'
              : 'Simpan Settings'}
          </button>
        </div>
      </form>
    </section>
  );
}
