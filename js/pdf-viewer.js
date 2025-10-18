import { CONFIG, SELECTORS } from './config.js';
import { appState } from './state.js';
import { githubAPI } from './api.js';
import { $, $$, setError, setStatus, showLoading } from './utils.js';

// PDF Viewer class
export class PDFViewer {
  constructor() {
    this.pdfDoc = null;
    this.pageNum = 1;
    this.numPages = 0;
    this.scale = CONFIG.DEFAULT_ZOOM;
    this.canvas = null;
    this.ctx = null;
    this.canvasWrap = null;
    this.isInitialized = false;
    
    this.initializePDFJS();
  }

  // Initialize PDF.js
  initializePDFJS() {
    try {
      const pdfjsLib = window['pdfjs-dist/build/pdf'] || window.pdfjsLib;
      if (!pdfjsLib) {
        throw new Error('PDF.js library not loaded');
      }
      
      pdfjsLib.GlobalWorkerOptions.workerSrc = CONFIG.PDFJS_WORKER_URL;
      this.pdfjsLib = pdfjsLib;
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize PDF.js:', error);
      setError('PDF.js library failed to load');
    }
  }

  // Initialize DOM elements
  initializeElements() {
    this.canvas = $(SELECTORS.PDF_CANVAS);
    this.canvasWrap = $$(SELECTORS.CANVAS_WRAP);
    
    if (!this.canvas || !this.canvasWrap) {
      throw new Error('PDF viewer DOM elements not found');
    }
    
    this.ctx = this.canvas.getContext('2d');
  }

  // Update viewer status display
  updateViewerStatus() {
    const statusEl = $(SELECTORS.VIEWER_STATUS);
    if (statusEl) {
      statusEl.textContent = `Page ${this.pageNum} / ${this.numPages} · Zoom ${Math.round(this.scale * 100)}%`;
    }
    
    const pageInput = $(SELECTORS.PAGE_INPUT);
    if (pageInput) {
      pageInput.value = this.pageNum;
    }
    
    const total = $(SELECTORS.PAGE_TOTAL);
    if (total) {
      total.textContent = `/ ${this.numPages}`;
    }
  }

  // Render a specific page
  async renderPage(pageNumber, scale) {
    if (!this.pdfDoc || !this.isInitialized) return;
    
    showLoading(true);
    
    try {
      const page = await this.pdfDoc.getPage(pageNumber);
      const viewport = page.getViewport({ scale });
      const outputScale = window.devicePixelRatio || 1;

      // Set canvas dimensions
      this.canvas.width = Math.round(viewport.width * outputScale);
      this.canvas.height = Math.round(viewport.height * outputScale);
      this.canvas.style.width = `${viewport.width}px`;
      this.canvas.style.height = `${viewport.height}px`;

      const scaledViewport = page.getViewport({ scale: scale * outputScale });

      // Clear and render
      this.ctx.resetTransform?.();
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      
      await page.render({
        canvasContext: this.ctx,
        viewport: scaledViewport,
      }).promise;

      this.updateViewerStatus();
    } catch (error) {
      console.error('PDF render error:', error);
      setError('Failed to render PDF page');
    } finally {
      showLoading(false);
    }
  }

  // Open PDF viewer
  async openPdfViewer(path, name) {
    if (!this.isInitialized) {
      setError('PDF viewer not initialized');
      return;
    }

    try {
      this.initializeElements();
      appState.setPdfInfo(path, name);
      setStatus(`Loading PDF ${name}...`);

      // Get raw file URL
      const rawUrl = githubAPI.getRawFileUrl(path);

      // Fetch PDF data
      const response = await fetch(rawUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      
      // Load PDF document
      this.pdfDoc = await this.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      this.pageNum = 1;
      this.numPages = this.pdfDoc.numPages;
      this.scale = CONFIG.DEFAULT_ZOOM;

      this.updateViewerStatus();
      await this.renderPage(this.pageNum, this.scale);

      // Show viewer
      const overlay = $(SELECTORS.PDF_OVERLAY);
      if (overlay) {
        overlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';
      }

      if (this.canvasWrap) {
        this.canvasWrap.scrollTop = 0;
      }

      setStatus(`Loaded ${name}`);
    } catch (error) {
      console.error('PDF viewer error:', error);
      setError(`Failed to open PDF: ${error.message}`);
      setStatus('Error');
    }
  }

  // Close PDF viewer
  closeViewer() {
    const overlay = $(SELECTORS.PDF_OVERLAY);
    if (overlay) {
      overlay.style.display = 'none';
    }
    document.body.style.overflow = '';
    
    // Clean up
    this.pdfDoc = null;
    this.pageNum = 1;
    this.numPages = 0;
    this.scale = CONFIG.DEFAULT_ZOOM;
  }

  // Navigation methods
  async setPage(pageNumber) {
    if (!this.pdfDoc) return;
    
    pageNumber = Math.min(Math.max(1, pageNumber), this.numPages);
    if (pageNumber === this.pageNum) return;
    
    this.pageNum = pageNumber;
    this.updateViewerStatus();
    await this.renderPage(this.pageNum, this.scale);
    
    if (this.canvasWrap) {
      this.canvasWrap.scrollTop = 0;
    }
  }

  async previousPage() {
    if (this.pageNum > 1) {
      await this.setPage(this.pageNum - 1);
    }
  }

  async nextPage() {
    if (this.pageNum < this.numPages) {
      await this.setPage(this.pageNum + 1);
    }
  }

  // Zoom methods
  async zoomIn() {
    this.scale = Math.min(CONFIG.MAX_ZOOM, this.scale + CONFIG.ZOOM_STEP);
    await this.renderPage(this.pageNum, this.scale);
  }

  async zoomOut() {
    this.scale = Math.max(CONFIG.MIN_ZOOM, this.scale - CONFIG.ZOOM_STEP);
    await this.renderPage(this.pageNum, this.scale);
  }

  async resetZoom() {
    this.scale = CONFIG.DEFAULT_ZOOM;
    await this.renderPage(this.pageNum, this.scale);
  }

  // Download PDF
  downloadPdf() {
    if (!appState.currentPdfPath) return;
    
    const url = githubAPI.getRawFileUrl(appState.currentPdfPath);
    window.open(url, '_blank');
  }
}

// Create singleton instance
export const pdfViewer = new PDFViewer();
