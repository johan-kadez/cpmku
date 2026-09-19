import {
  useEffect,
  useState
} from 'react';

import {
  api
} from '../../services/api';

const labels = {
  users: 'Users',
  sellers: 'Seller',
  products: 'Products',
  orders: 'Orders',
  payments: 'Payments',
  rooms: 'Rooms'
};

export default function Dashboard() {
  const [
    data,
    setData
  ] = useState(null);

  useEffect(() => {
    api('/admin/dashboard')
      .then(setData)
      .catch((error) =>
        setData({
          error:
            error.message
        })
      );
  }, []);

  if (data?.error) {
    return (
      <section className="stats">
        <div className="notice error">
          {data.error}
        </div>
      </section>
    );
  }

  if (!data) {
    return (
      <section className="stats">
        <div className="state">
          Memuat...
        </div>
      </section>
    );
  }

  return (
    <section className="stats">
      {Object.entries(
        data.stats || {}
      ).map(
        ([key, value]) => (
          <div
            className="stat"
            key={key}
          >
            <span>
              {labels[key] || key}
            </span>

            <b>
              {value}
            </b>
          </div>
        )
      )}
    </section>
  );
}
