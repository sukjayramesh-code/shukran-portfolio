import React, { useEffect, useRef, useState } from "react";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import AddPhotoAlternateRoundedIcon from "@mui/icons-material/AddPhotoAlternateRounded";
import { MAX_PHOTOS_PER_POST } from "../config/contentRepo";
import { tokenStore, verifyToken, imageUrl } from "../lib/achievementsStore";

// Esc to close + stop the page behind from scrolling while a modal is open.
function useModal(onClose, locked) {
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && !locked) closeRef.current();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [locked]);
}

function ModalShell({ title, onClose, locked, children }) {
  useModal(onClose, locked);
  return (
    <div
      className="ach-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !locked) onClose();
      }}
    >
      <div className="ach-modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="ach-modal-head">
          <span className="ach-modal-title">{title}</span>
          <button
            type="button"
            className="ach-icon-btn"
            onClick={onClose}
            disabled={locked}
            aria-label="Close"
          >
            <CloseRoundedIcon fontSize="small" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Owner login                                                         */
/* ------------------------------------------------------------------ */

export function OwnerLoginModal({ onClose, onSuccess }) {
  const [token, setToken] = useState("");
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    const t = token.trim();
    if (!t) return;
    setBusy(true);
    setError("");
    try {
      await verifyToken(t);
      tokenStore.set(t, remember);
      onSuccess(t);
    } catch (err) {
      setError(
        err.status === 401
          ? "That token isn't valid, or it has expired."
          : err.message || "Couldn't verify the token."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalShell title="owner login" onClose={onClose} locked={busy}>
      <form onSubmit={submit} className="ach-form">
        <p className="ach-hint">
          Paste your GitHub access token to add, edit or delete achievements.
          It stays in this browser only.
        </p>
        <label className="ach-label">
          GitHub token
          <input
            className="ach-input"
            type="password"
            autoComplete="off"
            spellCheck={false}
            autoFocus
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="github_pat_…"
          />
        </label>
        <label className="ach-check">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          />
          Keep me signed in on this device
        </label>
        {error && <div className="ach-error">{error}</div>}
        <div className="ach-actions">
          <button type="button" className="ach-btn ach-btn--ghost" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" className="ach-btn" disabled={busy || !token.trim()}>
            {busy ? "Checking…" : "Unlock"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

/* ------------------------------------------------------------------ */
/* Add / edit                                                          */
/* ------------------------------------------------------------------ */

export function AchievementEditorModal({
  mode,
  item,
  busy,
  status,
  error,
  onSubmit,
  onClose,
}) {
  const editing = mode === "edit";
  const [title, setTitle] = useState(item?.title ?? "");
  const [badge, setBadge] = useState(item?.badge ?? "");
  const [date, setDate] = useState(item?.date ?? "");
  const [caption, setCaption] = useState(item?.caption ?? "");
  // Each picked photo keeps its own preview URL so it can be revoked on removal.
  const [picked, setPicked] = useState([]); // [{ file, url }]
  const [localError, setLocalError] = useState("");
  const inputRef = useRef(null);
  const pickedRef = useRef(picked);
  useEffect(() => {
    pickedRef.current = picked;
  }, [picked]);
  useEffect(
    () => () => pickedRef.current.forEach((p) => URL.revokeObjectURL(p.url)),
    []
  );

  const files = picked.map((p) => p.file);

  const addFiles = (list) => {
    const images = Array.from(list).filter((f) => f.type.startsWith("image/"));
    setLocalError(
      images.length < list.length ? "Only image files can be added." : ""
    );
    setPicked((prev) => {
      const room = Math.max(0, MAX_PHOTOS_PER_POST - prev.length);
      const added = images
        .slice(0, room)
        .map((file) => ({ file, url: URL.createObjectURL(file) }));
      return [...prev, ...added];
    });
  };

  const removePhoto = (i) =>
    setPicked((prev) => {
      URL.revokeObjectURL(prev[i].url);
      return prev.filter((_, j) => j !== i);
    });

  const submit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setLocalError("Give it a title.");
      return;
    }
    setLocalError("");
    onSubmit({ title, badge, date, caption, files });
  };

  const shownError = localError || error;

  return (
    <ModalShell
      title={editing ? "edit achievement" : "add achievement"}
      onClose={onClose}
      locked={busy}
    >
      <form onSubmit={submit} className="ach-form">
        {!editing && (
          <div
            className="ach-drop"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              addFiles(e.dataTransfer.files);
            }}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => {
                addFiles(e.target.files);
                e.target.value = "";
              }}
            />
            {picked.length === 0 ? (
              <button
                type="button"
                className="ach-drop-empty"
                onClick={() => inputRef.current?.click()}
                disabled={busy}
              >
                <AddPhotoAlternateRoundedIcon />
                <span>Add photos</span>
                <small>click, or drop them here · up to {MAX_PHOTOS_PER_POST}</small>
              </button>
            ) : (
              <div className="ach-thumbs">
                {picked.map((p, i) => (
                  <div className="ach-thumb" key={p.url}>
                    <img src={p.url} alt={`Selected photo ${i + 1}`} />
                    <button
                      type="button"
                      className="ach-thumb-x"
                      aria-label="Remove photo"
                      onClick={() => removePhoto(i)}
                      disabled={busy}
                    >
                      <CloseRoundedIcon style={{ fontSize: 14 }} />
                    </button>
                  </div>
                ))}
                {picked.length < MAX_PHOTOS_PER_POST && (
                  <button
                    type="button"
                    className="ach-thumb ach-thumb--add"
                    onClick={() => inputRef.current?.click()}
                    aria-label="Add more photos"
                    disabled={busy}
                  >
                    +
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {editing && item?.images?.length > 0 && (
          <div className="ach-thumbs">
            {item.images.map((p) => (
              <div className="ach-thumb" key={p}>
                <img src={imageUrl(p)} alt="" />
              </div>
            ))}
          </div>
        )}
        {editing && (
          <p className="ach-hint">
            Photos can't be changed here. To swap them, delete this post and add it again.
          </p>
        )}

        <label className="ach-label">
          Title
          <input
            className="ach-input"
            value={title}
            maxLength={120}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. FIYPROC 2026/2027"
            autoFocus={editing}
            disabled={busy}
          />
        </label>

        <div className="ach-row">
          <label className="ach-label">
            Tag <span className="ach-optional">optional</span>
            <input
              className="ach-input"
              value={badge}
              maxLength={60}
              onChange={(e) => setBadge(e.target.value)}
              placeholder="Gold Medal · 5th Place"
              disabled={busy}
            />
          </label>
          <label className="ach-label ach-label--date">
            Date <span className="ach-optional">optional</span>
            <input
              className="ach-input"
              type="month"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={busy}
            />
          </label>
        </div>

        <label className="ach-label">
          Caption
          <textarea
            className="ach-input ach-textarea"
            rows={4}
            maxLength={1000}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="What was it, and what did you do?"
            disabled={busy}
          />
        </label>

        {shownError && <div className="ach-error">{shownError}</div>}
        {busy && status && <div className="ach-status">{status}</div>}

        <div className="ach-actions">
          <button type="button" className="ach-btn ach-btn--ghost" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" className="ach-btn" disabled={busy}>
            {busy ? "Saving…" : editing ? "Save changes" : "Post"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
