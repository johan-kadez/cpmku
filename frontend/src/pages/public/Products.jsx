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
        <>
          <style>{`
            .cpmku-pagination {
              display: flex;
              justify-content: center;
              align-items: center;
              gap: 10px;
              margin-top: 50px;
              margin-bottom: 50px;
              flex-wrap: wrap;
            }
            .cpmku-page-btn {
              min-width: 44px;
              min-height: 44px;
              padding: 10px 16px;
              border: 1px solid rgba(55, 119, 255, 0.4);
              border-radius: 14px;
              background: linear-gradient(180deg, #172d59, #10224a);
              color: #fff;
              font-size: 14px;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.2s ease;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            }
            .cpmku-page-btn:hover:not(:disabled) {
              border-color: rgba(80, 145, 255, 0.8);
              transform: translateY(-2px);
              box-shadow: 0 6px 16px rgba(55, 119, 255, 0.3);
            }
            .cpmku-page-btn:disabled {
              opacity: 0.4;
              cursor: not-allowed;
              transform: none;
            }
            .cpmku-page-btn-active {
              background: linear-gradient(180deg, #2a5298, #1e3c72);
              border-color: rgba(80, 145, 255, 0.9);
              box-shadow: 0 0 15px rgba(55, 119, 255, 0.5), inset 0 1px 0 rgba(255,255,255,0.1);
              font-weight: 700;
            }
            .cpmku-page-btn-nav {
              padding: 10px 20px;
              font-weight: 700;
            }
          `}</style>

          <div className="cpmku-pagination">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="cpmku-page-btn cpmku-page-btn-nav"
            >
              ← Prev
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
              <button
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                className={`cpmku-page-btn ${currentPage === pageNum ? 'cpmku-page-btn-active' : ''}`}
              >
                {pageNum}
              </button>
            ))}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="cpmku-page-btn cpmku-page-btn-nav"
            >
              Next →
            </button>
          </div>
        </>
      )}
    </section>
  );
}
