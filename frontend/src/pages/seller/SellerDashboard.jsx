import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import {
  collection,
  onSnapshot,
  query,
  where
} from 'firebase/firestore';

import { auth, db } from '../../services/firebase';
import { api } from '../../services/api';
import { rupiah } from '../../utils/format';

const MAX_IMAGES = 7;
const MAX_FILE_SIZE = 4 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 1600;
const TARGET_IMAGE_SIZE = 800 * 1024;
const MAX_COMPRESSED_IMAGE_SIZE = 800 * 1024;

const CATEGORIES = [
  'Mobil',
  'Jasa',
  'Builder'
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

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Foto ${file.name} tidak dapat dibaca.`));
    };

    image.src = url;
  });
}

function canvasToBlob(canvas, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => {
        if (!blob) {
          reject(
            new Error('Browser gagal memproses foto.')
          );
          return;
        }

        resolve(blob);
      },
      'image/webp',
      quality
    );
  });
}

async function compressImage(file) {
  const image = await loadImage(file);

  let width = image.naturalWidth || image.width;
  let height = image.naturalHeight || image.height;

  if (!width || !height) {
    throw new Error(
      `Foto ${file.name} memiliki dimensi yang tidak valid.`
    );
  }

  const scale = Math.min(
    1,
    MAX_IMAGE_DIMENSION /
      Math.max(width, height)
  );

  width = Math.max(
    1,
    Math.round(width * scale)
  );

  height = Math.max(
    1,
    Math.round(height * scale)
  );

  let canvas = document.createElement('canvas');
  let currentWidth = width;
  let currentHeight = height;

  async function findBestBlob() {
    let bestBlob = null;

    for (
      let quality = 0.82;
      quality >= 0.25;
      quality -= 0.05
    ) {
      const blob = await canvasToBlob(
        canvas,
        quality
      );

      if (
        !bestBlob ||
        blob.size < bestBlob.size
      ) {
        bestBlob = blob;
      }

      if (
        blob.size <= TARGET_IMAGE_SIZE
      ) {
        return blob;
      }
    }

    return bestBlob;
  }

  let blob = null;

  for (let attempt = 0; attempt < 6; attempt += 1) {
    canvas.width = currentWidth;
    canvas.height = currentHeight;

    const context =
      canvas.getContext('2d', {
        alpha: true
      });

    if (!context) {
      throw new Error(
        `Browser tidak dapat memproses foto ${file.name}.`
      );
    }

    context.clearRect(
      0,
      0,
      currentWidth,
      currentHeight
    );

    context.drawImage(
      image,
      0,
      0,
      currentWidth,
      currentHeight
    );

    blob = await findBestBlob();

    if (
      blob &&
      blob.size <= MAX_COMPRESSED_IMAGE_SIZE
    ) {
      break;
    }

    const nextScale = 0.85;

    currentWidth = Math.max(
      320,
      Math.round(
        currentWidth * nextScale
      )
    );

    currentHeight = Math.max(
      320,
      Math.round(
        currentHeight * nextScale
      )
    );
  }

  if (
    !blob ||
    blob.size > MAX_COMPRESSED_IMAGE_SIZE
  ) {
    throw new Error(
      `Foto ${file.name} masih lebih dari 500 KB setelah dikompres. Silakan pilih foto yang lebih ringan`
    );
  }

  const compressedName =
    file.name.replace(
      /\.[^/.]+$/,
      ''
    ) + '.webp';

  return new File(
    [blob],
    compressedName,
    {
      type: 'image/webp',
      lastModified:
        Date.now()
    }
  );
}

function formatDate(value) {
  if (!value) {
    return '-';
  }

  try {
    const date =
      typeof value.toDate === 'function'
        ? value.toDate()
        : new Date(value);

    if (Number.isNaN(date.getTime())) {
      return '-';
    }

    return date.toLocaleDateString(
      'id-ID',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }
    );
  } catch {
    return '-';
  }
}

function getStatusLabel(status) {
  if (status === 'approved') {
    return 'Disetujui';
  }

  if (status === 'pending') {
    return 'Menunggu';
  }

  if (status === 'rejected') {
    return 'Ditolak';
  }

  if (status === 'in_transaction') {
    return 'Dalam Transaksi';
  }

  if (status === 'sold') {
    return 'Terjual';
  }

  return status || 'Tidak diketahui';
}

function getVisibilityLabel(visibility) {
  if (visibility === 'public') {
    return 'Publik';
  }

  if (visibility === 'private') {
    return 'Privat';
  }

  return visibility || '-';
}

function getStatusClass(status) {
  if (status === 'approved') {
    return 'seller-status seller-status-approved';
  }

  if (status === 'pending') {
    return 'seller-status seller-status-pending';
  }

  if (status === 'rejected') {
    return 'seller-status seller-status-rejected';
  }

  if (status === 'in_transaction') {
    return 'seller-status seller-status-transaction';
  }

  if (status === 'sold') {
    return 'seller-status seller-status-sold';
  }

  return 'seller-status';
}

export default function SellerDashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);

  const [authLoading, setAuthLoading] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [editingId, setEditingId] = useState(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [category, setCategory] = useState('');
  const [categoryOpen, setCategoryOpen] = useState(false);

  const [confirmProduct, setConfirmProduct] = useState(null);

  const [images, setImages] = useState([]);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fileInputRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      currentUser => {
        setUser(currentUser);
        setAuthLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) {
      setProducts([]);
      setLoadingProducts(false);
      return undefined;
    }

    setLoadingProducts(true);

    const productsRef = collection(
      db,
      'products'
    );

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
        setLoadingProducts(false);
      },
      snapshotError => {
        console.error(
          'Gagal mengambil produk seller:',
          snapshotError
        );

        setProducts([]);
        setLoadingProducts(false);
        setError(
          'Produk tidak dapat dimuat. Laporkan ke admin/developer'
        );
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

  function clearImagePreviews() {
    images.forEach(image => {
      if (
        image?.file &&
        image.url?.startsWith('blob:')
      ) {
        URL.revokeObjectURL(image.url);
      }
    });
  }

  function resetForm() {
    clearImagePreviews();

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
      product.status === 'in_transaction'
    ) {
      setError(
        'Produk ini sedang tidak dapat diedit'
      );
      return;
    }

    const productImages =
      getProductImages(product);

    setEditingId(product.id);

    setTitle(
      product.title || ''
    );

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
      CATEGORIES.includes(product.category)
        ? product.category
        : ''
    );

    setCategoryOpen(false);

    clearImagePreviews();

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

  async function handleFilesSelected(event) {
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
        `Maksimal ${MAX_IMAGES} foto untuk satu produk`
      );
      return;
    }

    const files =
      selectedFiles.slice(
        0,
        remaining
      );

    const rejected = [];
    const validFiles = [];

    for (const file of files) {
      const validType = [
        'image/jpeg',
        'image/png',
        'image/webp'
      ].includes(file.type);

      if (!validType) {
        rejected.push(
          `${file.name}: format harus JPG, PNG, atau WebP.`
        );
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        rejected.push(
          `${file.name}: ukuran foto asli maksimal 2 MB`
        );
        continue;
      }

      validFiles.push(file);
    }

    const compressedFiles = [];

    for (const file of validFiles) {
      try {
        const compressedFile =
          await compressImage(file);

        compressedFiles.push(
          compressedFile
        );
      } catch (compressionError) {
        rejected.push(
          compressionError?.message ||
            `Foto ${file.name} gagal diproses`
        );
      }
    }

    if (rejected.length) {
      setError(
        rejected.join(' ')
      );
    }

    if (!compressedFiles.length) {
      return;
    }

    const previews =
      compressedFiles.map(
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

    let cloudinaryData = {};

    try {
      cloudinaryData =
        await cloudinaryResponse.json();
    } catch {
      cloudinaryData = {};
    }

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
          item =>
            item.image?.file
        );

    if (!pending.length) {
      return images;
    }

    setUploading(true);

    try {
      const uploaded = [
        ...images
      ];

      for (
        const item of pending
      ) {
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
      cleanTitle.length > 50
    ) {
      return 'Nama produk maksimal 50 karakter.';
    }

    if (!cleanDescription) {
      return 'Deskripsi produk wajib diisi.';
    }

    if (
      cleanDescription.length > 2000
    ) {
      return 'Deskripsi produk maksimal 2000 karakter.';
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

    const incompleteImage =
      images.some(
        image =>
          !image?.file &&
          (
            !image?.url ||
            !image?.publicId ||
            !image?.version ||
            !image?.signature
          )
      );

    if (incompleteImage) {
      return 'Ada foto yang belum siap untuk disimpan';
    }

    return '';
  }

  async function handleSubmit(event) {
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
        uploadedImages.length > MAX_IMAGES
      ) {
        throw new Error(
          `Jumlah foto harus antara 1 sampai ${MAX_IMAGES}`
        );
      }

      const incompleteImage =
        uploadedImages.some(
          image =>
            !image?.url ||
            !image?.publicId ||
            !image?.version ||
            !image?.signature
        );

      if (incompleteImage) {
        throw new Error(
          'Foto yang kamu pilih eror, coba pilih foto lain'
        );
      }

      const payload = {
        title:
          title.trim(),
        description:
          description.trim(),
        price:
          Number(price),
        stock:
          Number(stock),
        category,
        images:
          uploadedImages.map(
            image => ({
              url: image.url,
              publicId:
                image.publicId,
              version:
                image.version,
              signature:
                image.signature
            })
          )
      };

      if (editingId) {
        await api(
          `/products/${editingId}`,
          {
            method: 'PATCH',
            body:
              JSON.stringify(
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
            body:
              JSON.stringify(
                payload
              )
          }
        );

        setSuccess(
          'Produk berhasil ditambahkan dan menunggu persetujuan admin.'
        );
      }

      clearImagePreviews();

      setEditingId(null);
      setTitle('');
      setDescription('');
      setPrice('');
      setStock('');
      setCategory('');
      setImages([]);

      if (fileInputRef.current) {
        fileInputRef.current.value =
          '';
      }

      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    } catch (submitError) {
      setError(
        submitError?.message ||
          'Gagal menyimpan produk.'
      );
    } finally {
      setSaving(false);
    }
  }

  function handleDelete(product) {
    if (
      product.status ===
        'in_transaction'
    ) {
      setError(
        'Produk yang sedang dalam transaksi tidak dapat dihapus.'
      );
      return;
    }

    setConfirmProduct(product);
  }

  async function confirmDeleteProduct() {
    if (!confirmProduct?.id) {
      return;
    }

    const product = confirmProduct;

    setConfirmProduct(null);
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

  function renderImagePreview(
    image,
    index
  ) {
    return (
      <div
        key={`${image.publicId || image.url}-${index}`}
        style={{
          position: 'relative',
          borderRadius: 14,
          overflow: 'hidden',
          aspectRatio: '1 / 1',
          background:
            'rgba(255,255,255,0.05)',
          border:
            '1px solid rgba(255,255,255,0.10)'
        }}
      >
        <img
          src={image.url}
          alt={`Foto produk ${index + 1}`}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block'
          }}
        />

        {image.uploading && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background:
                'rgba(0,0,0,0.60)',
              fontSize: 12,
              fontWeight: 700
            }}
          >
            Upload...
          </div>
        )}

        <div
          style={{
            position: 'absolute',
            left: 7,
            right: 7,
            bottom: 7,
            display: 'flex',
            gap: 5
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
              index === 0 ||
              saving ||
              uploading
            }
            style={{
              flex: 1,
              border: 0,
              borderRadius: 8,
              padding: '6px 4px',
              background:
                'rgba(0,0,0,0.72)',
              color: '#fff',
              cursor:
                index === 0
                  ? 'not-allowed'
                  : 'pointer',
              opacity:
                index === 0
                  ? 0.4
                  : 1
            }}
          >
            ←
          </button>

          <button
            type="button"
            onClick={() =>
              removeImage(index)
            }
            disabled={
              saving ||
              uploading
            }
            style={{
              flex: 1,
              border: 0,
              borderRadius: 8,
              padding: '6px 4px',
              background:
                'rgba(180,30,50,0.85)',
              color: '#fff',
              cursor: 'pointer'
            }}
          >
            ×
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
              index ===
                images.length - 1 ||
              saving ||
              uploading
            }
            style={{
              flex: 1,
              border: 0,
              borderRadius: 8,
              padding: '6px 4px',
              background:
                'rgba(0,0,0,0.72)',
              color: '#fff',
              cursor:
                index ===
                images.length - 1
                  ? 'not-allowed'
                  : 'pointer',
              opacity:
                index ===
                images.length - 1
                  ? 0.4
                  : 1
            }}
          >
            →
          </button>
        </div>

        {index === 0 && (
          <div
            style={{
              position: 'absolute',
              top: 7,
              left: 7,
              padding:
                '4px 7px',
              borderRadius: 7,
              background:
                'rgba(0,0,0,0.72)',
              color: '#fff',
              fontSize: 10,
              fontWeight: 800
            }}
          >
            UTAMA
          </div>
        )}
      </div>
    );
  }

  if (authLoading) {
    return (
      <div
        style={{
          minHeight: '60vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24
        }}
      >
        Memuat...
      </div>
    );
  }

  if (!user) {
    return (
      <div
        style={{
          minHeight: '60vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          textAlign: 'center'
        }}
      >
        <div>
          <h2
            style={{
              margin: '0 0 8px'
            }}
          >
            Login diperlukan
          </h2>

          <p
            style={{
              margin: 0,
              opacity: 0.7
            }}
          >
            Silakan login terlebih dahulu
            untuk mengelola produk
          </p>
        </div>
      </div>
    );
  }

  return (
    <main
      style={{
        width: '100%',
        maxWidth: 1180,
        margin: '0 auto',
        padding: '28px 18px 60px',
        boxSizing: 'border-box'
      }}
    >
      {confirmProduct && (
        <div
          role="presentation"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            background: 'rgba(0,0,0,0.68)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)'
          }}
          onClick={() => setConfirmProduct(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="seller-dashboard-confirm-title"
            style={{
              width: 'min(100%, 420px)',
              boxSizing: 'border-box',
              padding: 22,
              borderRadius: 18,
              background: 'rgba(20,24,32,0.96)',
              border: '1px solid rgba(255,255,255,0.12)',
              boxShadow: '0 24px 80px rgba(0,0,0,0.45)'
            }}
            onClick={event => event.stopPropagation()}
          >
            <h3
              id="seller-dashboard-confirm-title"
              style={{ margin: '0 0 8px' }}
            >
              Hapus produk?
            </h3>

            <p
              style={{
                margin: '0 0 20px',
                opacity: 0.72
              }}
            >
              Hapus produk "{confirmProduct.title || 'ini'}"?
            </p>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 10
              }}
            >
              <button
                type="button"
                className="seller-button seller-secondary"
                onClick={() =>
                  setConfirmProduct(null)
                }
              >
                Batal
              </button>

              <button
                type="button"
                className="seller-button seller-danger"
                onClick={confirmDeleteProduct}
              >
                Ya, hapus
              </button>
            </div>
          </div>
        </div>
      )}

      <style>
        {`
          .seller-dashboard {
            color: inherit;
          }

          .seller-glass {
            background: rgba(255,255,255,0.045);
            border: 1px solid rgba(255,255,255,0.09);
            box-shadow: 0 18px 50px rgba(0,0,0,0.18);
            backdrop-filter: blur(18px);
            -webkit-backdrop-filter: blur(18px);
          }

          .seller-input {
            width: 100%;
            box-sizing: border-box;
            border: 1px solid rgba(255,255,255,0.12);
            background: rgba(255,255,255,0.045);
            color: inherit;
            border-radius: 12px;
            padding: 12px 13px;
            outline: none;
            font: inherit;
          }

          .seller-input:focus {
            border-color: rgba(60,150,255,0.65);
            box-shadow: 0 0 0 3px rgba(60,150,255,0.10);
          }

          .seller-button {
            border: 0;
            border-radius: 11px;
            padding: 10px 14px;
            font: inherit;
            font-weight: 700;
            cursor: pointer;
            transition: opacity 0.15s ease, transform 0.15s ease;
          }

          .seller-button:hover:not(:disabled) {
            transform: translateY(-1px);
          }

          .seller-button:disabled {
            opacity: 0.45;
            cursor: not-allowed;
          }

          .seller-primary {
            background: #1683ff;
            color: white;
          }

          .seller-secondary {
            background: rgba(255,255,255,0.08);
            color: inherit;
            border: 1px solid rgba(255,255,255,0.10);
          }

          .seller-danger {
            background: rgba(220,55,75,0.14);
            color: #ff8d9b;
            border: 1px solid rgba(220,55,75,0.25);
          }

          .seller-status {
            display: inline-flex;
            align-items: center;
            padding: 5px 8px;
            border-radius: 999px;
            font-size: 11px;
            font-weight: 800;
            background: rgba(255,255,255,0.08);
          }

          .seller-status-approved {
            color: #72d6a0;
            background: rgba(40,180,105,0.12);
          }

          .seller-status-pending {
            color: #ffd77d;
            background: rgba(240,170,40,0.12);
          }

          .seller-status-rejected {
            color: #ff8b99;
            background: rgba(220,50,70,0.12);
          }

          .seller-status-transaction {
            color: #77b9ff;
            background: rgba(40,120,230,0.12);
          }

          .seller-status-sold {
            color: #aaa;
            background: rgba(120,120,120,0.12);
          }

          .seller-product-card {
            display: grid;
            grid-template-columns: 170px minmax(0, 1fr);
            gap: 18px;
            padding: 16px;
            border-radius: 18px;
          }

          .seller-product-image {
            width: 170px;
            height: 170px;
            border-radius: 14px;
            overflow: hidden;
            background: rgba(255,255,255,0.04);
          }

          @media (max-width: 720px) {
            .seller-product-card {
              grid-template-columns: 1fr;
            }

            .seller-product-image {
              width: 100%;
              height: 220px;
            }
          }
        `}
      </style>

      <div className="seller-dashboard">
        <section
          className="seller-glass"
          style={{
            borderRadius: 22,
            padding: 22,
            marginBottom: 22
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent:
                'space-between',
              alignItems:
                'flex-start',
              gap: 16,
              flexWrap: 'wrap'
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 12,
                  opacity: 0.55,
                  marginBottom: 5
                }}
              >
                SELLER
              </div>

              <h1
                style={{
                  margin: 0,
                  fontSize:
                    'clamp(24px, 5vw, 34px)',
                  letterSpacing: '-0.02em'
                }}
              >
                Kelola Produk
              </h1>

              <p
                style={{
                  margin:
                    '8px 0 0',
                  opacity: 0.65
                }}
              >
                Tambahkan, edit, atau hapus
                produkmu
              </p>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                flexWrap: 'wrap'
              }}
            >
              <button
                type="button"
                className="seller-button seller-secondary"
                onClick={() =>
                  navigate('/')
                }
                disabled={
                  saving ||
                  uploading
                }
              >
                Kembali
              </button>

              <div
                style={{
                  textAlign:
                    'right',
                  fontSize: 13,
                  opacity: 0.7
                }}
              >
                <div>
                  {user.email ||
                    user.displayName ||
                    'Akun Seller'}
                </div>

                <div
                  style={{
                    marginTop: 4
                  }}
                >
                  {products.length}{' '}
                  produk
                </div>
              </div>
            </div>
          </div>
        </section>

        {(error || success) && (
          <div
            className="seller-glass"
            style={{
              borderRadius: 14,
              padding: 14,
              marginBottom: 18,
              borderColor:
                error
                  ? 'rgba(220,60,80,0.30)'
                  : 'rgba(50,190,120,0.25)',
              color: error
                ? '#ff9aa7'
                : '#82dfad'
            }}
          >
            {error || success}
          </div>
        )}

        <section
          className="seller-glass"
          style={{
            borderRadius: 22,
            padding: 22,
            marginBottom: 28
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent:
                'space-between',
              alignItems:
                'center',
              gap: 12,
              marginBottom: 20,
              flexWrap: 'wrap'
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: 20
                }}
              >
                {editingId
                  ? 'Edit Produk'
                  : 'Tambah Produk'}
              </h2>

              <p
                style={{
                  margin:
                    '5px 0 0',
                  opacity: 0.6,
                  fontSize: 13
                }}
              >
                Foto produk max 7 gambar.
              </p>
            </div>

            {editingId && (
              <button
                type="button"
                className="seller-button seller-secondary"
                onClick={
                  resetForm
                }
                disabled={
                  saving ||
                  uploading
                }
              >
                Batal Edit
              </button>
            )}
          </div>

          <form
            onSubmit={
              handleSubmit
            }
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fit, minmax(240px, 1fr))',
                gap: 16
              }}
            >
              <label>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    marginBottom: 7
                  }}
                >
                  Nama Produk
                </div>

                <input
                  className="seller-input"
                  type="text"
                  value={title}
                  onChange={event =>
                    setTitle(
                      event.target
                        .value
                    )
                  }
                  maxLength={150}
                  placeholder="Contoh: BMW M3"
                  disabled={
                    saving ||
                    uploading
                  }
                />
              </label>

              <label>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    marginBottom: 7
                  }}
                >
                  Kategori
                </div>

                <div
                  style={{
                    position: 'relative'
                  }}
                >
                  <button
                    type="button"
                    className="seller-input"
                    onClick={() =>
                      setCategoryOpen(
                        current => !current
                      )
                    }
                    disabled={
                      saving ||
                      uploading
                    }
                    aria-haspopup="listbox"
                    aria-expanded={
                      categoryOpen
                    }
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      textAlign: 'left',
                      cursor:
                        saving ||
                        uploading
                          ? 'not-allowed'
                          : 'pointer'
                    }}
                  >
                    <span
                      style={{
                        opacity:
                          category
                            ? 1
                            : 0.55
                      }}
                    >
                      {category ||
                        'Pilih kategori'}
                    </span>

                    <span
                      aria-hidden="true"
                      style={{
                        marginLeft: 10,
                        fontSize: 12,
                        transform:
                          categoryOpen
                            ? 'rotate(180deg)'
                            : 'none',
                        transition:
                          'transform 0.15s ease'
                      }}
                    >
                      ▼
                    </span>
                  </button>

                  {categoryOpen && (
                    <div
                      role="listbox"
                      aria-label="Kategori produk"
                      style={{
                        position: 'absolute',
                        zIndex: 30,
                        top: 'calc(100% + 6px)',
                        left: 0,
                        right: 0,
                        padding: 6,
                        borderRadius: 14,
                        background:
                          'rgba(20,24,32,0.98)',
                        border:
                          '1px solid rgba(255,255,255,0.12)',
                        boxShadow:
                          '0 18px 50px rgba(0,0,0,0.35)',
                        backdropFilter:
                          'blur(18px)',
                        WebkitBackdropFilter:
                          'blur(18px)'
                      }}
                    >
                      {CATEGORIES.map(
                        item => (
                          <button
                            key={item}
                            type="button"
                            role="option"
                            aria-selected={
                              category ===
                              item
                            }
                            onClick={() => {
                              setCategory(
                                item
                              );
                              setCategoryOpen(
                                false
                              );
                            }}
                            style={{
                              width: '100%',
                              border: 0,
                              borderRadius: 10,
                              padding:
                                '11px 12px',
                              background:
                                category ===
                                item
                                  ? 'rgba(22,131,255,0.16)'
                                  : 'transparent',
                              color:
                                'inherit',
                              textAlign:
                                'left',
                              font: 'inherit',
                              cursor:
                                'pointer'
                            }}
                          >
                            {item}
                          </button>
                        )
                      )}
                    </div>
                  )}
                </div>
              </label>

              <label>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    marginBottom: 7
                  }}
                >
                  Harga
                </div>

                <input
                  className="seller-input"
                  type="number"
                  min="1"
                  value={price}
                  onChange={event =>
                    setPrice(
                      event.target
                        .value
                    )
                  }
                  placeholder="100000"
                  disabled={
                    saving ||
                    uploading
                  }
                />
              </label>

              <label>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    marginBottom: 7
                  }}
                >
                  Stok
                </div>

                <input
                  className="seller-input"
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
                  placeholder="1"
                  disabled={
                    saving ||
                    uploading
                  }
                />
              </label>
            </div>

            <label
              style={{
                display: 'block',
                marginTop: 16
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  marginBottom: 7
                }}
              >
                Deskripsi
              </div>

              <textarea
                className="seller-input"
                value={description}
                onChange={event =>
                  setDescription(
                    event.target
                      .value
                  )
                }
                maxLength={5000}
                rows={6}
                placeholder="Jelaskan kondisi dan detail produk..."
                disabled={
                  saving ||
                  uploading
                }
                style={{
                  resize: 'vertical'
                }}
              />
            </label>

            <div
              style={{
                marginTop: 18
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent:
                    'space-between',
                  gap: 10,
                  alignItems:
                    'center',
                  flexWrap: 'wrap',
                  marginBottom: 10
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700
                    }}
                  >
                    Foto Produk
                  </div>

                  <div
                    style={{
                      fontSize: 12,
                      opacity: 0.55,
                      marginTop: 3
                    }}
                  >
                    Maksimal 7 foto per produk
                  </div>
                </div>

                <button
                  type="button"
                  className="seller-button seller-secondary"
                  onClick={() =>
                    fileInputRef.current?.click()
                  }
                  disabled={
                    images.length >=
                      MAX_IMAGES ||
                    saving ||
                    uploading
                  }
                >
                  Pilih Foto
                </button>

                <input
                  ref={
                    fileInputRef
                  }
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={
                    handleFilesSelected
                  }
                  style={{
                    display: 'none'
                  }}
                />
              </div>

              {images.length === 0 ? (
                <div
                  style={{
                    border:
                      '1px dashed rgba(255,255,255,0.16)',
                    borderRadius: 14,
                    padding: 28,
                    textAlign:
                      'center',
                    opacity: 0.55
                  }}
                >
                  Belum ada foto
                  <br />
                  Pilih minimal 1 foto
                  dari galeri perangkat
                </div>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      'repeat(auto-fill, minmax(125px, 1fr))',
                    gap: 10
                  }}
                >
                  {images.map(
                    renderImagePreview
                  )}
                </div>
              )}

              <div
                style={{
                  marginTop: 8,
                  fontSize: 12,
                  opacity: 0.55
                }}
              >
                {images.length}/
                {MAX_IMAGES} foto
              </div>
            </div>

            <div
              style={{
                marginTop: 22,
                display: 'flex',
                gap: 10,
                justifyContent:
                  'flex-end',
                flexWrap: 'wrap'
              }}
            >
              {editingId && (
                <button
                  type="button"
                  className="seller-button seller-secondary"
                  onClick={
                    resetForm
                  }
                  disabled={
                    saving ||
                    uploading
                  }
                >
                  Batal
                </button>
              )}

              <button
                type="submit"
                className="seller-button seller-primary"
                disabled={
                  saving ||
                  uploading
                }
              >
                {uploading
                  ? 'Mengupload foto...'
                  : saving
                    ? 'Menyimpan...'
                    : editingId
                      ? 'Simpan Perubahan'
                      : 'Tambah Produk'}
              </button>
            </div>
          </form>
        </section>

        <section>
          <div
            style={{
              display: 'flex',
              justifyContent:
                'space-between',
              alignItems:
                'center',
              gap: 12,
              marginBottom: 14,
              flexWrap: 'wrap'
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: 21
                }}
              >
                Produk Saya
              </h2>

              <p
                style={{
                  margin:
                    '5px 0 0',
                  opacity: 0.55,
                  fontSize: 13
                }}
              >
                Semua produk yang dibuat
                oleh akun seller ini.
              </p>
            </div>
          </div>

          {loadingProducts ? (
            <div
              className="seller-glass"
              style={{
                borderRadius: 18,
                padding: 28,
                textAlign:
                  'center',
                opacity: 0.7
              }}
            >
              Memuat produk...
            </div>
          ) : products.length === 0 ? (
            <div
              className="seller-glass"
              style={{
                borderRadius: 18,
                padding: 35,
                textAlign:
                  'center'
              }}
            >
              <div
                style={{
                  fontSize: 17,
                  fontWeight: 700,
                  marginBottom: 7
                }}
              >
                Belum ada produk
              </div>

              <div
                style={{
                  opacity: 0.55,
                  fontSize: 13
                }}
              >
                Tambahkan produk pertama
              </div>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gap: 14
              }}
            >
              {products.map(
                product => {
                  const productImages =
                    getProductImages(
                      product
                    );

                  const canEdit =
                    product.status !==
                      'sold' &&
                    product.status !==
                      'in_transaction';

                  return (
                    <article
                      key={
                        product.id
                      }
                      className="seller-glass seller-product-card"
                    >
                      <div className="seller-product-image">
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
                                '100%',
                              height:
                                '100%',
                              objectFit:
                                'cover',
                              display:
                                'block'
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width:
                                '100%',
                              height:
                                '100%',
                              display:
                                'flex',
                              alignItems:
                                'center',
                              justifyContent:
                                'center',
                              opacity:
                                0.45,
                              fontSize:
                                12
                            }}
                          >
                            Tidak ada foto
                          </div>
                        )}
                      </div>

                      <div
                        style={{
                          minWidth: 0,
                          display:
                            'flex',
                          flexDirection:
                            'column'
                        }}
                      >
                        <div
                          style={{
                            display:
                              'flex',
                            justifyContent:
                              'space-between',
                            alignItems:
                              'flex-start',
                            gap: 10,
                            flexWrap:
                              'wrap'
                          }}
                        >
                          <div
                            style={{
                              minWidth: 0
                            }}
                          >
                            <h3
                              style={{
                                margin:
                                  0,
                                fontSize:
                                  18,
                                wordBreak:
                                  'break-word'
                              }}
                            >
                              {product.title ||
                                'Tanpa nama'}
                            </h3>

                            <div
                              style={{
                                marginTop:
                                  6,
                                fontSize:
                                  12,
                                opacity:
                                  0.55
                              }}
                            >
                              {product.category ||
                                '-'}{' '}
                              •{' '}
                              {productImages.length ||
                                0}{' '}
                              foto
                            </div>
                          </div>

                          <span
                            className={getStatusClass(
                              product.status
                            )}
                          >
                            {getStatusLabel(
                              product.status
                            )}
                          </span>
                        </div>

                        <div
                          style={{
                            marginTop:
                              13,
                            fontSize:
                              21,
                            fontWeight:
                              800
                          }}
                        >
                          {rupiah(
                            product.price ||
                              0
                          )}
                        </div>

                        <div
                          style={{
                            display:
                              'flex',
                            gap: 8,
                            flexWrap:
                              'wrap',
                            marginTop:
                              8,
                            fontSize:
                              12,
                            opacity:
                              0.65
                          }}
                        >
                          <span>
                            Stok:{' '}
                            {product.stock ??
                              0}
                          </span>

                          <span>
                            •
                          </span>

                          <span>
                            {getVisibilityLabel(
                              product.visibility
                            )}
                          </span>

                          <span>
                            •
                          </span>

                          <span>
                            {formatDate(
                              product.updatedAt ||
                                product.createdAt
                            )}
                          </span>
                        </div>

                        {product.description && (
                          <p
                            style={{
                              margin:
                                '12px 0 0',
                              opacity:
                                0.68,
                              fontSize:
                                13,
                              lineHeight:
                                1.55,
                              display:
                                '-webkit-box',
                              WebkitLineClamp:
                                3,
                              WebkitBoxOrient:
                                'vertical',
                              overflow:
                                'hidden'
                            }}
                          >
                            {
                              product.description
                            }
                          </p>
                        )}

                        <div
                          style={{
                            marginTop:
                              'auto',
                            paddingTop:
                              16,
                            display:
                              'flex',
                            gap: 8,
                            flexWrap:
                              'wrap'
                          }}
                        >
                          <button
                            type="button"
                            className="seller-button seller-secondary"
                            onClick={() =>
                              startEdit(
                                product
                              )
                            }
                            disabled={
                              !canEdit
                            }
                          >
                            {product.status ===
                            'sold'
                              ? 'Terjual'
                              : product.status ===
                                  'in_transaction'
                                ? 'Dalam Transaksi'
                                : 'Edit'}
                          </button>

                          <button
                            type="button"
                            className="seller-button seller-danger"
                            onClick={() =>
                              handleDelete(
                                product
                              )
                            }
                            disabled={
                              product.status ===
                              'in_transaction'
                            }
                          >
                            Hapus
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                }
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
