import { useAuth } from '../../context/AuthContext';
import { useFavorites } from '../../hooks/useFavorites';
import ProductGrid from '../../components/product/ProductGrid';

export default function Favorites() {
const { user } = useAuth();

const {
items,
error
} = useFavorites(
user?.uid
);

const products = items.map(item => ({
id: item.productId || item.id,
title: item.title || '',
imageUrl: item.imageUrl || '',
price: Number(item.price) || 0,
sellerUid: item.sellerUid || '',
stock: item.stock ?? 1,
status: item.status || 'active',
sellerName: item.sellerName || 'Seller',
description: item.description || '',
images: item.images || []
}));

return (
<section>
<div className="section-head">
<div>
<span className="eyebrow">
FAVORITE
</span>

      <h1>
        Produk Favorite
      </h1>
    </div>
  </div>

  {error && (
    <div className="notice error">
      {error}
    </div>
  )}

  {!error && products.length === 0 ? (
    <div className="state">
      Belum ada produk yang kamu favorite.
    </div>
  ) : (
    <ProductGrid
      products={products}
    />
  )}
</section>

);
}
