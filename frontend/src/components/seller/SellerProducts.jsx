import { useEffect, useMemo, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../../services/firebase";
import { rupiah } from "../../utils/format";
/**
 * SellerProducts
 *
 * Reusable seller-product manager/display component.
 *
 * Supported props:
 * - sellerUid: Firebase Auth UID used to load the seller's products.
 * - products: optional externally supplied product array. When supplied,
 *   Firestore loading is skipped.
 * - editable: enables edit/delete controls. Defaults to false.
 * - showStatus: shows moderation status. Defaults to true.
 * - showStock: shows stock information. Defaults to true.
 * - onProductClick(product): optional product click callback.
 * - onEdit(product): optional edit callback. If omitted, inline edit is used.
 * - onDelete(product): optional delete callback. If omitted, Firestore delete
 *   is performed.
 * - emptyText: text shown when there are no products.
 */
export default function SellerProducts({
  sellerUid = "",
  products: externalProducts,
  editable = false,
  showStatus = true,
  showStock = true,
  onProductClick,
  onEdit,
  onDelete,
  emptyText = "Belum ada produk.",
}) {
  const [firestoreProducts, setFirestoreProducts] = useState([]);
  const [loading, setLoading] = useState(
    !Array.isArray(externalProducts) && Boolean(sellerUid),
  );
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [editingId, setEditingId] = useState("");
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    imageUrl: "",
    price: "",
    stock: "",
  });
  useEffect(() => {
    if (Array.isArray(externalProducts)) {
      setLoading(false);
      setError("");
      return undefined;
    }
    if (!sellerUid) {
      setFirestoreProducts([]);
      setLoading(false);
      setError("");
      return undefined;
    }
    setLoading(true);
    setError("");
    const productsQuery = query(
      collection(db, "products"),
      where("sellerUid", "==", sellerUid),
      orderBy("createdAt", "desc"),
    );
    const unsubscribe = onSnapshot(
      productsQuery,
      (snapshot) => {
        setFirestoreProducts(
          snapshot.docs.map((item) => ({
            id: item.id,
            ...item.data(),
          })),
        );
        setLoading(false);
      },
      (err) => {
        // A missing Firestore composite index should not make the whole
        // component unusable. Retry with a single where() query.
        if (err?.code === "failed-precondition") {
          const fallbackQuery = query(
            collection(db, "products"),
            where("sellerUid", "==", sellerUid),
          );
          const fallbackUnsubscribe = onSnapshot(
            fallbackQuery,
            (fallbackSnapshot) => {
              const rows = fallbackSnapshot.docs
                .map((item) => ({
                  id: item.id,
                  ...item.data(),
                }))
                .sort((a, b) => {
                  const aTime = timestampValue(a.createdAt);
                  const bTime = timestampValue(b.createdAt);
                  return bTime - aTime;
                });
              setFirestoreProducts(rows);
              setLoading(false);
              setError("");
            },
            (fallbackError) => {
              setLoading(false);
              setError(
                fallbackError?.message ||
                  "Gagal memuat produk seller.",
              );
            },
          );
          return fallbackUnsubscribe;
        }
        setLoading(false);
        setError(err?.message || "Gagal memuat produk seller.");
      },
    );
    return () => {
      unsubscribe();
    };
  }, [sellerUid, externalProducts]);
  const products = useMemo(() => {
    const source = Array.isArray(externalProducts)
      ? externalProducts
      : firestoreProducts;
    return [...source].sort(
      (a, b) => timestampValue(b?.createdAt) - timestampValue(a?.createdAt),
    );
  }, [externalProducts, firestoreProducts]);
  function startEdit(product) {
    if (!product?.id) return;
    if (typeof onEdit === "function") {
      onEdit(product);
      return;
    }
    setEditingId(product.id);
    setEditForm({
      title: safeString(product.title),
      description: safeString(product.description),
      imageUrl: safeString(product.imageUrl),
      price: String(product.price ?? ""),
      stock: String(product.stock ?? ""),
    });
    setError("");
  }
  function cancelEdit() {
    setEditingId("");
    setEditForm({
      title: "",
      description: "",
      imageUrl: "",
      price: "",
      stock: "",
    });
  }
  async function saveEdit(product) {
    if (!product?.id) return;
    const title = safeString(editForm.title);
    const description = safeString(editForm.description);
    const imageUrl = safeString(editForm.imageUrl);
    const price = Number(editForm.price);
    const stock = Number(editForm.stock);
    if (!title) {
      setError("Nama produk wajib diisi.");
      return;
    }
    if (!Number.isFinite(price) || price < 0) {
      setError("Harga produk tidak valid.");
      return;
    }
    if (!Number.isFinite(stock) || stock < 0) {
      setError("Stok produk tidak valid.");
      return;
    }
    setBusyId(product.id);
    setError("");
    try {
      await updateDoc(doc(db, "products", product.id), {
        title,
        description,
        imageUrl,
        price,
        stock: Math.floor(stock),
        updatedAt: serverTimestamp(),
      });
      cancelEdit();
    } catch (err) {
      setError(err?.message || "Gagal memperbarui produk.");
    } finally {
      setBusyId("");
    }
  }
  async function removeProduct(product) {
    if (!product?.id) return;
    if (typeof onDelete === "function") {
      onDelete(product);
      return;
    }
    if (!editable) return;
    const confirmed = window.confirm(
      `Hapus produk "${safeString(product.title) || "tanpa nama"}"?`,
    );
    if (!confirmed) return;
    setBusyId(product.id);
    setError("");
    try {
      await deleteDoc(doc(db, "products", product.id));
    } catch (err) {
      setError(err?.message || "Gagal menghapus produk.");
    } finally {
      setBusyId("");
    }
  }
  if (loading) {
    return (
      <section className="seller-products">
        <div className="state">Memuat produk seller...</div>
      </section>
    );
  }
  return (
    <section className="seller-products">
      {error ? (
        <div className="state seller-products-error" role="alert">
          {error}
        </div>
      ) : null}
      {!products.length ? (
        <div className="state">{emptyText}</div>
      ) : (
        <div className="grid seller-products-grid">
          {products.map((product) => {
            const isEditing = editingId === product.id;
            const isBusy = busyId === product.id;
            if (isEditing) {
              return (
                <article className="product-card seller-product-editor" key={product.id}>
                  <div className="product-body">
                    <h3>Edit Produk</h3>
                    <label>
                      Nama Produk
                      <input
                        type="text"
                        value={editForm.title}
                        onChange={(event) =>
                          setEditForm((current) => ({
                            ...current,
                            title: event.target.value,
                          }))
                        }
                        disabled={isBusy}
                      />
                    </label>
                    <label>
                      Deskripsi
                      <textarea
                        value={editForm.description}
                        onChange={(event) =>
                          setEditForm((current) => ({
                            ...current,
                            description: event.target.value,
                          }))
                        }
                        disabled={isBusy}
                      />
                    </label>
                    <label>
                      URL Gambar
                      <input
                        type="url"
                        value={editForm.imageUrl}
                        onChange={(event) =>
                          setEditForm((current) => ({
                            ...current,
                            imageUrl: event.target.value,
                          }))
                        }
                        disabled={isBusy}
                      />
                    </label>
                    <label>
                      Harga
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={editForm.price}
                        onChange={(event) =>
                          setEditForm((current) => ({
                            ...current,
                            price: event.target.value,
                          }))
                        }
                        disabled={isBusy}
                      />
                    </label>
                    <label>
                      Stok
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={editForm.stock}
                        onChange={(event) =>
                          setEditForm((current) => ({
                            ...current,
                            stock: event.target.value,
                          }))
                        }
                        disabled={isBusy}
                      />
                    </label>
                    <div className="product-actions">
                      <button
                        type="button"
                        className="button primary"
                        onClick={() => saveEdit(product)}
                        disabled={isBusy}
                      >
                        {isBusy ? "Menyimpan..." : "Simpan"}
                      </button>
                      <button
                        type="button"
                        className="button"
                        onClick={cancelEdit}
                        disabled={isBusy}
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                </article>
              );
            }
            return (
              <article
                className="product-card seller-product-card"
                key={product.id}
              >
                <button
                  type="button"
                  className="seller-product-image-button"
                  onClick={() =>
                    typeof onProductClick === "function"
                      ? onProductClick(product)
                      : undefined
                  }
                  disabled={typeof onProductClick !== "function"}
                  aria-label={`Buka ${safeString(product.title) || "produk"}`}
                >
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={safeString(product.title) || "Produk"}
                      loading="lazy"
                    />
                  ) : (
                    <div className="seller-product-image-placeholder">
                      Tidak ada gambar
                    </div>
                  )}
                </button>
                <div className="product-body">
                  {product.category ? (
                    <span className="muted">{product.category}</span>
                  ) : null}
                  <h3>{safeString(product.title) || "Produk tanpa nama"}</h3>
                  <strong>{rupiah(product.price)}</strong>
                  {showStock ? (
                    <p>
                      Stok{" "}
                      {Number.isFinite(Number(product.stock))
                        ? Number(product.stock)
                        : 0}
                    </p>
                  ) : null}
                  {showStatus ? (
                    <span
                      className={`badge seller-product-status status-${normalizeStatus(
                        product.status,
                      )}`}
                    >
                      {formatStatus(product.status)}
                    </span>
                  ) : null}
                  {product.description ? (
                    <p className="muted seller-product-description">
                      {product.description}
                    </p>
                  ) : null}
                  {editable ? (
                    <div className="product-actions">
                      <button
                        type="button"
                        className="button"
                        onClick={() => startEdit(product)}
                        disabled={isBusy}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="button"
                        onClick={() => removeProduct(product)}
                        disabled={isBusy}
                      >
                        {isBusy ? "Memproses..." : "Hapus"}
                      </button>
                    </div>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
function safeString(value) {
  return typeof value === "string" ? value.trim() : "";
}
function normalizeStatus(value) {
  return safeString(value).toLowerCase().replace(/[^a-z0-9_-]/g, "-") || "unknown";
}
function formatStatus(value) {
  const status = safeString(value);
  if (!status) return "Status tidak tersedia";
  const labels = {
    pending: "Menunggu Persetujuan",
    available: "Tersedia",
    unavailable: "Tidak Tersedia",
    rejected: "Ditolak",
    draft: "Draft",
    archived: "Diarsipkan",
  };
  return labels[status.toLowerCase()] || status;
}
function timestampValue(value) {
  if (!value) return 0;
  if (typeof value?.toMillis === "function") {
    return value.toMillis();
  }
  if (typeof value?.seconds === "number") {
    return value.seconds * 1000;
  }
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}
