import {
  CONTENT_OWNER,
  CONTENT_REPO,
  CONTENT_BRANCH,
  DATA_FILE,
  IMAGE_DIR,
} from "../config/contentRepo";

const API = "https://api.github.com";
const REPO_PATH = `/repos/${CONTENT_OWNER}/${CONTENT_REPO}`;
const RAW = `https://raw.githubusercontent.com/${CONTENT_OWNER}/${CONTENT_REPO}/${CONTENT_BRANCH}`;
const TOKEN_KEY = "achv_owner_token";

export class GithubError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/* ------------------------------------------------------------------ */
/* Owner token (never in the source code; only in this browser)        */
/* ------------------------------------------------------------------ */

export const tokenStore = {
  get() {
    try {
      return (
        localStorage.getItem(TOKEN_KEY) ||
        sessionStorage.getItem(TOKEN_KEY) ||
        ""
      );
    } catch {
      return "";
    }
  },
  set(token, remember) {
    try {
      localStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(TOKEN_KEY);
      (remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, token);
    } catch {
      /* storage blocked: owner will just need to log in again next visit */
    }
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(TOKEN_KEY);
    } catch {
      /* ignore */
    }
  },
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

async function gh(token, path, { method = "GET", body } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  if (res.status === 204) return null;
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* no body */
  }
  if (!res.ok) {
    throw new GithubError(res.status, data?.message || res.statusText);
  }
  return data;
}

function utf8ToBase64(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(bin);
}

function base64ToUtf8(b64) {
  const bin = atob(b64.replace(/\s/g, ""));
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

const SAFE_PATH = /^[A-Za-z0-9_\-./]+$/;

function safeImagePath(p) {
  return (
    typeof p === "string" &&
    p.startsWith(`${IMAGE_DIR}/`) &&
    !p.includes("..") &&
    SAFE_PATH.test(p)
  );
}

// Never trust the shape of remote JSON: keep only the fields we render.
export function parseItems(json) {
  const list = Array.isArray(json) ? json : json?.items;
  if (!Array.isArray(list)) return [];
  return list
    .filter((x) => x && typeof x === "object")
    .map((x, i) => ({
      id: String(x.id ?? `item-${i}`),
      title: String(x.title ?? "").slice(0, 200),
      caption: String(x.caption ?? "").slice(0, 2000),
      badge: String(x.badge ?? "").slice(0, 80),
      date: /^\d{4}-\d{2}$/.test(String(x.date ?? "")) ? String(x.date) : "",
      images: Array.isArray(x.images) ? x.images.filter(safeImagePath) : [],
      createdAt: Number.isFinite(x.createdAt) ? x.createdAt : 0,
    }));
}

export const imageUrl = (path) => `${RAW}/${path}`;

export function formatMonth(ym) {
  if (!ym) return "";
  const [y, m] = ym.split("-").map(Number);
  const names = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${names[m - 1] ?? ""} ${y}`.trim();
}

/* ------------------------------------------------------------------ */
/* Public read (no token needed)                                       */
/* ------------------------------------------------------------------ */

// Returns an array of items, or null when nothing has been published yet.
export async function loadPublic() {
  // The minute-based query keeps GitHub's CDN cache from serving stale data.
  const res = await fetch(
    `${RAW}/${DATA_FILE}?t=${Math.floor(Date.now() / 60000)}`
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new GithubError(res.status, res.statusText);
  return parseItems(await res.json());
}

/* ------------------------------------------------------------------ */
/* Owner actions (token required; GitHub enforces who may write)       */
/* ------------------------------------------------------------------ */

export async function verifyToken(token) {
  const repo = await gh(token, REPO_PATH);
  if (repo?.permissions && !repo.permissions.push) {
    throw new GithubError(
      403,
      "This token can read the repo but can't write to it. Give it Contents: Read and write."
    );
  }
  return true;
}

async function ensureBranch(token) {
  try {
    await gh(token, `${REPO_PATH}/branches/${CONTENT_BRANCH}`);
    return;
  } catch (e) {
    if (e.status !== 404) throw e;
  }
  // Create an empty (orphan) branch so photos never mix with the site code.
  const blob = await gh(token, `${REPO_PATH}/git/blobs`, {
    method: "POST",
    body: {
      content:
        "Achievements data for the portfolio site. Managed from the site's owner panel.\n",
      encoding: "utf-8",
    },
  });
  const tree = await gh(token, `${REPO_PATH}/git/trees`, {
    method: "POST",
    body: {
      tree: [{ path: "README.md", mode: "100644", type: "blob", sha: blob.sha }],
    },
  });
  const commit = await gh(token, `${REPO_PATH}/git/commits`, {
    method: "POST",
    body: { message: "Create content branch", tree: tree.sha, parents: [] },
  });
  try {
    await gh(token, `${REPO_PATH}/git/refs`, {
      method: "POST",
      body: { ref: `refs/heads/${CONTENT_BRANCH}`, sha: commit.sha },
    });
  } catch (e) {
    if (e.status !== 422) throw e; // 422 = branch already exists (race)
  }
}

// { items: array | null, sha: string | null }  (items null = not created yet)
export async function readIndex(token) {
  try {
    const f = await gh(
      token,
      `${REPO_PATH}/contents/${DATA_FILE}?ref=${CONTENT_BRANCH}`
    );
    return { items: parseItems(JSON.parse(base64ToUtf8(f.content))), sha: f.sha };
  } catch (e) {
    if (e.status === 404) return { items: null, sha: null };
    throw e;
  }
}

async function putFile(token, path, base64, message, sha) {
  return gh(token, `${REPO_PATH}/contents/${path}`, {
    method: "PUT",
    body: {
      message,
      content: base64,
      branch: CONTENT_BRANCH,
      ...(sha ? { sha } : {}),
    },
  });
}

async function deleteFile(token, path, message) {
  try {
    const f = await gh(
      token,
      `${REPO_PATH}/contents/${path}?ref=${CONTENT_BRANCH}`
    );
    await gh(token, `${REPO_PATH}/contents/${path}`, {
      method: "DELETE",
      body: { message, sha: f.sha, branch: CONTENT_BRANCH },
    });
  } catch {
    /* best effort: an orphaned photo is harmless */
  }
}

// Read fresh -> apply change -> write. Retries if the file changed meanwhile.
async function mutateIndex(token, fallbackItems, change, message) {
  await ensureBranch(token);
  let lastError;
  for (let attempt = 0; attempt < 3; attempt++) {
    const current = await readIndex(token);
    const base = current.items ?? fallbackItems;
    const next = change(base);
    try {
      await putFile(
        token,
        DATA_FILE,
        utf8ToBase64(JSON.stringify({ version: 1, items: next }, null, 2) + "\n"),
        message,
        current.sha
      );
      return next;
    } catch (e) {
      lastError = e;
      if (e.status !== 409 && e.status !== 422) throw e;
    }
  }
  throw lastError;
}

/* ------------------------------------------------------------------ */
/* Photos                                                              */
/* ------------------------------------------------------------------ */

// Resize + re-encode to JPEG so a phone photo (5-10 MB) becomes ~300 KB.
export async function compressImage(file, maxEdge = 1600, quality = 0.82) {
  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error(
      `Can't read "${file.name}". Use a JPG, PNG or WebP photo.`
    );
  }
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#0a192f"; // transparent PNGs get the site's navy, not black
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();
  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality)
  );
  if (!blob) throw new Error(`Couldn't process "${file.name}".`);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1]);
    reader.onerror = () => reject(new Error(`Couldn't read "${file.name}".`));
    reader.readAsDataURL(blob);
  });
}

