import {
  Link
} from 'react-router-dom';

import {
  useAuth
} from '../../context/AuthContext';

import {
  toggleFavorite,
  useFavoriteIds
} from '../../hooks/useFavorites';

import {
  rupiah
} from '../../utils/format';

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
          typeof image === 'string'
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

export default function ProductCard({
  product
}) {
  const {
    user
  } = useAuth();

  const ids =
    useFavoriteIds(
      user?.uid
    );

  const saved =
    ids.has(
      product.id
    );

  const images =
    getProductImages(
      product
    );

  const cover =
    images[0] || '';

  const fav =
    async event => {
      event.preventDefault();

      if (!user) {
        return alert(
          'Silakan Sign In terlebih dahulu.'
        );
      }

      try {
        await toggleFavorite(
          user.uid,
          product,
          saved
        );
      } catch (error) {
        alert(
          error.message
        );
      }
    };

  return (
    <article className="product-card">
      <Link
        to={`/products/${product.id}`}
      >
        {cover ? (
          <img
            src={cover}
            alt={product.title}
            loading="lazy"
          />
        ) : (
          <div
            style={{
              width: '100%',
              aspectRatio: '1.15',
              display: 'grid',
              placeItems: 'center',
              background: '#222',
              color: '#888'
            }}
          >
            Foto tidak tersedia
          </div>
        )}
      </Link>

      <div className="product-body">
        <div className="card-row">
          <span className="badge">
            {
              product.status ===
              'in_transaction'
                ? 'Ordered'
                : product.status ===
                    'sold'
                  ? 'Sold'
                  : `Stock ${product.stock}`
            }
          </span>

          <button
            className={`heart ${
              saved
                ? 'saved'
                : ''
            }`}
            onClick={fav}
            aria-label="Favorite"
          >
            ♥
          </button>
        </div>

        <h3>
          {
            product.title
          }
        </h3>

        <strong>
          {
            rupiah(
              product.price
            )
          }
        </strong>

        <p className="muted">
          {
            product.sellerName ||
            'Seller'
          }
        </p>

        {images.length >
          1 && (
          <p className="muted">
            {images.length} foto
          </p>
        )}

        <Link
          className="button"
          to={`/products/${product.id}`}
        >
          Lihat
        </Link>
      </div>
    </article>
  );
}
