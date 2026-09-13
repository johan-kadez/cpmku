import { useEffect, useMemo, useRef, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import {
  collection,
  onSnapshot,
  query,
  where
} from 'firebase/firestore';

import { auth, db } from '../../firebase/firebase';
import { api } from '../../api';
import { rupiah } from '../../utils/rupiah';

const MAX_IMAGES = 7;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const CATEGORIES = [
  'Mobil',
  'Motor',
  'Akun',
  'Item',
  'Lainnya'
];

function getProductImages(product) {
  if (
    Array.isArray(product?.images) &&
    product.images.length > 0
  ) {
    return product.images
      .filter(image => image && image.url)
      .map(image => ({
        url: image.url,
        publicId: image.publicId || '',
        version: image.version || '',
        signature: image.signature || ''
      }));
  }

  if (product?.imageUrl) {
    return [
      {
        url: product.imageUrl,
        publicId: '',
        version: '',
        signature: ''
      }
    ];
  }

  return [];
}

function createPreview(file) {
  return {
    url: URL.createObjectURL(file),
    file,
    publicId: '',
    version: '',
    signature: '',
    uploading: false
  };
}

export default function SellerDashboard() {
  const [user, setUser] = useState(null);
  const [seller, setSeller] = useState(null);
  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [editingId, setEditingId] = useState(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [category, setCategory] = useState('');

  const [images, setImages] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fileInputRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      currentUser => {
        setUser(currentUser);
      }
    );

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) {
      setSeller(null);
      setProducts([]);
      setLoading(false);
      return undefined;
    }

    let cancelled = false;

    async function loadSeller() {
      try {
        const response = await api('/seller/me');

        if (!cancelled) {
          setSeller(
            response?.seller ||
              response ||
              null
          );
        }
      } catch {
        if (!cancelled) {
          setSeller(null);
        }
      }
    }

    loadSeller();

    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!user) {
      return undefined;
    }

    const productsRef =
      collection(db, 'products');

    const productsQuery = query(
      productsRef,
      where(
        'sellerUid',
        '==',
        user.uid
      )
    );

    const unsubscribe = onSnapshot(
      productsQuery,
      snapshot => {
        const nextProducts =
          snapshot.docs
            .map(doc => ({
              id: doc.id,
              ...doc.data()
            }))
            .sort((a, b) => {
              const aTime =
                a.updatedAt?.toMillis?.() ||
                a.createdAt?.toMillis?.() ||
                0;

              const bTime =
                b.updatedAt?.toMillis?.() ||
                b.createdAt?.toMillis?.() ||
                0;

              return bTime - aTime;
            });

        setProducts(nextProducts);
        setLoading(false);
      },
      () => {
        setProducts([]);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user]);

  useEffect(() => {
    return () => {
      images.forEach(image => {
        if (
          image?.file &&
          image.url?.startsWith('blob:')
        ) {
          URL.revokeObjectURL(image.url);
        }
      });
    };
  }, [images]);

  const isEditing =
    Boolean(editingId);

  const editingProduct =
    useMemo(() => {
      if (!editingId) {
        return null;
      }

      return (
        products.find(
          product =>
            product.id === editingId
        ) || null
      );
    }, [editingId, products]);

  function resetForm() {
    images.forEach(image => {
      if (
        image?.file &&
        image.url?.startsWith('blob:')
      ) {
        URL.revokeObjectURL(image.url);
      }
    });

    setEditingId(null);
    setTitle('');
    setDescription('');
    setPrice('');
    setStock('');
    setCategory('');
    setImages([]);
    setError('');
  }

  function startEdit(product) {
    if (
      product.status === 'sold' ||
      product.status ===
        'in_transaction'
    ) {
      return;
    }

    const productImages =
      getProductImages(product);

    setEditingId(product.id);
    setTitle(product.title || '');
    setDescription(
      product.description || ''
    );

    setPrice(
      product.price !== undefined &&
        product.price !== null
        ? String(product.price)
        : ''
    );

    setStock(
      product.stock !== undefined &&
        product.stock !== null
        ? String(product.stock)
        : ''
    );

    setCategory(
      product.category || ''
    );

    setImages(
      productImages.map(image => ({
        ...image,
        file: null,
        uploading: false
      }))
    );

    setError('');
    setSuccess('');

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  function handleFilesSelected(event) {
    const selectedFiles =
      Array.from(
        event.target.files || []
      );

    event.target.value = '';

    if (!selectedFiles.length) {
      return;
    }

    setError('');
    setSuccess('');

    const remaining =
      MAX_IMAGES - images.length;

    if (remaining <= 0) {
      setError(
        `Maksimal ${MAX_IMAGES} foto untuk satu produk.`
      );
      return;
    }

    const files =
      selectedFiles.slice(
        0,
        remaining
      );

    const rejected = [];

    const validFiles =
      files.filter(file => {
        const validType = [
          'image/jpeg',
          'image/png',
          'image/webp'
        ].includes(file.type);

        const validSize =
          file.size <=
          MAX_FILE_SIZE;

        if (!validType) {
          rejected.push(
            `${file.name}: format harus JPG, PNG, atau WebP.`
          );

          return false;
        }

        if (!validSize) {
          rejected.push(
            `${file.name}: ukuran maksimal 5 MB.`
          );

          return false;
        }

        return true;
      });

    if (rejected.length) {
      setError(
        rejected.join(' ')
      );
    }

    if (!validFiles.length) {
      return;
    }

    const previews =
      validFiles.map(
        createPreview
      );

    setImages(current => [
      ...current,
      ...previews
    ]);
  }

  async function uploadImage(
    image,
    index
  ) {
    if (!image?.file) {
      return image;
    }

    const response =
      await api(
        '/products/images/signature',
        {
          method: 'POST'
        }
      );

    const cloudName =
      response?.cloudName;

    const apiKey =
      response?.apiKey;

    const timestamp =
      response?.timestamp;

    const publicId =
      response?.publicId;

    const signature =
      response?.signature;

    if (
      !cloudName ||
      !apiKey ||
      !timestamp ||
      !publicId ||
      !signature
    ) {
      throw new Error(
        'Data upload Cloudinary tidak lengkap.'
      );
    }

    setImages(current =>
      current.map(
        (item, itemIndex) =>
          itemIndex === index
            ? {
                ...item,
                uploading: true
              }
            : item
      )
    );

    const formData =
      new FormData();

    formData.append(
      'file',
      image.file
    );

    formData.append(
      'api_key',
      apiKey
    );

    formData.append(
      'timestamp',
      String(timestamp)
    );

    formData.append(
      'public_id',
      publicId
    );

    formData.append(
      'signature',
      signature
    );

    const cloudinaryResponse =
      await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData
        }
      );

    const cloudinaryData =
      await cloudinaryResponse.json();

    if (
      !cloudinaryResponse.ok
    ) {
      throw new Error(
        cloudinaryData?.error
          ?.message ||
          'Upload foto ke Cloudinary gagal.'
      );
    }

    return {
      url:
        cloudinaryData.secure_url,
      publicId:
        cloudinaryData.public_id ||
        publicId,
      version:
        cloudinaryData.version ||
        timestamp,
      signature:
        cloudinaryData.signature ||
        signature,
      file: null,
      uploading: false
    };
  }

  async function uploadPendingImages() {
    const pending =
      images
        .map(
          (image, index) => ({
            image,
            index
          })
        )
        .filter(
          item => item.image?.file
        );

    if (!pending.length) {
      return images;
    }

    setUploading(true);

    try {
      const uploaded = [
        ...images
      ];

      for (const item of pending) {
        uploaded[item.index] =
          await uploadImage(
            item.image,
            item.index
          );
      }

      setImages(uploaded);

      return uploaded;
    } finally {
      setUploading(false);
    }
  }

  function removeImage(index) {
    const image =
      images[index];

    if (
      image?.file &&
      image.url?.startsWith('blob:')
    ) {
      URL.revokeObjectURL(
        image.url
      );
    }

    setImages(current =>
      current.filter(
        (_, itemIndex) =>
          itemIndex !== index
      )
    );
  }

  function moveImage(
    index,
    direction
  ) {
    const targetIndex =
      direction === 'left'
        ? index - 1
        : index + 1;

    if (
      targetIndex < 0 ||
      targetIndex >= images.length
    ) {
      return;
    }

    setImages(current => {
      const next = [
        ...current
      ];

      const temp =
        next[index];

      next[index] =
        next[targetIndex];

      next[targetIndex] =
        temp;

      return next;
    });
  }

  function validateForm() {
    const cleanTitle =
      title.trim();

    const cleanDescription =
      description.trim();

    const numericPrice =
      Number(price);

    const numericStock =
      Number(stock);

    if (!cleanTitle) {
      return 'Nama produk wajib diisi.';
    }

    if (
      cleanTitle.length > 150
    ) {
      return 'Nama produk maksimal 150 karakter.';
    }

    if (!cleanDescription) {
      return 'Deskripsi produk wajib diisi.';
    }

    if (
      cleanDescription.length >
      5000
    ) {
      return 'Deskripsi produk maksimal 5000 karakter.';
    }

    if (
      !Number.isFinite(
        numericPrice
      ) ||
      numericPrice <= 0
    ) {
      return 'Harga produk harus lebih dari 0.';
    }

    if (
      !Number.isInteger(
        numericStock
      ) ||
      numericStock < 0
    ) {
      return 'Stok produk harus berupa angka bulat 0 atau lebih.';
    }

    if (!category) {
      return 'Kategori produk wajib dipilih.';
    }

    if (images.length < 1) {
      return 'Minimal 1 foto produk.';
    }

    if (
      images.length > MAX_IMAGES
    ) {
      return `Maksimal ${MAX_IMAGES} foto produk.`;
    }

    return '';
  }

  async function handleSubmit(
    event
  ) {
    event.preventDefault();

    if (!user) {
      setError(
        'Login diperlukan.'
      );
      return;
    }

    const validationError =
      validateForm();

    if (validationError) {
      setError(
        validationError
      );
      return;
    }

    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const uploadedImages =
        await uploadPendingImages();

      if (
        uploadedImages.length < 1 ||
        uploadedImages.length >
          MAX_IMAGES
      ) {
        throw new Error(
          `Jumlah foto harus antara 1 sampai ${MAX_IMAGES}.`
        );
      }

      const normalizedImages =
        uploadedImages.map(
          image => ({
            url: image.url,
            publicId:
              image.publicId || '',
            version:
              image.version || '',
            signature:
              image.signature || ''
          })
        );

      const payload = {
        title: title.trim(),
        description:
          description.trim(),
        price: Number(price),
        stock: Number(stock),
        category,
        images:
          normalizedImages
      };

      if (isEditing) {
        await api(
          `/products/${editingId}`,
          {
            method: 'PATCH',
            body: JSON.stringify(
              payload
            )
          }
        );

        setSuccess(
          'Produk berhasil diperbarui.'
        );
      } else {
        await api(
          '/products',
          {
            method: 'POST',
            body: JSON.stringify(
              payload
            )
          }
        );

        setSuccess(
          'Produk berhasil ditambahkan dan menunggu persetujuan admin.'
        );
      }

      resetForm();
    } catch (submitError) {
      setError(
        submitError?.message ||
          'Terjadi kesalahan saat menyimpan produk.'
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(
    product
  ) {
    if (
      product.status === 'sold' ||
      product.status ===
        'in_transaction'
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        `Hapus produk "${product.title || 'ini'}"?`
      );

    if (!confirmed) {
      return;
    }

    setError('');
    setSuccess('');

    try {
      await api(
        `/products/${product.id}`,
        {
          method: 'DELETE'
        }
      );

      if (
        editingId === product.id
      ) {
        resetForm();
      }

      setSuccess(
        'Produk berhasil dihapus.'
      );
    } catch (deleteError) {
      setError(
        deleteError?.message ||
          'Gagal menghapus produk.'
      );
    }
  }

  function getStatusLabel(
    product
  ) {
    if (
      product.status ===
      'in_transaction'
    ) {
      return 'Sedang Transaksi';
    }

    if (
      product.status ===
      'pending'
    ) {
      return 'Menunggu Persetujuan';
    }

    if (
      product.status ===
      'approved'
    ) {
      return 'Disetujui';
    }

    if (
      product.status ===
      'sold'
    ) {
      return 'Terjual';
    }

    if (
      product.status ===
      'rejected'
    ) {
      return 'Ditolak';
    }

    return (
      product.status ||
      'Tidak diketahui'
    );
  }

  function getVisibilityLabel(
    product
  ) {
    if (
      product.visibility ===
      'public'
    ) {
      return 'Publik';
    }

    return 'Private';
  }

  if (!user) {
    return (
      <main className="page">
        <section className="container">
          <div className="card">
            <h1>
              Seller Dashboard
            </h1>

            <p>
              Login diperlukan untuk
              mengakses dashboard
              seller.
            </p>
          </div>
        </section>
      </main>
    );
  }

  if (!seller) {
    return (
      <main className="page">
        <section className="container">
          <div className="card">
            <h1>
              Seller Dashboard
            </h1>

            <p>
              Akun seller belum
              tersedia atau belum
              disetujui admin.
            </p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="page">
      <section className="container">
        <div className="card">
          <div
            style={{
              display: 'flex',
              justifyContent:
                'space-between',
              alignItems: 'center',
              gap: '16px',
              flexWrap: 'wrap'
            }}
          >
            <div>
              <h1>
                {isEditing
                  ? 'Edit Produk'
                  : 'Tambah Produk'}
              </h1>

              <p>
                Kelola produk yang
                kamu jual di CPMKU.
              </p>
            </div>

            {isEditing && (
              <button
                type="button"
                onClick={resetForm}
                disabled={saving}
              >
                Batal Edit
              </button>
            )}
          </div>

          {error && (
            <div
              role="alert"
              style={{
                marginTop: '16px'
              }}
            >
              {error}
            </div>
          )}

          {success && (
            <div
              role="status"
              style={{
                marginTop: '16px'
              }}
            >
              {success}
            </div>
          )}

          <form
            onSubmit={
              handleSubmit
            }
            style={{
              marginTop: '24px'
            }}
          >
            <div>
              <label htmlFor="product-title">
                Nama Produk
              </label>

              <input
                id="product-title"
                type="text"
                value={title}
                onChange={event =>
                  setTitle(
                    event.target
                      .value
                  )
                }
                maxLength={150}
                disabled={saving}
                required
              />
            </div>

            <div>
              <label htmlFor="product-description">
                Deskripsi
              </label>

              <textarea
                id="product-description"
                value={description}
                onChange={event =>
                  setDescription(
                    event.target
                      .value
                  )
                }
                maxLength={5000}
                disabled={saving}
                rows={6}
                required
              />
            </div>

            <div>
              <label htmlFor="product-price">
                Harga
              </label>

              <input
                id="product-price"
                type="number"
                min="1"
                step="1"
                value={price}
                onChange={event =>
                  setPrice(
                    event.target
                      .value
                  )
                }
                disabled={saving}
                required
              />
            </div>

            <div>
              <label htmlFor="product-stock">
                Stok
              </label>

              <input
                id="product-stock"
                type="number"
                min="0"
                step="1"
                value={stock}
                onChange={event =>
                  setStock(
                    event.target
                      .value
                  )
                }
                disabled={saving}
                required
              />
            </div>

            <div>
              <label htmlFor="product-category">
                Kategori
              </label>

              <select
                id="product-category"
                value={category}
                onChange={event =>
                  setCategory(
                    event.target
                      .value
                  )
                }
                disabled={saving}
                required
              >
                <option value="">
                  Pilih kategori
                </option>

                {CATEGORIES.map(
                  item => (
                    <option
                      key={item}
                      value={item}
                    >
                      {item}
                    </option>
                  )
                )}
              </select>
            </div>

            <div
              style={{
                marginTop: '20px'
              }}
            >
              <label>
                Foto Produk
              </label>

              <p>
                Minimal 1 foto,
                maksimal{' '}
                {MAX_IMAGES}{' '}
                foto. Maksimal 5 MB
                per foto.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={
                  handleFilesSelected
                }
                disabled={
                  saving ||
                  images.length >=
                    MAX_IMAGES
                }
              />

              {images.length >
                0 && (
                <div
                  style={{
                    display:
                      'grid',
                    gridTemplateColumns:
                      'repeat(auto-fill, minmax(140px, 1fr))',
                    gap: '12px',
                    marginTop:
                      '16px'
                  }}
                >
                  {images.map(
                    (
                      image,
                      index
                    ) => (
                      <div
                        key={`${image.url}-${index}`}
                        style={{
                          position:
                            'relative'
                        }}
                      >
                        <img
                          src={
                            image.url
                          }
                          alt={`Foto produk ${index + 1}`}
                          style={{
                            width:
                              '100%',
                            aspectRatio:
                              '1 / 1',
                            objectFit:
                              'cover',
                            borderRadius:
                              '12px'
                          }}
                        />

                        {index ===
                          0 && (
                          <span
                            style={{
                              position:
                                'absolute',
                              top: '8px',
                              left: '8px'
                            }}
                          >
                            Cover
                          </span>
                        )}

                        {image.uploading && (
                          <span
                            style={{
                              position:
                                'absolute',
                              left: '8px',
                              bottom:
                                '8px'
                            }}
                          >
                            Uploading...
                          </span>
                        )}

                        <div
                          style={{
                            display:
                              'flex',
                            gap: '6px',
                            marginTop:
                              '6px'
                          }}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              moveImage(
                                index,
                                'left'
                              )
                            }
                            disabled={
                              saving ||
                              index ===
                                0
                            }
                          >
                            ←
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              moveImage(
                                index,
                                'right'
                              )
                            }
                            disabled={
                              saving ||
                              index ===
                                images.length -
                                  1
                            }
                          >
                            →
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              removeImage(
                                index
                              )
                            }
                            disabled={
                              saving
                            }
                          >
                            Hapus
                          </button>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}

              {images.length <
                MAX_IMAGES && (
                <button
                  type="button"
                  onClick={() =>
                    fileInputRef.current?.click()
                  }
                  disabled={saving}
                  style={{
                    marginTop:
                      '12px'
                  }}
                >
                  Tambah Foto
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={
                saving ||
                uploading
              }
              style={{
                marginTop:
                  '24px'
              }}
            >
              {saving
                ? isEditing
                  ? 'Menyimpan...'
                  : 'Menambahkan...'
                : isEditing
                  ? 'Simpan Perubahan'
                  : 'Tambah Produk'}
            </button>
          </form>
        </div>

        <div
          className="card"
          style={{
            marginTop: '24px'
          }}
        >
          <h2>
            Produk Saya
          </h2>

          {loading ? (
            <p>
              Memuat produk...
            </p>
          ) : products.length ===
            0 ? (
            <p>
              Belum ada produk.
            </p>
          ) : (
            <div
              style={{
                display: 'grid',
                gap: '16px',
                marginTop:
                  '16px'
              }}
            >
              {products.map(
                product => {
                  const productImages =
                    getProductImages(
                      product
                    );

                  const locked =
                    product.status ===
                      'sold' ||
                    product.status ===
                      'in_transaction';

                  return (
                    <article
                      key={
                        product.id
                      }
                      style={{
                        display:
                          'grid',
                        gridTemplateColumns:
                          '120px 1fr',
                        gap: '16px',
                        alignItems:
                          'start'
                      }}
                    >
                      <div>
                        {productImages[0]
                          ?.url ? (
                          <img
                            src={
                              productImages[0]
                                .url
                            }
                            alt={
                              product.title ||
                              'Produk'
                            }
                            style={{
                              width:
                                '120px',
                              height:
                                '120px',
                              objectFit:
                                'cover',
                              borderRadius:
                                '12px'
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width:
                                '120px',
                              height:
                                '120px',
                              display:
                                'flex',
                              alignItems:
                                'center',
                              justifyContent:
                                'center'
                            }}
                          >
                            Tidak ada
                            foto
                          </div>
                        )}
                      </div>

                      <div>
                        <h3>
                          {product.title ||
                            'Tanpa nama'}
                        </h3>

                        <p>
                          {rupiah(
                            product.price ||
                              0
                          )}
                        </p>

                        <p>
                          Stok:{' '}
                          {product.stock ??
                            0}
                        </p>

                        <p>
                          Status:{' '}
                          {getStatusLabel(
                            product
                          )}
                        </p>

                        <p>
                          Visibility:{' '}
                          {getVisibilityLabel(
                            product
                          )}
                        </p>

                        {productImages.length >
                          1 && (
                          <p>
                            {
                              productImages.length
                            }{' '}
                            foto
                          </p>
                        )}

                        <div
                          style={{
                            display:
                              'flex',
                            gap: '8px',
                            flexWrap:
                              'wrap'
                          }}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              startEdit(
                                product
                              )
                            }
                            disabled={
                              locked ||
                              saving
                            }
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(
                                product
                              )
                            }
                            disabled={
                              locked ||
                              saving
                            }
                          >
                            Hapus
                          </button>
                        </div>

                        {locked && (
                          <p>
                            Produk tidak
                            dapat diedit
                            atau dihapus
                            selama
                            statusnya{' '}
                            {product.status ===
                            'in_transaction'
                              ? 'sedang transaksi'
                              : 'terjual'}
                            .
                          </p>
                        )}
                      </div>
                    </article>
                  );
                }
              )}
            </div>
          )}
        </div>

        {isEditing &&
          editingProduct && (
            <div
              style={{
                marginTop:
                  '16px'
              }}
            >
              <small>
                Sedang mengedit:{' '}
                {
                  editingProduct.title
                }
              </small>
            </div>
          )}
      </section>
    </main>
  );
}
