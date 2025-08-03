// state 
let currentViewUser = "";
let owner = ""; // repo owner when inside a repo
let repoName = "";
let branch = "main";
let token = "";
let currentPath = ""; // path inside current repo; empty means root
let viewingRepos = false; // true when showing list of repos for user

let currentPdfPath = "";
let currentPdfName = "";

const apiBase = "https://api.github.com";
const $ = (id) => document.getElementById(id);
const setError = (msg) => {
  const e = $("err");
  if (msg) {
    e.textContent = msg;
    e.style.display = "block";
  } else {
    e.style.display = "none";
  }
};
const setStatus = (t) => {
  const s = $("status");
  if (s) s.textContent = t;
};

function authHeaders(extra = {}) {
  const h = { Accept: "application/vnd.github+json", ...extra };
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
}

// load public repos of username
async function listUserRepos(username) {
  try {
    setError("");
    setStatus(`Fetching public repositories for ${username}...`);
    currentViewUser = username;
    viewingRepos = true;
    owner = "";
    repoName = "";
    branch = "main";
    currentPath = "";
    updateBreadcrumb();
    const resp = await fetch(
      `${apiBase}/users/${encodeURIComponent(username)}/repos?per_page=100&sort=updated`,
      {
        headers: authHeaders(),
      }
    );
    if (!resp.ok) throw new Error(`${resp.status} ${resp.statusText}`);
    const repos = await resp.json();
    renderRepoTiles(username, repos);
    setStatus(`Showing ${repos.length} repos for ${username}`);
  } catch (e) {
    console.error(e);
    setError("Failed to fetch repositories: " + e.message);
    setStatus("Error");
  }
}

function renderRepoTiles(username, repos) {
  const ex = $("explorer");
  ex.innerHTML = "";
  repos
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    .forEach((r) => {
      const div = document.createElement("div");
      div.className = "tile";
      div.innerHTML = `
      <div class="icon">📁</div>
      <div class="name">${r.name}</div>
      <div class="sub">${r.private ? "private" : "public"} · ${r.language || ""}</div>
    `;
      div.addEventListener("dblclick", () => {
        owner = username;
        repoName = r.name;
        branch = r.default_branch || "main";
        viewingRepos = false;
        currentPath = "";
        listFolder(currentPath);
      });
      ex.appendChild(div);
    });
}

// list contents inside current repo at path
async function listFolder(path) {
  if (!owner || !repoName) {
    setError("No repository selected");
    return;
  }
  try {
    setError("");
    setStatus(`Loading ${owner}/${repoName}/${path || "(root)"}...`);
    currentPath = path;
    updateBreadcrumb();
    const url = `${apiBase}/repos/${owner}/${repoName}/contents/${path || ""}?ref=${branch}`;
    const resp = await fetch(url, { headers: authHeaders() });
    if (!resp.ok) {
      if (resp.status === 404) {
        setError("Path not found");
        $("explorer").innerHTML = "";
        return;
      }
      throw new Error(`${resp.status} ${resp.statusText}`);
    }
    const data = await resp.json();
    const dirs = data.filter((d) => d.type === "dir");
    const files = data.filter((d) => d.type === "file");
    renderTiles(dirs, files);
    setStatus(
      `In ${owner}/${repoName}/${path || "(root)"}: ${dirs.length} folders, ${files.length} files`
    );
  } catch (e) {
    console.error(e);
    setError("Failed to list folder: " + e.message);
    setStatus("Error");
  }
}

