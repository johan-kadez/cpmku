import ProductCard from './ProductCard';
export default function ProductGrid({products}){return <div className="grid">{products.length?products.map(p=><ProductCard key={p.id} product={p}/>):<div className="state">Belum ada produk yang tersedia.</div>}</div>}