/* ------------------------------------------------------------------ */
/* Add / edit / delete                                                 */
/* ------------------------------------------------------------------ */

const newId = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

export async function addAchievement(
  token,
  { title, caption, badge, date, files },
  fallbackItems,
  onStatus = () => {}
) {
  const id = newId();
  await ensureBranch(token);

  const images = [];
  for (let i = 0; i < files.length; i++) {
    onStatus(`Uploading photo ${i + 1} of ${files.length}…`);
    const b64 = await compressImage(files[i]);
    const path = `${IMAGE_DIR}/${id}-${i + 1}.jpg`;
    await putFile(token, path, b64, `Add photo for "${title}"`);
    images.push(path);
  }

  onStatus("Saving…");
  const item = {
    id,
    title: title.trim(),
    caption: caption.trim(),
    badge: badge.trim(),
    date: date || "",
    images,
    createdAt: Date.now(),
  };
  return mutateIndex(
    token,
    fallbackItems,
    (list) => [item, ...list],
    `Add achievement: ${item.title}`
  );
}

export async function updateAchievement(token, id, patch, fallbackItems) {
  return mutateIndex(
    token,
    fallbackItems,
    (list) =>
      list.map((it) =>
        it.id === id
          ? {
              ...it,
              title: patch.title.trim(),
              caption: patch.caption.trim(),
              badge: patch.badge.trim(),
              date: patch.date || "",
            }
          : it
      ),
    `Edit achievement: ${patch.title.trim()}`
  );
}

export async function deleteAchievement(token, item, fallbackItems) {
  const next = await mutateIndex(
    token,
    fallbackItems,
    (list) => list.filter((it) => it.id !== item.id),
    `Delete achievement: ${item.title}`
  );
  for (const path of item.images) {
    await deleteFile(token, path, `Remove photo for "${item.title}"`);
  }
  return next;
}