function renderTiles(dirs, files) {
  const ex = $("explorer");
  ex.innerHTML = "";

  // folders
  dirs
    .sort((a, b) => a.name.localeCompare(b.name))
    .forEach((d) => {
      const div = document.createElement("div");
      div.className = "tile";
      div.innerHTML = `
      <div class="icon">📁</div>
      <div class="name">${d.name}</div>
      <div class="sub">Folder</div>
    `;
      div.addEventListener("dblclick", () => {
        const next = currentPath ? `${currentPath}/${d.name}` : d.name;
        listFolder(next);
      });
      ex.appendChild(div);
    });

  // files
  files
    .sort((a, b) => a.name.localeCompare(b.name))
    .forEach((f) => {
      const div = document.createElement("div");
      div.className = "tile";
      div.innerHTML = `
      <div class="icon">📄</div>
      <div class="name">${f.name}</div>
      <div class="sub">${(f.name.split(".").pop() || "").toUpperCase()}</div>
      ${
        token
          ? `<div class="delete-btn" title="Delete" style="position:absolute; top:6px; right:6px; font-size:16px; cursor:pointer;">🗑️</div>`
          : ""
      }
    `;
      div.addEventListener("dblclick", () => {
        if (f.name.toLowerCase().endsWith(".pdf")) {
          openPdfViewer(f.path, f.name);
        } else {
          alert("Only PDF preview is supported currently");
        }
      });
      if (token) {
        const deleteBtn = div.querySelector(".delete-btn");
        deleteBtn?.addEventListener("click", (e) => {
          e.stopPropagation();
          deleteFile(f.path, f.sha, f.name);
        });
      }
      ex.appendChild(div);
    });
}

function updateBreadcrumb() {
  const bc = $("breadcrumb");
  bc.innerHTML = "";
  if (viewingRepos) {
    const span = document.createElement("span");
    span.textContent = currentViewUser || "(user)";
    bc.appendChild(span);
    return;
  }
  if (owner && repoName) {
    const root = document.createElement("span");
    root.textContent = `${owner}/${repoName}`;
    root.style.fontWeight = "600";
    root.addEventListener("click", () => {
      currentPath = "";
      listFolder("");
    });
    bc.appendChild(root);
    if (currentPath) {
      const parts = currentPath.split("/").filter(Boolean);
      let acc = "";
      parts.forEach((p) => {
        const sep = document.createElement("span");
        sep.textContent = "›";
        bc.appendChild(sep);
        acc = acc ? `${acc}/${p}` : p;
        const sp = document.createElement("span");
        sp.textContent = p;
        sp.addEventListener("click", () => listFolder(acc));
        bc.appendChild(sp);
      });
    }
  } else {
    const span = document.createElement("span");
    span.textContent = currentViewUser ? `${currentViewUser}'s repos` : "Please load a user";
    bc.appendChild(span);
  }
}

// upload
async function uploadFiles(files) {
  if (viewingRepos) {
    setError("Must open a repository before uploading");
    return;
  }
  if (!owner || !repoName) {
    setError("No repository selected");
    return;
  }
  if (!token) {
    setError("Token required for upload");
    return;
  }
  for (const file of files) {
    try {
      setError("");
      setStatus(`Uploading ${file.name}...`);
      const targetPath = currentPath ? `${currentPath}/${file.name}` : file.name;
      const apiUrl = `${apiBase}/repos/${owner}/${repoName}/contents/${targetPath}`;

      // check existing to get sha
      let sha = null;
      try {
        const headResp = await fetch(`${apiUrl}?ref=${branch}`, {
          headers: authHeaders(),
        });
        if (headResp.ok) {
          const j = await headResp.json();
          sha = j.sha;
        }
      } catch {}

      const arrayBuffer = await file.arrayBuffer();
      let binary = "";
      const bytes = new Uint8Array(arrayBuffer);
      const chunkSize = 0x8000;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.subarray(i, i + chunkSize);
        binary += String.fromCharCode.apply(null, chunk);
      }
      const content = btoa(binary);
      const body = {
        message: sha ? `Update ${file.name}` : `Add ${file.name}`,
        content,
        branch,
      };
      if (sha) body.sha = sha;

      const res = await fetch(apiUrl, {
        method: "PUT",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`(${res.status}) ${txt}`);
      }
      await res.json();
      setStatus(`Uploaded ${file.name} successfully`);
    } catch (e) {
      console.error(e);
      setError(`Upload failed ${file.name}: ${e.message}`);
    }
  }
  await listFolder(currentPath);
}

