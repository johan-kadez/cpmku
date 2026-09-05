import {useEffect,useState} from 'react';
import {listenProducts} from '../services/marketplace';
export function useProducts(){const [products,setProducts]=useState([]);
const [error,setError]=useState('');
useEffect(()=>listenProducts((rows,e)=>{setProducts(rows);
if(e)setError(e.message||'Gagal memuat produk.')}),[]);
return {products,error};
}
