import {
  useEffect,
  useState
} from 'react';

import {
  useNavigate,
  useParams
} from 'react-router-dom';

import {
  doc,
  onSnapshot
} from 'firebase/firestore';

import {
  db
} from '../../services/firebase';

import {
  useAuth
} from '../../context/AuthContext';

import {
  useNotifications
} from '../../context/NotificationContext';

import {
  useOrder
} from '../../hooks/useOrder';

import {
  rupiah
} from '../../utils/format';

import SellerMini from '../../components/seller/SellerMini';

import Notice from '../../components/common/Notice';

import {
  toggleFavorite,
  useFavoriteIds
} from '../../hooks/useFavorites';

function getProductImages(
  product
) {
  if (
    Array.isArray(
      product?.images
    ) &&
    product.images.length > 0
  ) {
    return product.images
      .map(
        image =>
          typeof image ===
          'string'
            ? image
            : image?.url
      )
      .filter(Boolean);
  }

  if (
    product?.imageUrl
  ) {
    return [
      product.imageUrl
    ];
  }

  return [];
}

export default function ProductDetail() {
  const {
    id
  } = useParams();

  const [
    product,
    setProduct
  ] = useState(null);

  const [
    seller,
    setSeller
  ] = useState(null);

  const [
    selectedImage,
    setSelectedImage
  ] = useState(0);

  const {
    user
  } = useAuth();

  const {
    showToast
  } = useNotifications();

  const {
    createOrder,
    busy
  } = useOrder();

  const ids =
    useFavoriteIds(
      user?.uid
    );

  const nav =
    useNavigate();

  useEffect(() => {
    return onSnapshot(
      doc(
        db,
        'products',
        id
      ),
      snapshot => {
        if (
          snapshot.exists()
        ) {
          setProduct({
            id:
              snapshot.id,
            ...snapshot.data()
          });
        } else {
          setProduct(null);
        }
      },
      () => {
        setProduct(null);
      }
    );
  }, [
    id
  ]);

  useEffect(() => {
    if (
      !product?.sellerUid
    ) {
      setSeller(null);

      return undefined;
    }

    return onSnapshot(
      doc(
        db,
        'sellers',
        product.sellerUid
      ),
      snapshot => {
        if (
          snapshot.exists()
        ) {
          setSeller({
            uid:
              snapshot.id,
            ...snapshot.data()
          });
        } else {
          setSeller(null);
        }
      }
    );
  }, [
    product?.sellerUid
  ]);

  useEffect(() => {
    setSelectedImage(0);
  }, [
    product?.id
  ]);

  if (!product) {
    return (
      <div className="state">
        Produk tidak ditemukan
        atau tidak dapat
        diakses.
      </div>
    );
  }

  const images =
    getProductImages(
      product
    );

  const activeImage =
    images[
      selectedImage
    ] ||
    images[0] ||
    '';

  const buy =
    async () => {
      if (!user) {
        return nav(
          '/profile'
        );
      }

      try {
        if (
          product.status !==
            'available' ||
          Number(
            product.stock
          ) < 1
        ) {
          throw new Error(
            'Produk sedang tidak tersedia.'
          );
        }

        await createOrder(
          id
        );
      } catch (error) {
        showToast(
          'Pesanan gagal dibuat',
          error?.message ||
            'Terjadi kesalahan saat membuat pesanan.'
        );
      }
    };

  const fav =
    async () => {
      if (!user) {
        return nav(
          '/profile'
        );
      }

      try {
        await toggleFavorite(
          user.uid,
          product,
          ids.has(
            product.id
          )
        );
      } catch (error) {
        showToast(
          'Favorit gagal diperbarui',
          error?.message ||
            'Terjadi kesalahan.'
        );
      }
    };

  const previousImage =
    () => {
      if (
        images.length <= 1
      ) {
        return;
      }

      setSelectedImage(
        current =>
          current <= 0
            ? images.length - 1
            : current - 1
      );
    };

  const nextImage =
    () => {
      if (
        images.length <= 1
      ) {
        return;
      }

      setSelectedImage(
        current =>
          current >=
            images.length - 1
            ? 0
            : current + 1
      );
    };

  return (
    <article className="detail">
      <div>
        <div
          style={{
            position:
              'relative',
            width:
              '100%',
            borderRadius:
              '20px',
            overflow:
              'hidden',
            background:
              '#151515'
          }}
        >
          {activeImage ? (
            <img
              src={
                activeImage
              }
              alt={
                product.title
              }
              style={{
                display:
                  'block',
                width:
                  '100%',
                aspectRatio:
                  '1.2',
                objectFit:
                  'cover'
              }}
            />
          ) : (
            <div
              style={{
                width:
                  '100%',
                aspectRatio:
                  '1.2',
                display:
                  'grid',
                placeItems:
                  'center',
                color:
                  '#888',
                background:
                  '#222'
              }}
            >
              Foto tidak
              tersedia
            </div>
          )}

          {images.length >
            1 && (
            <>
              <button
                type="button"
                onClick={
                  previousImage
                }
                aria-label="Foto sebelumnya"
                style={{
                  position:
                    'absolute',
                  left:
                    '12px',
                  top:
                    '50%',
                  transform:
                    'translateY(-50%)',
                  width:
                    '42px',
                  height:
                    '42px',
                  borderRadius:
                    '50%',
                  border:
                    '1px solid rgba(255,255,255,.2)',
                  background:
                    'rgba(0,0,0,.6)',
                  color:
                    '#fff',
                  fontSize:
                    '22px'
                }}
              >
                ‹
              </button>

              <button
                type="button"
                onClick={
                  nextImage
                }
                aria-label="Foto berikutnya"
                style={{
                  position:
                    'absolute',
                  right:
                    '12px',
                  top:
                    '50%',
                  transform:
                    'translateY(-50%)',
                  width:
                    '42px',
                  height:
                    '42px',
                  borderRadius:
                    '50%',
                  border:
                    '1px solid rgba(255,255,255,.2)',
                  background:
                    'rgba(0,0,0,.6)',
                  color:
                    '#fff',
                  fontSize:
                    '22px'
                }}
              >
                ›
              </button>

              <span
                style={{
                  position:
                    'absolute',
                  right:
                    '12px',
                  bottom:
                    '12px',
                  padding:
                    '6px 10px',
                  borderRadius:
                    '999px',
                  background:
                    'rgba(0,0,0,.65)',
                  color:
                    '#fff',
                  fontSize:
                    '12px'
                }}
              >
                {
                  selectedImage +
                  1
                }{' '}
                /{' '}
                {
                  images.length
                }
              </span>
            </>
          )}
        </div>

        {images.length >
          1 && (
          <div
            style={{
              display:
                'grid',
              gridTemplateColumns:
                'repeat(7, minmax(0, 1fr))',
              gap:
                '8px',
              marginTop:
                '10px'
            }}
          >
            {images.map(
              (
                image,
                index
              ) => (
                <button
                  type="button"
                  key={`${image}-${index}`}
                  onClick={() =>
                    setSelectedImage(
                      index
                    )
                  }
                  aria-label={`Lihat foto ${
                    index + 1
                  }`}
                  style={{
                    padding:
                      '0',
                    border:
                      selectedImage ===
                      index
                        ? '2px solid #3b82f6'
                        : '2px solid transparent',
                    borderRadius:
                      '10px',
                    overflow:
                      'hidden',
                    background:
                      '#222',
                    opacity:
                      selectedImage ===
                      index
                        ? 1
                        : 0.65
                  }}
                >
                  <img
                    src={
                      image
                    }
                    alt={`${product.title} ${
                      index + 1
                    }`}
                    loading="lazy"
                    style={{
                      display:
                        'block',
                      width:
                        '100%',
                      aspectRatio:
                        '1 / 1',
                      objectFit:
                        'cover'
                    }}
                  />
                </button>
              )
            )}
          </div>
        )}
      </div>

      <div>
        <span className="muted">
          ID PRODUK:{' '}
          <b>
            {
              product.productId ||
              product.id
            }
          </b>
        </span>

        <h1>
          {
            product.title
          }
        </h1>

        <h2>
          {
            rupiah(
              product.price
            )
          }
        </h2>

        <p>
          {
            product.description
          }
        </p>

        <p>
          Stok:{' '}
          {
            product.stock
          }
        </p>

        {images.length >
          0 && (
          <p className="muted">
            {
              images.length
            }{' '}
            foto produk
          </p>
        )}

        <button
          className={`heart ${
            ids.has(
              product.id
            )
              ? 'saved'
              : ''
          }`}
          onClick={fav}
        >
          {ids.has(
            product.id
          )
            ? '♥ Favorited'
            : '♡ Add Favorite'}
        </button>

        <SellerMini
          seller={
            seller
          }
        />

        {product.status ===
          'in_transaction' && (
          <Notice type="warning">
            Produk sedang dalam
            transaksi. Silakan
            pilih produk lain.
          </Notice>
        )}

        {product.status ===
          'sold' && (
          <Notice type="warning">
            Produk sudah terjual.
          </Notice>
        )}

        {product.status ===
          'available' && (
          <button
            className="button primary"
            onClick={
              buy
            }
            disabled={
              busy ||
              Number(
                product.stock
              ) < 1
            }
          >
            {busy
              ? 'Memproses pesanan...'
              : 'Pesan'}
          </button>
        )}
      </div>
    </article>
  );
}
