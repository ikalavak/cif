// cif-admin-panel/src/components/CollectionManager.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { db, storage, auth } from '../firebaseClient';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { recordAuditLog } from '../utils/auditLogger';

// --- Reusable Gallery Picker Modal ---
function GalleryPickerModal({ isOpen, onClose, onSelect }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    const q = query(collection(db, 'gallery'), orderBy('created_at', 'desc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      setImages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
    }}>
      <div style={{
        background: '#fff', padding: 24, borderRadius: 10, maxWidth: 680, width: '92%',
        maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 18 }}>Select from Media Gallery</h3>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>

        {loading ? (
          <p className="muted" style={{ textAlign: 'center', padding: 40 }}>Loading media...</p>
        ) : images.length === 0 ? (
          <p className="muted" style={{ textAlign: 'center', padding: 40 }}>No images found in gallery. Upload one first.</p>
        ) : (
          <div style={{
            overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
            gap: 12, padding: 4
          }}>
            {images.map((img) => (
              <div
                key={img.id}
                onClick={() => { onSelect(img.image_url); onClose(); }}
                style={{
                  cursor: 'pointer', border: '2px solid transparent', borderRadius: 6,
                  overflow: 'hidden', transition: 'all 0.15s ease', background: '#f5f5f5'
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#0066cc'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
              >
                <img
                  src={img.image_url}
                  alt={img.caption || 'Asset'}
                  style={{ width: '100%', height: 100, objectFit: 'cover', display: 'block' }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// --- Image Field with Direct Upload & Picker ---
function ImageFieldInput({ value, onChange, required }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const storagePath = `uploads/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    const storageRef = ref(storage, storagePath);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snap) => setProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      (err) => {
        console.error('Storage upload error:', err);
        setUploading(false);
      },
      async () => {
        const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
        onChange(downloadUrl);
        // Register upload in the gallery collection
        const docRef = await addDoc(collection(db, 'gallery'), {
          image_url: downloadUrl,
          storage_path: storagePath,
          caption: file.name,
          created_at: serverTimestamp(),
        }).catch(() => null);

        if (docRef) {
          await recordAuditLog({
            action: 'CREATE',
            resource: 'gallery',
            resourceId: docRef.id,
            actor: auth.currentUser,
            details: { caption: file.name, image_url: downloadUrl },
          });
        }

        setUploading(false);
        setProgress(0);
      }
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          type="text"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Paste URL or upload image"
          required={required}
          style={{ flex: 1 }}
        />
        <label className="btn-secondary" style={{ cursor: 'pointer', margin: 0, whiteSpace: 'nowrap' }}>
          {uploading ? `${progress}%` : 'Upload File'}
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={uploading}
            style={{ display: 'none' }}
          />
        </label>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => setIsPickerOpen(true)}
          style={{ whiteSpace: 'nowrap' }}
        >
          Pick from Gallery
        </button>
      </div>

      {value && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img
            src={value}
            alt="Preview"
            style={{ width: 120, height: 75, objectFit: 'cover', borderRadius: 6, border: '1px solid #e0e0e0' }}
          />
          <button
            type="button"
            className="link-btn danger"
            onClick={() => onChange('')}
            style={{ fontSize: 12 }}
          >
            Remove Image
          </button>
        </div>
      )}

      <GalleryPickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelect={(url) => onChange(url)}
      />
    </div>
  );
}

// --- Main CollectionManager ---
export default function CollectionManager({
  collectionName,
  title,
  subtitle,
  fields,
  orderByField = 'created_at',
  orderDirection = 'desc',
  searchFields = [],
  emptyLabel = 'No items yet.',
  onAfterCreate,
  onAfterUpdate,
  onAfterDelete,
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState(null);

  const emptyForm = useMemo(() => {
    const obj = {};
    fields.forEach((f) => {
      obj[f.key] = f.type === 'checkbox' ? !!f.default : (f.default ?? '');
    });
    return obj;
  }, [fields]);

  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, collectionName), orderBy(orderByField, orderDirection));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setItems(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, [collectionName, orderByField, orderDirection]);

  const startCreate = () => {
    setForm(emptyForm);
    setEditingId('new');
  };

  const startEdit = (item) => {
    setForm(item);
    setEditingId(item.id);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const getRecordLabel = (data) => {
    return data?.title || data?.name || data?.caption || data?.headline || 'Record';
  };

  const save = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editingId === 'new') {
        const payload = { ...form, created_at: serverTimestamp() };
        const docRef = await addDoc(collection(db, collectionName), payload);

        // Audit Log: Create action
        await recordAuditLog({
          action: 'CREATE',
          resource: collectionName,
          resourceId: docRef.id,
          actor: auth.currentUser,
          details: {
            label: getRecordLabel(payload),
            ...payload,
          },
        });

        if (onAfterCreate) await onAfterCreate(docRef.id, payload);
      } else {
        const { id, ...rest } = form;
        await updateDoc(doc(db, collectionName, editingId), rest);

        // Audit Log: Update action
        await recordAuditLog({
          action: 'UPDATE',
          resource: collectionName,
          resourceId: editingId,
          actor: auth.currentUser,
          details: {
            label: getRecordLabel(rest),
            ...rest,
          },
        });

        if (onAfterUpdate) await onAfterUpdate(editingId, rest);
      }
      cancelEdit();
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this item? This cannot be undone.')) return;
    const itemToDelete = items.find((i) => i.id === id);
    try {
      await deleteDoc(doc(db, collectionName, id));

      // Audit Log: Delete action
      await recordAuditLog({
        action: 'DELETE',
        resource: collectionName,
        resourceId: id,
        actor: auth.currentUser,
        details: {
          label: getRecordLabel(itemToDelete),
        },
      });

      if (onAfterDelete) await onAfterDelete(id, itemToDelete);
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleField = async (item, key) => {
    const nextValue = !item[key];
    try {
      await updateDoc(doc(db, collectionName, item.id), { [key]: nextValue });

      // Audit Log: Toggle field action
      await recordAuditLog({
        action: 'UPDATE',
        resource: collectionName,
        resourceId: item.id,
        actor: auth.currentUser,
        details: {
          label: getRecordLabel(item),
          field: key,
          from: item[key],
          to: nextValue,
        },
      });
    } catch (err) {
      setError(err.message);
    }
  };

  const filtered = items.filter((item) => {
    if (!search) return true;
    const haystack = (searchFields.length ? searchFields : fields.map((f) => f.key))
      .map((k) => String(item[k] ?? '').toLowerCase())
      .join(' ');
    return haystack.includes(search.toLowerCase());
  });

  const tableFields = fields.filter((f) => f.showInTable !== false);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{title}</h1>
          <p className="muted">{subtitle}</p>
        </div>
        <button className="btn-primary" onClick={startCreate}>+ Create</button>
      </div>

      <input
        className="search-input"
        placeholder="Search..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {error && <div className="form-error" style={{ marginBottom: 16 }}>{error}</div>}

      {editingId && (
        <form className="edit-panel" onSubmit={save}>
          <h3>{editingId === 'new' ? `New ${title.replace(/s$/, '')}` : `Edit ${title.replace(/s$/, '')}`}</h3>
          <div className="form-grid">
            {fields.map((f) => {
              if (f.type === 'checkbox') return null;
              return (
                <div key={f.key} style={f.wide || f.type === 'image' ? { gridColumn: '1 / -1' } : undefined}>
                  <label>{f.label}</label>
                  {f.type === 'image' ? (
                    <ImageFieldInput
                      value={form[f.key]}
                      onChange={(url) => setForm({ ...form, [f.key]: url })}
                      required={f.required}
                    />
                  ) : f.type === 'textarea' ? (
                    <textarea
                      rows={4}
                      value={form[f.key] ?? ''}
                      onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    />
                  ) : f.type === 'select' ? (
                    <select value={form[f.key] ?? ''} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}>
                      {(f.options || []).map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={f.type === 'datetime' ? 'datetime-local' : f.type === 'number' ? 'number' : 'text'}
                      value={
                        f.type === 'datetime' && form[f.key]
                          ? String(form[f.key]).slice(0, 16)
                          : form[f.key] ?? ''
                      }
                      onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                      required={f.required}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {fields.some((f) => f.type === 'checkbox') && (
            <div className="checkbox-row">
              {fields.filter((f) => f.type === 'checkbox').map((f) => (
                <label key={f.key}>
                  <input
                    type="checkbox"
                    checked={!!form[f.key]}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.checked })}
                  />
                  {f.label}
                </label>
              ))}
            </div>
          )}

          <div className="form-actions">
            <button className="btn-primary" type="submit">Save</button>
            <button className="btn-secondary" type="button" onClick={cancelEdit}>Cancel</button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="muted">Loading...</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              {tableFields.map((f) => <th key={f.key}>{f.label}</th>)}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id}>
                {tableFields.map((f) => (
                  <td key={f.key}>
                    {f.type === 'image' && item[f.key] ? (
                      <img
                        src={item[f.key]}
                        alt="Thumbnail"
                        style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 4, display: 'block' }}
                      />
                    ) : f.type === 'checkbox' ? (
                      <button className="toggle-btn" onClick={() => toggleField(item, f.key)}>
                        {item[f.key] ? 'Yes' : 'No'}
                      </button>
                    ) : f.type === 'datetime' && item[f.key] ? (
                      new Date(item[f.key]).toLocaleString()
                    ) : (
                      String(item[f.key] ?? '—')
                    )}
                  </td>
                ))}
                <td className="actions-cell">
                  <button className="link-btn" onClick={() => startEdit(item)}>Edit</button>
                  <button className="link-btn danger" onClick={() => remove(item.id)}>Delete</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={tableFields.length + 1} className="muted" style={{ textAlign: 'center', padding: 24 }}>{emptyLabel}</td></tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}