// delete
async function deleteFile(path, sha, name) {
  if (!confirm(`Are you sure you want to delete "${name}"? This will commit the change.`)) return;
  try {
    setError("");
    setStatus(`Deleting ${name}...`);
    const url = `${apiBase}/repos/${owner}/${repoName}/contents/${path}`;
    const body = {
      message: `Delete ${name}`,
      sha,
      branch,
    };
    const res = await fetch(url, {
      method: "DELETE",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`(${res.status}) ${text}`);
    }
    await res.json();
    setStatus(`${name} deleted`);
    await listFolder(currentPath);
  } catch (e) {
    console.error(e);
    setError(`Delete failed: ${e.message}`);
    setStatus("Error");
  }
}

// PDF viewer logic
const pdfjsLib = window["pdfjs-dist/build/pdf"] || window.pdfjsLib;
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.9.179/pdf.worker.min.js";
let pdfDoc = null,
  pageNum = 1,
  numPages = 0,
  scale = 1;

const canvas = $("pdf-canvas");
const ctx = canvas.getContext("2d");
const canvasWrap = document.querySelector(".canvas-wrap");

function updateViewerStatus() {
  const statusEl = $("viewer-status");
  if (statusEl) statusEl.textContent = `Page ${pageNum} / ${numPages} · Zoom ${Math.round(scale * 100)}%`;
  const pageInput = $("page-input");
  if (pageInput) pageInput.value = pageNum;
  const total = $("page-total");
  if (total) total.textContent = `/ ${numPages}`;
}

async function renderPage(n, s) {
  if (!pdfDoc) return;
  $("loading").style.display = "flex";
  try {
    const page = await pdfDoc.getPage(n);
    const viewport = page.getViewport({ scale: s });
    const outputScale = window.devicePixelRatio || 1;

    // internal pixel size
    canvas.width = Math.round(viewport.width * outputScale);
    canvas.height = Math.round(viewport.height * outputScale);
    // CSS size (keeping ratio)
    canvas.style.width = `${viewport.width}px`;
    canvas.style.height = `${viewport.height}px`;

    const scaledViewport = page.getViewport({ scale: s * outputScale });

    ctx.resetTransform?.();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    await page.render({
      canvasContext: ctx,
      viewport: scaledViewport,
    }).promise;

    updateViewerStatus();
  } catch (e) {
    console.error("renderPage", e);
    alert("PDF render failed");
  } finally {
    $("loading").style.display = "none";
  }
}

async function openPdfViewer(path, name) {
  try {
    currentPdfPath = path;
    currentPdfName = name;
    const raw = `https://raw.githubusercontent.com/${owner}/${repoName}/${branch}/${path}`;
    pdfDoc = await pdfjsLib.getDocument(raw).promise;
    pageNum = 1;
    numPages = pdfDoc.numPages;
    scale = 1;
    updateViewerStatus();
    await renderPage(pageNum, scale);
    $("pdf-overlay").style.display = "flex";
    document.body.style.overflow = "hidden";
    if (canvasWrap) canvasWrap.scrollTop = 0;
  } catch (e) {
    console.error("openPdf", e);
    alert("Failed to open PDF: " + e.message);
  }
}

// page jump
const pageInputEl = $("page-input");
const goBtn = $("go-page");
function goToPageFromInput() {
  if (!pdfDoc) return;
  let v = parseInt(pageInputEl.value, 10);
  if (isNaN(v) || v < 1) v = 1;
  if (v > numPages) v = numPages;
  pageNum = v;
  renderPage(pageNum, scale);
  if (canvasWrap) canvasWrap.scrollTop = 0;
}
goBtn.addEventListener("click", goToPageFromInput);
pageInputEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter") goToPageFromInput();
});

// simple touch support: pan + pinch zoom
let lastTouch = null;
let pinchStartDist = null;
let pinchStartScale = 1;
let isPanning = false;
let panStart = { x: 0, y: 0 };
let scrollStart = { left: 0, top: 0 };

function getDistance(t1, t2) {
  const dx = t1.clientX - t2.clientX;
  const dy = t1.clientY - t2.clientY;
  return Math.hypot(dx, dy);
}

canvasWrap?.addEventListener("touchstart", (e) => {
  if (e.touches.length === 1) {
    isPanning = true;
    panStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    scrollStart = { left: canvasWrap.scrollLeft, top: canvasWrap.scrollTop };
  } else if (e.touches.length === 2) {
    isPanning = false;
    pinchStartDist = getDistance(e.touches[0], e.touches[1]);
    pinchStartScale = scale;
  }
});

