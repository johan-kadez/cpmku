import { useEffect, useState } from 'react';
import { api } from '../../services/api';

const ACTIONS = {
sellers: [['approved', 'Approve'], ['rejected', 'Reject']],
products: [['approved', 'Approve'], ['rejected', 'Reject']],
orders: [['cancelled', 'Batalkan']],
payments: [['verified', 'Verifikasi'], ['rejected', 'Tolak']]
};

export default function Manage({ type, title }) {
const [rows, setRows] = useState([]);
const [error, setError] = useState('');
const [loading, setLoading] = useState(true);
const [processing, setProcessing] = useState('');

const load = async () => {
try {
setLoading(true);
setError('');

  const response = await api(`/admin/${type}`);
  setRows(response.items || []);
} catch (error) {
  setError(error.message || 'Gagal memuat data.');
} finally {
  setLoading(false);
}

};

useEffect(() => {
load();
}, [type]);

const action = async (id, status) => {
let message = 'Yakin ingin memproses data ini?';

if (status === 'approved') {
  message = 'Yakin ingin menyetujui pengajuan ini?';
}

if (status === 'rejected') {
  message = 'Yakin ingin menolak pengajuan ini?';
}

if (status === 'cancelled') {
  message = 'Yakin ingin membatalkan transaksi ini?';
}

if (!window.confirm(message)) {
  return;
}

try {
  setProcessing(id);
  setError('');

  await api(`/admin/${type}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });

  await load();
} catch (error) {
  const message = error.message || 'Gagal memproses data.';
  setError(message);
  alert(message);
} finally {
  setProcessing('');
}

};

return (
<section>
<div className="section-head">
<h2>{title}</h2>

    <button
      type="button"
      onClick={load}
      disabled={loading}
    >
      {loading ? 'Memuat...' : 'Refresh'}
    </button>
  </div>

  {error && (
    <div className="notice error">{error}</div>
  )}

  <div className="admin-table">
    {type === 'sellers' &&
      rows.map(row => (
        <article
          key={row.id}
          className="seller-application"
        >
          <div className="seller-application-header">
            {row.photoUrl && (
              <img
                src={row.photoUrl}
                alt={row.name || 'Foto pemohon'}
                className="seller-application-photo"
              />
            )}

            <div className="seller-application-title">
              <b>{row.name || 'Tanpa nama'}</b>
              <span>
                Status: {row.status || 'pending'}
              </span>
            </div>
          </div>

          <div className="seller-application-details">
            <div>
              <strong>Nama Lengkap</strong>
              <span>{row.name || '-'}</span>
            </div>

            <div>
              <strong>Nomor WhatsApp</strong>
              <span>{row.phone || '-'}</span>
            </div>

            <div>
              <strong>Email</strong>
              <span>{row.email || '-'}</span>
            </div>

            <div>
              <strong>Tujuan Menjadi Seller</strong>
              <span>{row.reason || '-'}</span>
            </div>
          </div>

          {row.status === 'pending' && (
            <div className="seller-application-actions">
              {(ACTIONS.sellers || []).map(([status, label]) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => action(row.id, status)}
                  disabled={processing === row.id}
                >
                  {processing === row.id
                    ? 'Memproses...'
                    : label}
                </button>
              ))}
            </div>
          )}
        </article>
      ))}

    {type !== 'sellers' &&
      rows.map(row => (
        <article key={row.id}>
          <b>
            {row.name ||
              row.title ||
              row.productId ||
              row.orderId ||
              row.id}
          </b>

          <span>{row.status || '-'}</span>

          <div>
            {(ACTIONS[type] || []).map(([status, label]) => (
              <button
                key={status}
                type="button"
                onClick={() => action(row.id, status)}
                disabled={processing === row.id}
              >
                {processing === row.id
                  ? 'Memproses...'
                  : label}
              </button>
            ))}
          </div>
        </article>
      ))}

    {!loading &&
      rows.length === 0 &&
      !error && (
        <div className="state">
          Tidak ada data.
        </div>
      )}
  </div>
</section>

);
}
