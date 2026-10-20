import React, { useEffect, useRef, useState, useCallback } from "react";
import "../styles/Achievements.css";
import FadeInSection from "./FadeInSection";
import { OwnerLoginModal, AchievementEditorModal } from "./AchievementModals";
import { achievementsSeed } from "../data/achievementsSeed";
import {
  tokenStore,
  loadPublic,
  readIndex,
  addAchievement,
  updateAchievement,
  deleteAchievement,
  imageUrl,
  formatMonth,
} from "../lib/achievementsStore";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";

const INITIAL_VISIBLE = 6;

// Shown for posts without a photo.
const TROPHY = String.raw`
 ._________.
 |  _____  |
(| |     | |)
 \ \_____/ /
  '._   _.'
     | |
    _| |_
   |_____|
`;

function Placeholder() {
  return (
    <pre className="ach-ascii" aria-hidden="true">
      {TROPHY}
    </pre>
  );
}

function CardImage({ path, alt }) {
  const [broken, setBroken] = useState(false);
  if (!path || broken) return <Placeholder />;
  return (
    <img
      src={imageUrl(path)}
      alt={alt}
      loading="lazy"
      onError={() => setBroken(true)}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Lightbox                                                            */
/* ------------------------------------------------------------------ */

function Lightbox({ item, startIndex, onClose }) {
  const [index, setIndex] = useState(startIndex);
  const count = item.images.length;
  const go = useCallback(
    (d) => setIndex((i) => (count ? (i + d + count) % count : 0)),
    [count]
  );

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose, go]);

  return (
    <div
      className="ach-overlay ach-overlay--light"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="ach-lightbox" role="dialog" aria-modal="true" aria-label={item.title}>
        <button
          type="button"
          className="ach-icon-btn ach-lightbox-close"
          onClick={onClose}
          aria-label="Close"
        >
          <CloseRoundedIcon />
        </button>

        <div className="ach-lightbox-media">
          {count > 1 && (
            <button
              type="button"
              className="ach-nav ach-nav--prev"
              onClick={() => go(-1)}
              aria-label="Previous photo"
            >
              <ChevronLeftRoundedIcon />
            </button>
          )}
          {count ? (
            <img src={imageUrl(item.images[index])} alt={item.title} />
          ) : (
            <Placeholder />
          )}
          {count > 1 && (
            <button
              type="button"
              className="ach-nav ach-nav--next"
              onClick={() => go(1)}
              aria-label="Next photo"
            >
              <ChevronRightRoundedIcon />
            </button>
          )}
        </div>

        <div className="ach-lightbox-text">
          <div className="ach-lightbox-meta">
            {item.badge && <span className="ach-badge">{item.badge}</span>}
            {item.date && <span className="ach-date">{formatMonth(item.date)}</span>}
            {count > 1 && (
              <span className="ach-date">
                {index + 1} / {count}
              </span>
            )}
          </div>
          <h3 className="ach-lightbox-title">{item.title}</h3>
          {item.caption && <p className="ach-lightbox-caption">{item.caption}</p>}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Section                                                             */
/* ------------------------------------------------------------------ */

const Achievements = () => {
  const [items, setItems] = useState(achievementsSeed);
  const [saved, setSaved] = useState(false); // true once loaded from / written to the content branch
  const [token, setToken] = useState(() => tokenStore.get());
  const [showAll, setShowAll] = useState(false);

  const [showLogin, setShowLogin] = useState(false);
  const [editor, setEditor] = useState(null); // { mode: "add" | "edit", item? }
  const [lightbox, setLightbox] = useState(null); // { item, index }
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const owner = Boolean(token);
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const logout = useCallback((message = "") => {
    tokenStore.clear();
    setToken("");
    setEditor(null);
    setNotice(message);
  }, []);

  // Load: owners read through the API (always fresh); visitors read the raw file.
  useEffect(() => {
    let alive = true;
    (async () => {
      let list = null;
      try {
        if (token) {
          try {
            list = (await readIndex(token)).items;
          } catch (e) {
            if (e.status === 401) {
              if (alive) logout("Your session expired. Log in again to edit.");
              return;
            }
            list = await loadPublic();
          }
        } else {
          list = await loadPublic();
        }
      } catch {
        /* offline or not published yet: keep the starter entries */
      }
      if (alive && list) {
        setItems(list);
        setSaved(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [token, logout]);

  const handleError = (e) => {
    if (e.status === 401) {
      logout("Your session expired. Log in again to edit.");
      return;
    }
    setError(
      e.status === 403 || e.status === 404
        ? "GitHub refused the change. Check that your token can write to the repo (Contents: Read and write)."
        : e.message || "Something went wrong. Try again."
    );
  };

  const save = async (payload) => {
    setBusy(true);
    setError("");
    setStatus("Preparing…");
    try {
      const next =
        editor.mode === "add"
          ? await addAchievement(token, payload, itemsRef.current, setStatus)
          : await updateAchievement(token, editor.item.id, payload, itemsRef.current);
      setItems(next);
      setSaved(true);
      setEditor(null);
      setNotice(
        editor.mode === "add"
          ? "Posted. It can take a minute to show for other visitors."
          : "Saved."
      );
    } catch (e) {
      handleError(e);
    } finally {
      setBusy(false);
      setStatus("");
    }
  };

  const remove = async (item) => {
    if (!window.confirm(`Delete "${item.title}"? This can't be undone.`)) return;
    setBusy(true);
    setNotice("");
    setError("");
    try {
      const next = await deleteAchievement(token, item, itemsRef.current);
      setItems(next);
      setSaved(true);
      setNotice("Deleted.");
    } catch (e) {
      handleError(e);
    } finally {
      setBusy(false);
    }
  };

  const visible = showAll ? items : items.slice(0, INITIAL_VISIBLE);

  return (
    <div id="achievements">
      <div className="section-header">
        <span className="section-title">/ achievements</span>
        <div className="ach-header-tools">
          {owner ? (
            <>
              <button
                type="button"
                className="ach-btn ach-btn--small"
                onClick={() => {
                  setNotice("");
                  setError("");
                  setEditor({ mode: "add" });
                }}
                disabled={busy}
              >
                <AddRoundedIcon style={{ fontSize: 18 }} /> Add achievement
              </button>
              <button
                type="button"
                className="ach-icon-btn"
                onClick={() => logout()}
                title="Log out"
                aria-label="Log out"
              >
                <LogoutRoundedIcon fontSize="small" />
              </button>
            </>
          ) : (
            <button
              type="button"
              className="ach-icon-btn ach-lock"
              onClick={() => setShowLogin(true)}
              title="Owner login"
              aria-label="Owner login"
            >
              <LockOutlinedIcon fontSize="small" />
            </button>
          )}
        </div>
      </div>

      <FadeInSection delay="200ms">
        <div className="ach-description">
          Medals, awards and competitions along the way.
        </div>
      </FadeInSection>

      {owner && !saved && (
        <div className="ach-notice">
          These are starter entries. They'll be saved along with your first post.
        </div>
      )}
      {notice && <div className="ach-notice">{notice}</div>}
      {error && !editor && <div className="ach-error ach-error--bar">{error}</div>}

      {items.length === 0 ? (
        <div className="ach-empty">Nothing here yet.</div>
      ) : (
        <div className="ach-grid">
          {visible.map((item, i) => (
            <FadeInSection key={item.id} delay={(i % 3) * 100 + "ms"}>
              <article className="ach-card">
                <button
                  type="button"
                  className="ach-media"
                  onClick={() => setLightbox({ item, index: 0 })}
                  aria-label={`Open ${item.title}`}
                >
                  <CardImage path={item.images[0]} alt={item.title} />
                  {item.images.length > 1 && (
                    <span className="ach-count">+{item.images.length - 1}</span>
                  )}
                </button>

                {owner && (
                  <div className="ach-admin">
                    <button
                      type="button"
                      className="ach-icon-btn ach-icon-btn--solid"
                      onClick={() => {
                        setNotice("");
                        setError("");
                        setEditor({ mode: "edit", item });
                      }}
                      disabled={busy}
                      aria-label={`Edit ${item.title}`}
                      title="Edit"
                    >
                      <EditOutlinedIcon fontSize="small" />
                    </button>
                    <button
                      type="button"
                      className="ach-icon-btn ach-icon-btn--solid ach-icon-btn--danger"
                      onClick={() => remove(item)}
                      disabled={busy}
                      aria-label={`Delete ${item.title}`}
                      title="Delete"
                    >
                      <DeleteOutlineRoundedIcon fontSize="small" />
                    </button>
                  </div>
                )}

                <div className="ach-body">
                  <div className="ach-meta">
                    {item.badge && <span className="ach-badge">{item.badge}</span>}
                    {item.date && <span className="ach-date">{formatMonth(item.date)}</span>}
                  </div>
                  <div className="card-title ach-title">{item.title}</div>
                  {item.caption && <p className="ach-caption">{item.caption}</p>}
                </div>
              </article>
            </FadeInSection>
          ))}
        </div>
      )}

      {items.length > INITIAL_VISIBLE && (
        <button
          type="button"
          className="ach-more"
          onClick={() => setShowAll((s) => !s)}
        >
          {showAll ? "Show less" : `Show all ${items.length}`}
        </button>
      )}

      {showLogin && (
        <OwnerLoginModal
          onClose={() => setShowLogin(false)}
          onSuccess={(t) => {
            setToken(t);
            setShowLogin(false);
            setNotice("");
          }}
        />
      )}

      {editor && (
        <AchievementEditorModal
          mode={editor.mode}
          item={editor.item}
          busy={busy}
          status={status}
          error={error}
          onSubmit={save}
          onClose={() => {
            setEditor(null);
            setError("");
          }}
        />
      )}

      {lightbox && (
        <Lightbox
          item={lightbox.item}
          startIndex={lightbox.index}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  );
};

export default Achievements;
