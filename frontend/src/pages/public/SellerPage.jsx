import {useEffect,useState} from 'react';
import {useParams} from 'react-router-dom';
import {doc,onSnapshot,collection,query,where} from 'firebase/firestore';
import {db} from '../../services/firebase';
import Avatar from '../../components/common/Avatar';
import ProductGrid from '../../components/product/ProductGrid';
export default function SellerPage(){const {uid}=useParams();
const [seller,setSeller]=useState(null);
const [products,setProducts]=useState([]);
useEffect(()=>onSnapshot(doc(db,'sellers',uid),s=>setSeller(s.exists()?s.data():null)),[uid]);
useEffect(()=>onSnapshot(query(collection(db,'products'),where('sellerUid','==',uid),where('visibility','==','public'),where('status','==','available')),s=>setProducts(s.docs.map(d=>({id:d.id,...d.data()})))),[uid]);
if(!seller)return <div className="state">Seller tidak ditemukan.</div>;
return <><section className="seller-profile"><Avatar src={seller.photoUrl} name={seller.name}/><div><h1>{seller.name}</h1><p>{seller.description}</p></div></section><h2>Produk Seller</h2><ProductGrid products={products}/></>}
