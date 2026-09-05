import {env} from '../config/env.js';
import {db,FieldValue} from '../firebase/admin.js';
export async function currentUser(user){const seller=await db.collection('sellers').doc(user.uid).get();
let role='buyer';
if(env.adminEmails.includes((user.email||'').toLowerCase()))role='admin';
else if(seller.exists&&seller.data().status==='approved')role='seller';
return {uid:user.uid,email:user.email||'',name:user.name||user.email?.split('@')[0]||'User',role}}
