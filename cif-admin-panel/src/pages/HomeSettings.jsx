import React, { useEffect, useState } from "react";
import { db } from "../firebaseClient";
import { doc, onSnapshot, setDoc } from "firebase/firestore";

const DOC_REF_PATH = ["site_settings", "home"];

export default function HomeSettings() {
  const [heroImageUrl, setHeroImageUrl] = useState("");
  const [savedUrl, setSavedUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const ref = doc(db, ...DOC_REF_PATH);
    const unsubscribe = onSnapshot(
      ref,
      (snap) => {
        const url = snap.exists() ? snap.data().hero_image_url || "" : "";
        setHeroImageUrl(url);
        setSavedUrl(url);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
    );
    return unsubscribe;
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    setSaved(false);
    try {
      await setDoc(
        doc(db, ...DOC_REF_PATH),
        { hero_image_url: heroImageUrl },
        { merge: true },
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.message);
    }
    setSaving(false);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Home Settings</h1>
          <p className="muted">
            Controls the hero banner shown on the app's home screen — updates
            live, no app update needed.
          </p>
        </div>
      </div>

      {error && (
        <div className="form-error" style={{ marginBottom: 16 }}>
          {error}
        </div>
      )}

      {loading ? (
        <p className="muted">Loading...</p>
      ) : (
        <form className="edit-panel" onSubmit={save} style={{ maxWidth: 640 }}>
          <label>Hero image URL</label>
          <input
            type="text"
            value={heroImageUrl}
            onChange={(e) => setHeroImageUrl(e.target.value)}
            placeholder="https://..."
          />
          <p className="muted" style={{ marginTop: 4, marginBottom: 16 }}>
            Paste a direct link to an image (must be a working, publicly
            accessible URL — ending in .jpg, .png, etc). This same image is used
            for the hero banner and the festival event cards on the home screen.
          </p>

          {heroImageUrl && (
            <div style={{ marginBottom: 16 }}>
              <label>Preview</label>
              <img
                src={heroImageUrl}
                alt="Hero preview"
                style={{
                  width: "100%",
                  maxWidth: 400,
                  borderRadius: 12,
                  border: "1px solid #e3e5ea",
                }}
                onError={(e) => {
                  e.target.style.display = "none";
                }}
                onLoad={(e) => {
                  e.target.style.display = "block";
                }}
              />
            </div>
          )}

          <div className="form-actions">
            <button className="btn-primary" type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </button>
            {saved && (
              <span
                style={{ color: "#1c8a4b", fontSize: 13, alignSelf: "center" }}
              >
                Saved — live now
              </span>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
