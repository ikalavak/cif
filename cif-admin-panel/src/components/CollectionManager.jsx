import React, { useEffect, useMemo, useState } from 'react';
import { db } from '../firebaseClient';
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

/**
 * CollectionManager renders a full CRUD table (search, create, edit, delete,
 * quick-toggle boolean fields) for a single Firestore collection.
 *
 * Uses onSnapshot (not a one-off getDocs) so any change — made here, by a
 * teammate in another tab, or written directly to Firestore — appears
 * instantly for everyone with this page open, and is what your mobile app /
 * website should also subscribe to for the same live behaviour.
 *
 * Usage: see src/pages/Events.jsx for a full example config.
 */
export default function CollectionManager({
  collectionName,
  title,
  subtitle,
  fields,
  orderByField = 'created_at',
  orderDirection = 'desc',
  searchFields = [],
  emptyLabel = 'No items yet.',
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState(null); // null | 'new' | doc id

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

  const save = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editingId === 'new') {
        await addDoc(collection(db, collectionName), { ...form, created_at: serverTimestamp() });
      } else {
        const { id, ...rest } = form;
        await updateDoc(doc(db, collectionName, editingId), rest);
      }
      cancelEdit();
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this item? This cannot be undone.')) return;
    try {
      await deleteDoc(doc(db, collectionName, id));
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleField = async (item, key) => {
    try {
      await updateDoc(doc(db, collectionName, item.id), { [key]: !item[key] });
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
              if (f.type === 'checkbox') return null; // rendered separately below
              return (
                <div key={f.key} style={f.wide ? { gridColumn: '1 / -1' } : undefined}>
                  <label>{f.label}</label>
                  {f.type === 'textarea' ? (
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
                    {f.type === 'checkbox' ? (
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
