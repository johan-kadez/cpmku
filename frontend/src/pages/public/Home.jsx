import {
  useEffect,
  useMemo,
  useState
} from 'react';

import {
  Link
} from 'react-router-dom';

import {
  collection,
  onSnapshot,
  query,
  where
} from 'firebase/firestore';

import {
  useProducts
} from '../../hooks/useProducts';

import {
  db
} from '../../services/firebase';

import ProductGrid from '../../components/product/ProductGrid';

import Avatar from '../../components/common/Avatar';

function SellerSearchCard({
  seller
}) {
  return (
    <article className="cpmku-home-seller-card">
      <div className="cpmku-home-seller-top">
        <Avatar
          src={seller.photoUrl}
          name={seller.name}
        />

        <div className="cpmku-home-seller-info">
          <div className="cpmku-home-seller-name">
            {seller.name || 'Seller'}
          </div>
        </div>
      </div>

      <div className="cpmku-home-seller-actions">
        <Link
          to={`/seller/${seller.uid}`}
          className="cpmku-home-seller-button"
        >
          Lihat seller
        </Link>
      </div>
    </article>
  );
}

export default function Home() {
  const {
    products,
    error
  } = useProducts();

  const [
    sellers,
    setSellers
  ] = useState([]);

  const [
    sellerError,
    setSellerError
  ] = useState('');

  const [
    q,
    setQ
  ] = useState('');

  useEffect(() => {
    const sellersQuery = query(
      collection(db, 'sellers'),
      where('status', '==', 'approved')
    );

    const unsubscribe = onSnapshot(
      sellersQuery,
      snapshot => {
        const rows = snapshot.docs
          .map(doc => ({
            uid: doc.id,
            ...doc.data()
          }))
          .filter(
            seller =>
              seller.banned !== true
          );

        setSellers(rows);
        setSellerError('');
      },
      snapshotError => {
        setSellerError(
          snapshotError?.message ||
          'Gagal memuat seller.'
        );
      }
    );

    return unsubscribe;
  }, []);

  const searchText = q
    .trim()
    .toLowerCase();

  const filteredProducts = useMemo(
    () => {
      if (!searchText) {
        return products.slice(0, 8);
      }

      return products
        .filter(product => {
          const searchable = [
            product.title,
            product.category,
            product.description,
            product.sellerName
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();

          return searchable.includes(
            searchText
          );
        })
        .slice(0, 8);
    },
    [
      products,
      searchText
    ]
  );

  const filteredSellers = useMemo(
    () => {
      if (!searchText) {
        return [];
      }

      return sellers
        .filter(seller => {
          const name = String(
            seller.name ||
            seller.displayName ||
            ''
          )
            .toLowerCase()
            .trim();

          return name.includes(
            searchText
          );
        })
        .slice(0, 8);
    },
    [
      sellers,
      searchText
    ]
  );

  const isSearching =
    Boolean(searchText);

  return (
    <>
      <style>
        {`
          .cpmku-home-seller-section {
            margin-top: 34px;
          }

          .cpmku-home-seller-list {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 16px;
          }

          .cpmku-home-seller-card {
            min-width: 0;
            box-sizing: border-box;
            padding: 20px;
            border: 1px solid rgba(255,255,255,.09);
            border-radius: 22px;
            background: rgba(20,20,20,.72);
            box-shadow:
              inset 0 1px 0 rgba(255,255,255,.03),
              0 12px 35px rgba(0,0,0,.16);
          }

          .cpmku-home-seller-top {
            display: flex;
            align-items: center;
            gap: 14px;
            min-width: 0;
          }

          .cpmku-home-seller-top .avatar {
            flex: 0 0 auto;
            width: 58px;
            height: 58px;
            object-fit: cover;
            border-radius: 18px;
            border: 1px solid rgba(65,125,255,.4);
            background: rgba(24,35,57,.8);
          }

          .cpmku-home-seller-info {
            min-width: 0;
          }

          .cpmku-home-seller-name {
            overflow: hidden;
            color: #fff;
            font-size: 17px;
            font-weight: 700;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .cpmku-home-seller-actions {
            display: flex;
            margin-top: 18px;
          }

          .cpmku-home-seller-button {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            min-height: 42px;
            box-sizing: border-box;
            padding: 9px 15px;
            border: 1px solid rgba(55,119,255,.5);
            border-radius: 13px;
            background: linear-gradient(
              180deg,
              #172d59,
              #10224a
            );
            color: #fff;
            font-size: 13px;
            font-weight: 600;
            text-decoration: none;
            transition:
              border-color .2s ease,
              transform .2s ease,
              background .2s ease;
          }

          .cpmku-home-seller-button:hover {
            border-color: rgba(90,150,255,.8);
            background: linear-gradient(
              180deg,
              #193b7b,
              #122b5d
            );
            transform: translateY(-1px);
          }

          .cpmku-home-search-empty {
            padding: 24px;
            border: 1px solid rgba(255,255,255,.07);
            border-radius: 18px;
            background: rgba(255,255,255,.025);
            color: #8995aa;
            text-align: center;
          }

          @media(max-width:760px) {
            .cpmku-home-seller-list {
              grid-template-columns: 1fr;
            }
          }
        `}
      </style>

      <section className="hero">
        <h1>Welcome To Cpmku</h1>

        <p>
          Pilih produk, buka transaksi, bayar melalui QRIS utama,
          lalu tunggu verifikasi admin.
        </p>

        <Link
          className="button primary"
          to="/products"
        >
          Lihat Produk
        </Link>
      </section>

      <section>
        <div className="section-head">
          <div>
            <h2>
              {isSearching
                ? 'Hasil pencarian'
                : 'Produk tersedia'}
            </h2>
          </div>

          <input
            value={q}
            onChange={event =>
              setQ(
                event.target.value
              )
            }
            placeholder="Ketik Disini..."
          />
        </div>

        {error && (
          <div className="notice error">
            {error}
          </div>
        )}

        {sellerError && (
          <div className="notice error">
            {sellerError}
          </div>
        )}

        {isSearching &&
          filteredSellers.length > 0 && (
            <section className="cpmku-home-seller-section">
              <div className="section-head">
                <div>
                  <span className="eyebrow">
                    SELLER
                  </span>

                  <h2>
                    Seller ditemukan
                  </h2>
                </div>
              </div>

              <div className="cpmku-home-seller-list">
                {filteredSellers.map(
                  seller => (
                    <SellerSearchCard
                      key={seller.uid}
                      seller={seller}
                    />
                  )
                )}
              </div>
            </section>
          )}

        <section
          className={
            isSearching &&
            filteredSellers.length > 0
              ? 'cpmku-home-seller-section'
              : ''
          }
        >
          <div className="section-head">
            <div>
              {isSearching && (
                <span className="eyebrow">
                  PRODUK
                </span>
              )}

              <h2>
                {isSearching
                  ? 'Produk ditemukan'
                  : 'Produk tersedia'}
              </h2>
            </div>
          </div>

          <ProductGrid
            products={
              filteredProducts
            }
          />
        </section>

        {isSearching &&
          filteredSellers.length === 0 &&
          filteredProducts.length === 0 && (
            <div className="cpmku-home-search-empty">
              Tidak ada yang cocok dengan pencarian.
            </div>
          )}

        {!isSearching &&
          products.length > 8 && (
            <p className="center">
              <Link
                className="button"
                to="/products"
              >
                Lihat semua produk
              </Link>
            </p>
          )}
      </section>
    </>
  );
}
