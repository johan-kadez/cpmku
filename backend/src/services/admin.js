export async function setStatus(
type,
id,
status
) {
const collection = COLLECTIONS[type];

if (!collection) {
throw new HttpError(
400,
'Jenis tidak valid.'
);
}

const allowed = {
sellers: [
'approved',
'rejected'
],
products: [
'approved',
'rejected'
],
orders: [
'cancelled'
],
payments: [
'verified',
'rejected'
],
rooms: [
'cancelled'
]
};

if (
!allowed[type]?.includes(status)
) {
throw new HttpError(
400,
'Status tidak valid.'
);
}

const ref = db
.collection(collection)
.doc(id);

const snap = await ref.get();

if (!snap.exists) {
throw new HttpError(
404,
'Data tidak ditemukan.'
);
}

if (type === 'sellers') {
const d = snap.data();

```
if (d.status !== 'pending') {
  throw new HttpError(
    409,
    'Pengajuan seller ini sudah diproses.'
  );
}

if (status === 'approved') {
  const batch = db.batch();

  batch.set(
    db.collection('sellers').doc(id),
    {
      uid: id,
      email: d.email || '',
      name: d.name || '',
      phone: d.phone || '',
      reason: d.reason || '',
      description: d.reason || '',
      photoUrl: d.photoUrl || '',
      status: 'approved',
      banned: false,
      approvedAt:
        FieldValue.serverTimestamp(),
      updatedAt:
        FieldValue.serverTimestamp()
    },
    {
      merge: true
    }
  );

  batch.update(
    ref,
    {
      status: 'approved',
      approvedAt:
        FieldValue.serverTimestamp(),
      updatedAt:
        FieldValue.serverTimestamp()
    }
  );

  await batch.commit();

  return {
    ok: true,
    status: 'approved'
  };
}

await ref.update({
  status: 'rejected',
  rejectedAt:
    FieldValue.serverTimestamp(),
  updatedAt:
    FieldValue.serverTimestamp()
});

return {
  ok: true,
  status: 'rejected'
};
```

}

if (type === 'products') {
if (status === 'approved') {
await ref.update({
status: 'available',
visibility: 'public',
approvedAt:
FieldValue.serverTimestamp(),
updatedAt:
FieldValue.serverTimestamp()
});
} else {
await ref.update({
status: 'rejected',
visibility: 'private',
rejectedAt:
FieldValue.serverTimestamp(),
updatedAt:
FieldValue.serverTimestamp()
});
}

```
return {
  ok: true
};
```

}

if (
type === 'orders' &&
status === 'cancelled'
) {
return db.runTransaction(
async transaction => {
const fresh =
await transaction.get(ref);

```
    if (!fresh.exists) {
      throw new HttpError(
        404,
        'Order tidak ditemukan.'
      );
    }

    const d = fresh.data();

    if (
      d.status !== 'in_transaction'
    ) {
      throw new HttpError(
        409,
        'Order tidak sedang aktif.'
      );
    }

    const productRef = db
      .collection('products')
      .doc(d.productId);

    const roomRef = db
      .collection('rooms')
      .doc(d.roomId || id);

    const paymentRef = db
      .collection('payments')
      .doc(id);

    const [
      product,
      room,
      payment
    ] = await Promise.all([
      transaction.get(productRef),
      transaction.get(roomRef),
      transaction.get(paymentRef)
    ]);

    transaction.update(
      ref,
      {
        status: 'cancelled',
        cancelledAt:
          FieldValue.serverTimestamp(),
        updatedAt:
          FieldValue.serverTimestamp()
      }
    );

    if (
      product.exists &&
      product.data().status ===
        'in_transaction'
    ) {
      transaction.update(
        productRef,
        {
          status: 'available',
          visibility: 'public',
          updatedAt:
            FieldValue.serverTimestamp()
        }
      );
    }

    if (room.exists) {
      transaction.update(
        roomRef,
        {
          status: 'cancelled',
          cancelledAt:
            FieldValue.serverTimestamp(),
          updatedAt:
            FieldValue.serverTimestamp()
        }
      );
    }

    if (
      payment.exists &&
      payment.data().status === 'pending'
    ) {
      transaction.update(
        paymentRef,
        {
          status: 'rejected',
          updatedAt:
            FieldValue.serverTimestamp()
        }
      );
    }

    return {
      ok: true
    };
  }
);
```

}

if (type === 'payments') {
const d = snap.data();

```
const orderRef = db
  .collection('orders')
  .doc(d.orderId);

if (status === 'verified') {
  await ref.update({
    status: 'verified',
    verifiedAt:
      FieldValue.serverTimestamp(),
    updatedAt:
      FieldValue.serverTimestamp()
  });

  await orderRef.update({
    paymentStatus: 'verified',
    updatedAt:
      FieldValue.serverTimestamp()
  });
} else {
  await ref.update({
    status: 'rejected',
    rejectedAt:
      FieldValue.serverTimestamp(),
    updatedAt:
      FieldValue.serverTimestamp()
  });

  await orderRef.update({
    paymentStatus: 'rejected',
    updatedAt:
      FieldValue.serverTimestamp()
  });
}

return {
  ok: true
};
```

}

if (type === 'rooms') {
await ref.update({
status,
updatedAt:
FieldValue.serverTimestamp()
});

```
return {
  ok: true
};
```

}

throw new HttpError(
400,
'Aksi tidak tersedia.'
);
}
