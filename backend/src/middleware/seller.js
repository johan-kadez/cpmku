import {db} from '../firebase/admin.js';
import {HttpError} from '../utils/errors.js';
export async function requireSeller(req,res,next){const s=await db.collection('sellers').doc(req.user.uid).get();
if(!s.exists||s.data().status!=='approved')throw new HttpError(403,'Akun seller belum disetujui.');
if(s.data().banned===true)throw new HttpError(403,'Akun seller diblokir admin.');
req.seller=s.data();
return next()}
