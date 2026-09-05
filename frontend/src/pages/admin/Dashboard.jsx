import {useEffect,useState} from 'react';
import {api} from '../../services/api';
export default function Dashboard(){const [data,setData]=useState(null);
useEffect(()=>{api('/admin/dashboard').then(setData).catch(e=>setData({error:e.message}))},[]);
return <section className="stats">{data?.error?<div className="notice error">{data.error}</div>:data?<>{Object.entries(data.stats).map(([k,v])=><div className="stat" key={k}><span>{k}</span><b>{v}</b></div>)}</>:<div className="state">Memuat...</div>}</section>}
