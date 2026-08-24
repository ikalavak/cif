// cif-admin-panel/src/pages/Gallery.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebaseClient';

// Browser-based image compression helper
async function compressImage(file, { maxWidth = 1600, maxHeight = 1600, quality = 0.8 } = {}) {
  if (file.type === 'image/gif' || file.type === 'image/svg+xml') return file;

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        let { width, height } = img;
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => resolve(blob || file), 'image/webp', quality);
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
}

export default function Gallery() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'url'

  // Direct URL Input State
  const [externalUrl, setExternalUrl] = useState('');
  const [urlCaption, setUrlCaption] = useState('');
  const [addingUrl, setAddingUrl] = useState(false);

  // Staged Files State (for File Uploads)
  const [stagedFiles, setStagedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'gallery'), orderBy('created_at', 'desc'));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        setImages(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.error('Gallery snapshot error:', err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  // --- Handlers for Adding via URL ---
  const handleAddByUrl = async (e) => {
    e.preventDefault();
    if (!externalUrl.trim()) return;

    setAddingUrl(true);
    try {
      await addDoc(collection(db, 'gallery'), {
        image_url: externalUrl.trim(),
        storage_path: null, // No Firebase Storage path for external links
        caption: urlCaption.trim() || 'External Image',
        created_at: serverTimestamp(),
      });

      setExternalUrl('');
      setUrlCaption('');
      alert('Image added to gallery!');
    } catch (err) {
      console.error('Failed to add image via URL:', err);
      alert('Failed to save image: ' + err.message);
    } finally {
      setAddingUrl(false);
    }
  };

  // --- Handlers for File Upload Staging ---
  const stageFiles = (fileList) => {
    const validFiles = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
    if (!validFiles.length) {
      alert('Please select valid image files.');
      return;
    }

    const newItems = validFiles.map((file) => ({
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      file,
      previewUrl: URL.createObjectURL(file),
      caption: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
      progress: 0,
      status: 'ready',
      error: null,
    }));

    setStagedFiles((prev) => [...prev, ...newItems]);
  };

  const removeStaged = (id) => {
    setStagedFiles((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((i) => i.id !== id);
    });
  };

  const handleUploadAll = async () => {
    const itemsToUpload = stagedFiles.filter((item) => item.status === 'ready' || item.status === 'error');
    if (!itemsToUpload.length) return;

    setIsUploading(true);

    for (const item of itemsToUpload) {
      try {
        setStagedFiles((prev) =>
          prev.map((s) => (s.id === item.id ? { ...s, status: 'compressing' } : s))
        );

        const uploadBlob = await compressImage(item.file);
        const cleanName = item.file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9]/g, '_');
        const storagePath = `gallery/${Date.now()}_${cleanName}.webp`;
        const storageRef = ref(storage, storagePath);

        const uploadTask = uploadBytesResumable(storageRef, uploadBlob, {
          contentType: 'image/webp',
        });

        await new Promise((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snap) => {
              const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
              setStagedFiles((prev) =>
                prev.map((s) => (s.id === item.id ? { ...s, progress: pct, status: 'uploading' } : s))
              );
            },
            (err) => {
              console.error('Firebase Storage Error:', err);
              alert(`Upload error for ${item.file.name}: ${err.message}`);
              setStagedFiles((prev) =>
                prev.map((s) => (s.id === item.id ? { ...s, status: 'error', error: err.message } : s))
              );
              reject(err);
            },
            async () => {
              try {
                const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
                await addDoc(collection(db, 'gallery'), {
                  image_url: downloadUrl,
                  storage_path: storagePath,
                  caption: item.caption.trim() || item.file.name,
                  created_at: serverTimestamp(),
                });

                setStagedFiles((prev) =>
                  prev.map((s) => (s.id === item.id ? { ...s, progress: 100, status: 'done' } : s))
                );
                resolve();
              } catch (dbErr) {
                console.error('Firestore Error:', dbErr);
                alert(`Database save error: ${dbErr.message}`);
                reject(dbErr);
              }
            }
          );
        });
      } catch (e) {
        console.error('Upload skipped due to error:', e);
      }
    }

    setIsUploading(false);

    setTimeout(() => {
      setStagedFiles((prev) => {
        prev.filter((i) => i.status === 'done').forEach((i) => URL.revokeObjectURL(i.previewUrl));
        return prev.filter((i) => i.status !== 'done');
      });
    }, 1200);
  };

  const handleDelete = async (item) => {
    if (!window.confirm('Delete this image permanently from the gallery?')) return;
    try {
      if (item.storage_path) {
        const fileRef = ref(storage, item.storage_path);
        await deleteObject(fileRef).catch(() => {});
      }
      await deleteDoc(doc(db, 'gallery', item.id));
      if (selectedImage?.id === item.id) setSelectedImage(null);
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  const handleCopy = (url, id) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filtered = images.filter((img) =>
    (img.caption || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: '0 0 6px 0' }}>Media Gallery</h1>
          <p className="muted" style={{ margin: 0 }}>
            Upload files or add direct image URLs to use across events, speakers, and venues.
          </p>
        </div>
      </div>

      {/* Mode Selection Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button
          type="button"
          className={activeTab === 'upload' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setActiveTab('upload')}
          style={{ fontSize: 13 }}
        >
          📁 Upload Files
        </button>
        <button
          type="button"
          className={activeTab === 'url' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setActiveTab('url')}
          style={{ fontSize: 13 }}
        >
          🔗 Add Image URL
        </button>
      </div>

      {/* Tab 1: Drag & Drop / File Upload */}
      {activeTab === 'upload' && (
        <>
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              if (e.dataTransfer.files?.length) stageFiles(e.dataTransfer.files);
            }}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: isDragging ? '2px solid #2563eb' : '2px dashed #cbd5e1',
              backgroundColor: isDragging ? '#eff6ff' : '#f8fafc',
              borderRadius: 10,
              padding: '24px',
              textAlign: 'center',
              cursor: 'pointer',
              marginBottom: 20,
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                if (e.target.files?.length) stageFiles(e.target.files);
                e.target.value = '';
              }}
              style={{ display: 'none' }}
            />
            <p style={{ margin: '0 0 4px 0', fontWeight: 600, color: '#1e293b' }}>
              Click or drop images here to stage them
            </p>
            <span className="muted" style={{ fontSize: 13 }}>PNG, JPG, WebP, GIF</span>
          </div>

          {/* Staged Items List */}
          {stagedFiles.length > 0 && (
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 16, marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontWeight: 600 }}>Staged for upload ({stagedFiles.length})</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    disabled={isUploading}
                    onClick={() => setStagedFiles([])}
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    disabled={isUploading}
                    onClick={handleUploadAll}
                  >
                    {isUploading ? 'Uploading...' : `Upload ${stagedFiles.length} Image(s)`}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {stagedFiles.map((item) => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 8, background: '#f8fafc', borderRadius: 6 }}>
                    <img src={item.previewUrl} alt="Thumb" style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 4 }} />
                    <input
                      type="text"
                      value={item.caption}
                      disabled={isUploading}
                      onChange={(e) => {
                        const val = e.target.value;
                        setStagedFiles((prev) => prev.map((s) => (s.id === item.id ? { ...s, caption: val } : s)));
                      }}
                      style={{ flex: 1, padding: '4px 8px', fontSize: 13, border: '1px solid #cbd5e1', borderRadius: 4 }}
                    />
                    <span style={{ fontSize: 12, minWidth: 80, textAlign: 'right' }}>
                      {item.status === 'compressing' && 'Optimizing...'}
                      {item.status === 'uploading' && `${item.progress}%`}
                      {item.status === 'done' && 'Done ✓'}
                      {item.status === 'error' && 'Failed ✕'}
                    </span>
                    {!isUploading && (
                      <button type="button" className="link-btn danger" onClick={() => removeStaged(item.id)}>Remove</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Tab 2: Direct URL Input Form */}
      {activeTab === 'url' && (
        <form
          onSubmit={handleAddByUrl}
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 10,
            padding: 20,
            marginBottom: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <h3 style={{ margin: 0, fontSize: 15 }}>Add Image from External URL</h3>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <input
              type="url"
              placeholder="Image URL (e.g. https://images.unsplash.com/...)"
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
              required
              style={{ flex: 2, minWidth: 260, padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6 }}
            />
            <input
              type="text"
              placeholder="Caption / Description (optional)"
              value={urlCaption}
              onChange={(e) => setUrlCaption(e.target.value)}
              style={{ flex: 1, minWidth: 200, padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6 }}
            />
            <button className="btn-primary" type="submit" disabled={addingUrl || !externalUrl.trim()}>
              {addingUrl ? 'Adding...' : 'Save to Gallery'}
            </button>
          </div>

          {externalUrl && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
              <span className="muted" style={{ fontSize: 12 }}>Preview:</span>
              <img
                src={externalUrl}
                alt="URL Preview"
                onError={(e) => (e.target.style.display = 'none')}
                onLoad={(e) => (e.target.style.display = 'block')}
                style={{ width: 60, height: 40, objectFit: 'cover', borderRadius: 4, border: '1px solid #ddd' }}
              />
            </div>
          )}
        </form>
      )}

      {/* Filter and Live Assets */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <input
          className="search-input"
          placeholder="Filter gallery..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 300 }}
        />
        <span className="muted" style={{ fontSize: 13 }}>{filtered.length} live images</span>
      </div>

      {loading ? (
        <p className="muted">Loading gallery...</p>
      ) : filtered.length === 0 ? (
        <p className="muted" style={{ textAlign: 'center', padding: 40 }}>No images found.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
          {filtered.map((item) => (
            <div key={item.id} style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden', background: '#fff' }}>
              <div
                onClick={() => setSelectedImage(item)}
                style={{ height: 130, cursor: 'pointer', background: '#f1f5f9' }}
              >
                <img
                  src={item.image_url}
                  alt={item.caption}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    e.target.src = 'https://placehold.co/300x200?text=Invalid+Image+URL';
                  }}
                />
              </div>
              <div style={{ padding: 10 }}>
                <p style={{ margin: '0 0 8px 0', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.caption || 'Untitled'}
                </p>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button type="button" className="btn-secondary" style={{ flex: 1, fontSize: 11, padding: '4px 0' }} onClick={() => handleCopy(item.image_url, item.id)}>
                    {copiedId === item.id ? 'Copied' : 'Copy URL'}
                  </button>
                  <button type="button" className="link-btn danger" style={{ fontSize: 11 }} onClick={() => handleDelete(item)}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', padding: 16, borderRadius: 8, maxWidth: 800, maxHeight: '90vh' }}>
            <img src={selectedImage.image_url} alt={selectedImage.caption} style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }} />
            <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600 }}>{selectedImage.caption}</span>
              <button className="btn-secondary" onClick={() => setSelectedImage(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}