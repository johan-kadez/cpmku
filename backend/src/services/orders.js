import { db, FieldValue, auth } from '../firebase/admin.js';
import { env } from '../config/env.js';
import { HttpError } from '../utils/errors.js';
async function adminUids(){ const out=[];
 for(const email of env.adminEmails){ try{out.push((await auth.getUserByEmail(email)).uid)}catch{} } return [...new Set(out)];
 }
export async function createOrder(buyerUid, productId){
 const admins=await adminUids();
 if(!admins.length) throw new HttpError(503,'Admin belum dikonfigurasi.');
 return db.runTransaction(async tx=>{
  const productRef=db.collection('products').doc(productId), snap=await tx.get(productRef);
 if(!snap.exists) throw new HttpError(404,'Produk tidak ditemukan.');
 const p=snap.data(), stock=Number(p.stock);
  if(p.status!=='available'||p.visibility!=='public'||p.approvalStatus!=='approved'||!Number.isInteger(stock)||stock<1) throw new HttpError(409,'Produk tidak tersedia.');
  if(p.sellerUid===buyerUid) throw new HttpError(403,'Seller tidak dapat membeli produknya sendiri.');
  const orderRef=db.collection('orders').doc(), roomRef=db.collection('rooms').doc(orderRef.id), publicId=p.productId||productRef.id;
  tx.update(productRef,{status:'in_transaction',updatedAt:FieldValue.serverTimestamp()});
  tx.set(orderRef,{buyerUid,sellerUid:p.sellerUid,productDocId:productRef.id,productId:publicId,productName:p.title,amount:Number(p.price),status:'in_transaction',paymentStatus:'pending',stockReserved:true,createdAt:FieldValue.serverTimestamp(),updatedAt:FieldValue.serverTimestamp()});
  tx.set(roomRef,{roomId:roomRef.id,orderId:orderRef.id,productId:publicId,buyerUid,sellerUid:p.sellerUid,participantUids:[buyerUid,...admins],sellerCalled:false,status:'in_transaction',createdAt:FieldValue.serverTimestamp(),updatedAt:FieldValue.serverTimestamp()});
  tx.set(db.collection('payments').doc(orderRef.id),{orderId:orderRef.id,productId:publicId,buyerUid,sellerUid:p.sellerUid,amount:Number(p.price),paymentMethod:'qris',status:'pending',createdAt:FieldValue.serverTimestamp(),updatedAt:FieldValue.serverTimestamp()});
  return {orderId:orderRef.id,roomId:roomRef.id};
 });
}
export async function doneOrder(orderId,buyerUid){ return db.runTransaction(async tx=>{
 const orderRef=db.collection('orders').doc(orderId), os=await tx.get(orderRef);
 if(!os.exists) throw new HttpError(404,'Order tidak ditemukan.');
 const o=os.data();
 if(o.buyerUid!==buyerUid) throw new HttpError(403,'Hanya buyer yang dapat menekan DONE.');
 if(['completed','cancelled'].includes(o.status)) throw new HttpError(409,'Order sudah ditutup.');
 if(o.paymentStatus!=='verified') throw new HttpError(409,'Pembayaran belum diverifikasi Admin.');
 const productRef=db.collection('products').doc(o.productDocId||o.productId), ps=await tx.get(productRef), roomRef=db.collection('rooms').doc(orderId);
 tx.update(orderRef,{status:'completed',stockReserved:false,completedAt:FieldValue.serverTimestamp(),updatedAt:FieldValue.serverTimestamp()});
 if((await tx.get(roomRef)).exists) tx.update(roomRef,{status:'completed',completedAt:FieldValue.serverTimestamp(),updatedAt:FieldValue.serverTimestamp()});
 if(ps.exists){const p=ps.data(), next=Math.max(0,Number(p.stock)-1);
 tx.update(productRef,next===0?{stock:0,status:'sold',visibility:'private',updatedAt:FieldValue.serverTimestamp()}:{stock:next,status:'available',visibility:'public',updatedAt:FieldValue.serverTimestamp()});
}
 return {ok:true};
 });
}
