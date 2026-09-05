import { db, FieldValue } from '../firebase/admin.js';
import { HttpError } from '../utils/errors.js';
import { productId } from '../utils/productId.js';
export async function createProduct(uid, seller, data) {
  const title = String(data?.title || '').trim();
  const description = String(data?.description || '').trim();
  const imageUrl = String(data?.imageUrl || '').trim();
  const price = Number(data?.price);
  const stock = Number(data?.stock);
  const category = String(data?.category || 'mobil').trim();
  if (!title || !description || !imageUrl || !Number.isFinite(price) || price <= 0 || !Number.isInteger(stock) || stock < 1) {
    throw new HttpError(400, 'Data produk tidak valid.');
  }
  try { new URL(imageUrl);
 } catch { throw new HttpError(400, 'URL foto produk tidak valid.');
 }
  let id;
  for (let i = 0;
 i < 10;
 i++) {
    const candidate = productId();
    const existing = await db.collection('products').doc(candidate).get();
    if (!existing.exists) { id = candidate;
 break;
 }
  }
  if (!id) throw new HttpError(500, 'Gagal membuat ID produk unik.');
  await db.collection('products').doc(id).set({
    productId: id,
    title,
    description,
    imageUrl,
    price,
    stock,
    category,
    sellerUid: uid,
    sellerName: seller.name,
    sellerPhotoUrl: seller.photoUrl,
    visibility: 'private',
    status: 'pending',
    approvalStatus: 'pending',
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  });
  return { productId: id };
}
