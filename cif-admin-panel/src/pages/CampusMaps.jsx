// cif-admin-panel/src/pages/CampusMaps.jsx
import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebaseClient';

export default function CampusMaps() {
  const [docklandsUrl, setDocklandsUrl] = useState('');
  const [stratfordUrl, setStratfordUrl] = useState('');
  const [docklandsDesc, setDocklandsDesc] = useState('');
  const [stratfordDesc, setStratfordDesc] = useState('');

  const [docklandsUploadProgress, setDocklandsUploadProgress] = useState(null);
  const [stratfordUploadProgress, setStratfordUploadProgress] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState('');

  // 1. Fetch current settings
  useEffect(() => {
    async function fetchMaps() {
      try {
        const snap = await getDoc(doc(db, 'site_settings', 'campus_maps'));
        if (snap.exists()) {
          const data = snap.data();
          setDocklandsUrl(data.docklands_map_url || '');
          setStratfordUrl(data.stratford_map_url || '');
          setDocklandsDesc(data.docklands_description || '');
          setStratfordDesc(data.stratford_description || '');
        }
      } catch (err) {
        console.error('Error fetching campus map settings:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchMaps();
  }, []);

  // 2. Upload file helper
  const handleFileUpload = (e, campusType) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, WebP).');
      return;
    }

    const fileExt = file.name.split('.').pop();
    const storagePath = `maps/${campusType}_map_${Date.now()}.${fileExt}`;
    const storageRef = ref(storage, storagePath);
    const uploadTask = uploadBytesResumable(storageRef, file);

    const setProgress =
      campusType === 'docklands'
        ? setDocklandsUploadProgress
        : setStratfordUploadProgress;

    const setUrl =
      campusType === 'docklands' ? setDocklandsUrl : setStratfordUrl;

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const prog = Math.round(
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        );
        setProgress(prog);
      },
      (err) => {
        console.error('Upload failed:', err);
        alert('Image upload failed: ' + err.message);
        setProgress(null);
      },
      async () => {
        const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
        setUrl(downloadUrl);
        setProgress(null);
      }
    );
  };

  // 3. Save map configuration
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatusMessage('');

    try {
      await setDoc(
        doc(db, 'site_settings', 'campus_maps'),
        {
          docklands_map_url: docklandsUrl.trim(),
          stratford_map_url: stratfordUrl.trim(),
          docklands_description: docklandsDesc.trim(),
          stratford_description: stratfordDesc.trim(),
          updated_at: serverTimestamp(),
        },
        { merge: true }
      );
      setStatusMessage('Campus maps updated successfully!');
    } catch (err) {
      setStatusMessage('Failed to save configuration: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: 24 }}>Loading map settings...</div>;
  }

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: '0 0 6px 0' }}>Campus Maps Management</h1>
        <p className="muted" style={{ margin: 0 }}>
          Upload new floorplan images or paste direct image links for Docklands and Stratford campuses.
        </p>
      </div>

      {statusMessage && (
        <div
          style={{
            padding: '12px 16px',
            marginBottom: 20,
            borderRadius: 8,
            backgroundColor: statusMessage.includes('Failed') ? '#fee2e2' : '#dcfce7',
            color: statusMessage.includes('Failed') ? '#991b1b' : '#166534',
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          {statusMessage}
        </div>
      )}

      <form onSubmit={handleSave}>
        {/* =========================================================
            DOCKLANDS CAMPUS SECTION
        ========================================================= */}
        <div
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 10,
            padding: 20,
            marginBottom: 24,
          }}
        >
          <h3 style={{ marginTop: 0 }}>📍 Docklands Campus Map</h3>

          {/* Option A: Image File Picker */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 13 }}>
              Option A: Upload Image File
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileUpload(e, 'docklands')}
              disabled={docklandsUploadProgress !== null}
            />
            {docklandsUploadProgress !== null && (
              <span style={{ fontSize: 12, color: '#8b5cf6', marginLeft: 10, fontWeight: 600 }}>
                Uploading: {docklandsUploadProgress}%
              </span>
            )}
          </div>

          {/* Option B: Direct Image URL Link */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 13 }}>
              Option B: Paste Direct Image URL Link
            </label>
            <input
              type="url"
              className="search-input"
              placeholder="https://images.unsplash.com/... or https://firebasestorage..."
              value={docklandsUrl}
              onChange={(e) => setDocklandsUrl(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          {/* Campus Subtitle / Address */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 13 }}>
              Campus Address / Subtitle
            </label>
            <input
              type="text"
              className="search-input"
              placeholder="e.g. University Way, Royal Docks, London E16 2RD"
              value={docklandsDesc}
              onChange={(e) => setDocklandsDesc(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          {/* Live Preview */}
          {docklandsUrl ? (
            <div style={{ marginTop: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span className="muted" style={{ fontSize: 12 }}>
                  Live Preview:
                </span>
                <button
                  type="button"
                  className="link-btn danger"
                  style={{ fontSize: 12 }}
                  onClick={() => setDocklandsUrl('')}
                >
                  Clear Image
                </button>
              </div>
              <img
                src={docklandsUrl}
                alt="Docklands Preview"
                style={{ maxHeight: 200, maxWidth: '100%', borderRadius: 8, border: '1px solid #cbd5e1' }}
              />
            </div>
          ) : (
            <span className="muted" style={{ fontSize: 12 }}>
              * No custom URL set. The mobile app will use the default bundled asset.
            </span>
          )}
        </div>

        {/* =========================================================
            STRATFORD CAMPUS SECTION
        ========================================================= */}
        <div
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 10,
            padding: 20,
            marginBottom: 24,
          }}
        >
          <h3 style={{ marginTop: 0 }}>📍 Stratford Campus Map</h3>

          {/* Option A: Image File Picker */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 13 }}>
              Option A: Upload Image File
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileUpload(e, 'stratford')}
              disabled={stratfordUploadProgress !== null}
            />
            {stratfordUploadProgress !== null && (
              <span style={{ fontSize: 12, color: '#8b5cf6', marginLeft: 10, fontWeight: 600 }}>
                Uploading: {stratfordUploadProgress}%
              </span>
            )}
          </div>

          {/* Option B: Direct Image URL Link */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 13 }}>
              Option B: Paste Direct Image URL Link
            </label>
            <input
              type="url"
              className="search-input"
              placeholder="https://images.unsplash.com/... or https://firebasestorage..."
              value={stratfordUrl}
              onChange={(e) => setStratfordUrl(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          {/* Campus Subtitle / Address */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 13 }}>
              Campus Address / Subtitle
            </label>
            <input
              type="text"
              className="search-input"
              placeholder="e.g. Water Lane, Stratford, London E15 4LZ"
              value={stratfordDesc}
              onChange={(e) => setStratfordDesc(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          {/* Live Preview */}
          {stratfordUrl ? (
            <div style={{ marginTop: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span className="muted" style={{ fontSize: 12 }}>
                  Live Preview:
                </span>
                <button
                  type="button"
                  className="link-btn danger"
                  style={{ fontSize: 12 }}
                  onClick={() => setStratfordUrl('')}
                >
                  Clear Image
                </button>
              </div>
              <img
                src={stratfordUrl}
                alt="Stratford Preview"
                style={{ maxHeight: 200, maxWidth: '100%', borderRadius: 8, border: '1px solid #cbd5e1' }}
              />
            </div>
          ) : (
            <span className="muted" style={{ fontSize: 12 }}>
              * No custom URL set. The mobile app will use the default bundled asset.
            </span>
          )}
        </div>

        <button
          type="submit"
          className="btn-primary"
          disabled={saving || docklandsUploadProgress !== null || stratfordUploadProgress !== null}
        >
          {saving ? 'Saving...' : 'Save Campus Maps'}
        </button>
      </form>
    </div>
  );
}