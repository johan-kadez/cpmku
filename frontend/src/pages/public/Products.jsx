import { useMemo, useState } from 'react';
import { useProducts } from '../../hooks/useProducts';
import ProductGrid from '../../components/product/ProductGrid';

const PRODUCTS_PER_PAGE = 8;

export default function Products() {
  const { products, error } = useProducts();
  const [q, setQ] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const filtered = useMemo(
    () =>
      products.filter(p =>
        `${p.title} ${p.description}`.toLowerCase().includes(q.toLowerCase())
      ),
    [products, q]
  );

  const totalPages = Math.ceil(filtered.length / PRODUCTS_PER_PAGE);

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
    const endIndex = startIndex + PRODUCTS_PER_PAGE;
    return filtered.slice(startIndex, endIndex);
  }, [filtered, currentPage]);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearchChange = (e) => {
    setQ(e.target.value);
    setCurrentPage(1);
  };

  return (
    <section>
      <div className="section-head">
        <div>
          <span className="eyebrow">MARKETPLACE</span>
          <h1>Semua Produk</h1>
        </div>
        <input
          value={q}
          onChange={handleSearchChange}
          placeholder="Cari produk..."
        />
      </div>

      {error && <div className="notice error">{error}</div>}

      <ProductGrid products={paginatedProducts} />

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '40px', marginBottom: '40px', flexWrap: 'wrap' }}>
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="cpmku-admin-button"
            style={{ opacity: currentPage === 1 ? 0.5 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
          >
            Previous
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
            <button
              key={pageNum}
              onClick={() => handlePageChange(pageNum)}
              className={`cpmku-admin-button ${currentPage === pageNum ? 'cpmku-admin-edit' : ''}`}
              style={{
                fontWeight: currentPage === pageNum ? 'bold' : 'normal',
                minWidth: '42px'
              }}
            >
              {pageNum}
            </button>
          ))}

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="cpmku-admin-button"
            style={{ opacity: currentPage === totalPages ? 0.5 : 1, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
          >
            Next
          </button>
        </div>
      )}
    </section>
  );
}