canvasWrap?.addEventListener("touchmove", (e) => {
  e.preventDefault();
  if (e.touches.length === 1 && isPanning) {
    const dx = e.touches[0].clientX - panStart.x;
    const dy = e.touches[0].clientY - panStart.y;
    canvasWrap.scrollLeft = scrollStart.left - dx;
    canvasWrap.scrollTop = scrollStart.top - dy;
  } else if (e.touches.length === 2 && pinchStartDist) {
    const newDist = getDistance(e.touches[0], e.touches[1]);
    const ratio = newDist / pinchStartDist;
    scale = Math.min(5, Math.max(0.5, pinchStartScale * ratio));
    renderPage(pageNum, scale);
  }
});

canvasWrap?.addEventListener("touchend", (e) => {
  if (e.touches.length < 2) {
    pinchStartDist = null;
    pinchStartScale = scale;
  }
  if (e.touches.length === 0) {
    isPanning = false;
  }
});

// event bindings
$("load-user").addEventListener("click", () => {
  const user = $("github-user").value.trim();
  if (!user) return;
  listUserRepos(user);
});
$("refresh").addEventListener("click", () => {
  if (viewingRepos) {
    if (currentViewUser) listUserRepos(currentViewUser);
  } else if (owner && repoName) {
    listFolder(currentPath);
  }
});
$("up").addEventListener("click", () => {
  if (viewingRepos) return;
  if (currentPath) {
    const parts = currentPath.split("/").filter(Boolean);
    parts.pop();
    const parent = parts.length ? parts.join("/") : "";
    listFolder(parent);
  } else {
    viewingRepos = true;
    listUserRepos(currentViewUser);
  }
});
$("upload").addEventListener("click", () => {
  const fi = $("fileinput");
  if (fi.files.length) uploadFiles(Array.from(fi.files));
});
$("fileinput").addEventListener("change", (e) => {
  if (e.target.files.length) uploadFiles(Array.from(e.target.files));
});

// viewer controls
$("close-viewer").addEventListener("click", () => {
  $("pdf-overlay").style.display = "none";
  document.body.style.overflow = "";
});
$("prev").addEventListener("click", () => {
  if (pageNum > 1) {
    pageNum--;
    renderPage(pageNum, scale);
  }
});
$("next").addEventListener("click", () => {
  if (pdfDoc && pageNum < numPages) {
    pageNum++;
    renderPage(pageNum, scale);
  }
});
$("zoom-in").addEventListener("click", () => {
  scale = Math.min(5, scale + 0.25);
  renderPage(pageNum, scale);
});
$("zoom-out").addEventListener("click", () => {
  scale = Math.max(0.5, scale - 0.25);
  renderPage(pageNum, scale);
});
$("reset").addEventListener("click", () => {
  scale = 1;
  renderPage(pageNum, scale);
});
$("download").addEventListener("click", () => {
  if (!currentPdfPath) return;
  const url = `https://raw.githubusercontent.com/${owner}/${repoName}/${branch}/${currentPdfPath}`;
  window.open(url, "_blank");
});

// persist token and user
window.addEventListener("load", () => {
  const storedToken = localStorage.getItem("gh_token");
  if (storedToken) {
    $("token").value = storedToken;
    token = storedToken;
  }
  const storedUser = localStorage.getItem("gh_user");
  if (storedUser) $("github-user").value = storedUser;
  if (storedUser) listUserRepos(storedUser);
});

$("token").addEventListener("input", () => {
  token = $("token").value.trim();
  localStorage.setItem("gh_token", token);
});
$("github-user").addEventListener("input", () => {
  localStorage.setItem("gh_user", $("github-user").value.trim());
});


const toggleBtn = $("toggle-sidebar");
toggleBtn.addEventListener("click", () => {
  const panel = document.querySelector(".panel");
  const collapsed = panel.classList.toggle("collapsed");
  toggleBtn.textContent = collapsed ? "Show Sidebar" : "Hide Sidebar";
});