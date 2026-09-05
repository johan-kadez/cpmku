import {auth} from './firebase';
const base=import.meta.env.VITE_API_BASE_URL||'/api';
export async function api(path,options={}){const token=auth.currentUser?await auth.currentUser.getIdToken():null;const res=await fetch(`${base}${path}`,{...options,headers:{'Content-Type':'application/json',...(options.headers||{}),...(token?{Authorization:`Bearer ${token}`}:{})}});let data={};try{data=await res.json()}catch{}if(!res.ok)throw new Error(data.error||`Request gagal (${res.status})`);return data;}
