// Configuration constants
export const CONFIG = {
  API_BASE: "https://api.github.com",
  PDFJS_WORKER_URL: "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.9.179/pdf.worker.min.js",
  MAX_ZOOM: 5,
  MIN_ZOOM: 0.5,
  ZOOM_STEP: 0.25,
  DEFAULT_ZOOM: 1,
  DEFAULT_BRANCH: "main",
  REPOS_PER_PAGE: 100,
  CHUNK_SIZE: 0x8000, // For file upload
};

// Storage keys
export const STORAGE_KEYS = {
  GITHUB_TOKEN: "gh_token",
  GITHUB_USER: "gh_user",
};

// DOM selectors
export const SELECTORS = {
  // Main elements
  EXPLORER: "explorer",
  BREADCRUMB: "breadcrumb",
  STATUS: "status",
  ERROR: "err",
  
  // Input elements
  GITHUB_USER: "github-user",
  TOKEN: "token",
  FILE_INPUT: "fileinput",
  PAGE_INPUT: "page-input",
  PAGE_TOTAL: "page-total",
  
  // Buttons
  LOAD_USER: "load-user",
  REFRESH: "refresh",
  UP: "up",
  UPLOAD: "upload",
  TOGGLE_SIDEBAR: "toggle-sidebar",
  CLOSE_VIEWER: "close-viewer",
  PREV: "prev",
  NEXT: "next",
  ZOOM_IN: "zoom-in",
  ZOOM_OUT: "zoom-out",
  RESET: "reset",
  DOWNLOAD: "download",
  GO_PAGE: "go-page",
  
  // PDF viewer elements
  PDF_OVERLAY: "pdf-overlay",
  PDF_CANVAS: "pdf-canvas",
  CANVAS_WRAP: ".canvas-wrap",
  LOADING: "loading",
  VIEWER_STATUS: "viewer-status",
};
