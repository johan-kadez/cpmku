import { useEffect, useState } from 'react';
import { api } from '../../services/api';

const ACTIONS = {
sellers: [
['approved', 'Approve'],
['rejected', 'Reject']
],
products: [
['approved', 'Approve'],
['rejected', 'Reject']
],
orders: [
['cancelled', 'Batalkan']
],
payments: [
['verified', 'Verifikasi'],
['rejected', 'Tolak']
]
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

```
  const response = await api(
    `/admin/${type}`
  );

  setRows(
    response.items || []
  );
} catch (e) {
  setError(
    e.message ||
      'Gagal memuat data.'
  );
} finally {
  setLoading(false);
}
```

};

useEffect(() => {
load();
}, [type]);

const action = async (
id,
status
) => {
const actionLabel =
status === 'approved'
? 'menyetujui'
: status === 'rejected'
? 'menolak'
: 'melanjutkan';

```
if (
  !window.confirm(
    `Yakin ingin ${actionLabel} data ini?`
  )
) {
  return;
}

try {
  setProcessing(id);
  setError('');

  await api(
    `/admin/${type}/${id}`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        status
      })
    }
  );

  await load();
} catch (e) {
  const message =
    e.message ||
    'Gagal memproses data.';

  setError(message);
  alert(message);
} finally {
  setProcessing('');
}
```

};

return ( <section> <div className="section-head"> <h2>{title}</h2>

```
    <button
      type="button"
      onClick={load}
      disabled={loading}
    >
      {loading
        ? 'Memuat...'
        : 'Refresh'}
    </button>
  </div>

  {error && (
    <div className="notice error">
      {error}
    </div>
  )}

  <div className="admin-table">
    {type === 'sellers' &&
      rows.map(r => (
        <article
          key={r.id}
          className="seller-application"
        >
          <div className="seller-application-header">
            {r.photoUrl && (
              <img
                src={r.photoUrl}
                alt={r.name || 'Foto pemohon'}
                className="seller-application-photo"
              />
            )}

            <div>
              <b>
                {r.name ||
                  'Tanpa nama'}
              </b>

              <span>
                Status: {r.status || 'pending'}
              </span>
            </div>
          </div>

          <div className="seller-application-details">
            <div>
              <strong>
                Nama Lengkap
              </strong>

              <span>
                {r.name || '-'}
              </span>
            </div>

            <div>
              <strong>
                Nomor WhatsApp
              </strong>

              <span>
                {r.phone || '-'}
              </span>
            </div>

            <div>
              <strong>
                Email
              </strong>

              <span>
                {r.email || '-'}
              </span>
            </div>

            <div>
              <strong>
                Tujuan Menjadi Seller
              </strong>

              <span>
                {r.reason || '-'}
              </span>
            </div>
          </div>

          <div className="seller-application-actions">
            {(ACTIONS[type] || []).map(
              ([status, label]) => (
                <button
                  key={status}
                  type="button"
                  onClick={() =>
                    action(
                      r.id,
                      status
                    )
                  }
                  disabled={
                    processing === r.id ||
                    r.status ===
                      status
                  }
                >
                  {processing === r.id
                    ? 'Memproses...'
                    : label}
                </button>
              )
            )}
          </div>
        </article>
      ))}

    {type !== 'sellers' &&
      rows.map(r => (
        <article key={r.id}>
          <b>
            {r.name ||
              r.title ||
              r.productId ||
              r.orderId ||
              r.id}
          </b>

          <span>
            {r.status}
          </span>

          <div>
            {(ACTIONS[type] || []).map(
              ([status, label]) => (
                <button
                  key={status}
                  type="button"
                  onClick={() =>
                    action(
                      r.id,
                      status
                    )
                  }
                  disabled={
                    processing === r.id
                  }
                >
                  {processing === r.id
                    ? 'Memproses...'
                    : label}
                </button>
              )
            )}
          </div>
        </article>
      ))}

    {!loading &&
      !rows.length &&
      !error && (
        <div className="state">
          Tidak ada data.
        </div>
      )}
  </div>
</section>
```

);
}
