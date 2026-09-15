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
    maintenanceMessage,
    setMaintenanceMessage
  ] = useState('');

  const [
    maintenanceTitle,
    setMaintenanceTitle
  ] = useState('');

  const [
    maintenanceMode,
    setMaintenanceMode
  ] = useState(false);

  const [
    loading,
    setLoading
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
    return onSnapshot(
      doc(
        db,
        'settings',
        'main'
      ),
      snapshot => {
        const data =
          snapshot.data() ||
          {};

        setQrisUrl(
          data.qrisUrl ||
          ''
        );

        setMaintenanceTitle(
          data.maintenanceTitle ||
          ''
        );

        setMaintenanceMessage(
          data.maintenanceMessage ||
          ''
        );

        setMaintenanceMode(
          Boolean(
            data.maintenanceMode
          )
        );
      },
      snapshotError => {
        setError(
          snapshotError.message ||
          'Gagal membaca settings.'
        );
      }
    );
  }, []);

  const save =
    async mode => {
      if (loading) {
        return;
      }

      try {
        setLoading(
          true
        );

        setError('');

        setNotice('');

        await api(
          '/admin/settings',
          {
            method:
              'PATCH',

            body:
              JSON.stringify({
                qrisUrl:
                  qrisUrl.trim(),

                maintenanceMode:
                  mode,

                maintenanceTitle:
                  maintenanceTitle.trim(),

                maintenanceMessage:
                  maintenanceMessage.trim()
              })
          }
        );

        setMaintenanceMode(
          mode
        );

        setNotice(
          mode
            ? 'Maintenance Mode aktif.'
            : 'Maintenance Mode dihentikan.'
        );
      } catch (
        saveError
      ) {
        setError(
          saveError?.message ||
          'Gagal menyimpan settings.'
        );
      } finally {
        setLoading(
          false
        );
      }
    };

  return (
    <section>
      <style>
        {`
          .cpmku-settings-card {
            padding: 24px;
            border: 1px solid rgba(255,255,255,.09);
            border-radius: 24px;
            background: rgba(20,20,20,.72);
          }

          .cpmku-settings-card label {
            display: grid;
            gap: 9px;
            margin-top: 18px;
            color: #a4afc2;
          }

          .cpmku-settings-card input,
          .cpmku-settings-card textarea {
            width: 100%;
            box-sizing: border-box;
            padding: 14px;
            border: 1px solid rgba(255,255,255,.12);
            border-radius: 14px;
            outline: none;
            background: rgba(8,12,20,.85);
            color: #fff;
            font: inherit;
          }

          .cpmku-settings-card textarea {
            min-height: 150px;
            resize: vertical;
          }

          .cpmku-mntc-status {
            margin-top: 15px;
            color: #8fa0b8;
          }

          .cpmku-mntc-buttons {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-top: 20px;
          }

          .cpmku-mntc-button {
            min-height: 50px;
            border: 1px solid rgba(55,119,255,.55);
            border-radius: 15px;
            background: linear-gradient(180deg,#1c3c78,#102a5b);
            color: #fff;
            font-size: 15px;
            font-weight: 700;
            cursor: pointer;
          }

          .cpmku-mntc-button:disabled {
            opacity: .55;
            cursor: not-allowed;
          }

          @media(max-width:600px) {
            .cpmku-mntc-buttons {
              grid-template-columns: 1fr;
            }
          }
        `}
      </style>

      <div className="section-head">
        <div>
          <span className="admin-eyebrow">
            CPMKU
          </span>

          <h2>
            Settings
          </h2>
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

      <div className="cpmku-settings-card">
        <h3>
          Pembayaran
        </h3>

        <label>
          URL QRIS

          <input
            type="url"
            value={
              qrisUrl
            }
            onChange={event =>
              setQrisUrl(
                event.target.value
              )
            }
            disabled={
              loading
            }
            placeholder="https://..."
          />
        </label>

        <h3
          style={{
            marginTop:
              30
          }}
        >
          Maintenance
        </h3>

        <p>
          Masukkan teks yang
          akan ditampilkan ketika
          CPMKU berada dalam
          maintenance.
        </p>

        <label>
          Teks Maintenance

          <textarea
            value={
              maintenanceMessage
            }
            onChange={event =>
              setMaintenanceMessage(
                event.target.value
              )
            }
            disabled={
              loading
            }
            placeholder="CPMKU sedang dalam pemeliharaan..."
          />
        </label>

        <div className="cpmku-mntc-status">
          Status saat ini:{" "}
          <strong>
            {maintenanceMode
              ? 'START MNTC'
              : 'STOP MNTC'}
          </strong>
        </div>

        <div className="cpmku-mntc-buttons">
          <button
            type="button"
            className="cpmku-mntc-button"
            onClick={() =>
              save(false)
            }
            disabled={
              loading
            }
          >
            {loading
              ? 'Memproses...'
              : 'STOP MNTC'}
          </button>

          <button
            type="button"
            className="cpmku-mntc-button"
            onClick={() =>
              save(true)
            }
            disabled={
              loading
            }
          >
            {loading
              ? 'Memproses...'
              : 'START MNTC'}
          </button>
        </div>
      </div>
    </section>
  );
}
