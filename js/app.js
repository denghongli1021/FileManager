import { CONFIG, SELECTORS, STORAGE_KEYS } from './config.js';
import { appState } from './state.js';
import { githubAPI } from './api.js';
import { pdfViewer } from './pdf-viewer.js';
import { uiManager } from './ui-manager.js';
import { $, setError, setStatus, debounce } from './utils.js';

// Main application class
class FileManagerApp {
  constructor() {
    this.isInitialized = false;
    this.init();
  }

  // Initialize the application
  async init() {
    try {
      this.setupEventListeners();
      this.loadStoredData();
      uiManager.initialize();
      pdfViewer.initializeElements();
      
      this.isInitialized = true;
      console.log('FileManager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize app:', error);
      setError('Application initialization failed');
    }
  }

  // Setup all event listeners
  setupEventListeners() {
    // User input handlers
    this.setupUserInputHandlers();
    
    // Navigation handlers
    this.setupNavigationHandlers();
    
    // File operation handlers
    this.setupFileOperationHandlers();
    
    // PDF viewer handlers
    this.setupPdfViewerHandlers();
    
    // Custom event handlers
    this.setupCustomEventHandlers();
    
    // Storage handlers
    this.setupStorageHandlers();
    
    // UI handlers
    this.setupUIHandlers();
  }

  // User input event handlers
  setupUserInputHandlers() {
    // Load user button
    $(SELECTORS.LOAD_USER)?.addEventListener('click', () => {
      const username = $(SELECTORS.GITHUB_USER)?.value?.trim();
      if (username) {
        this.loadUserRepositories(username);
      }
    });

    // Token input with debounced storage
    const tokenInput = $(SELECTORS.TOKEN);
    if (tokenInput) {
      tokenInput.addEventListener('input', debounce(() => {
        const token = tokenInput.value.trim();
        appState.setToken(token);
        localStorage.setItem(STORAGE_KEYS.GITHUB_TOKEN, token);
      }, 300));
    }

    // GitHub user input with debounced storage
    const userInput = $(SELECTORS.GITHUB_USER);
    if (userInput) {
      userInput.addEventListener('input', debounce(() => {
        const user = userInput.value.trim();
        localStorage.setItem(STORAGE_KEYS.GITHUB_USER, user);
      }, 300));
    }
  }

  // Navigation event handlers
  setupNavigationHandlers() {
    // Refresh button
    $(SELECTORS.REFRESH)?.addEventListener('click', () => {
      this.refreshCurrentView();
    });

    // Back/Up button
    $(SELECTORS.UP)?.addEventListener('click', () => {
      this.navigateUp();
    });
  }

  // File operation event handlers
  setupFileOperationHandlers() {
    // Upload button
    $(SELECTORS.UPLOAD)?.addEventListener('click', () => {
      const fileInput = $(SELECTORS.FILE_INPUT);
      if (fileInput?.files?.length) {
        this.uploadFiles(Array.from(fileInput.files));
      }
    });

    // File input change
    $(SELECTORS.FILE_INPUT)?.addEventListener('change', (e) => {
      if (e.target.files?.length) {
        this.uploadFiles(Array.from(e.target.files));
      }
    });
  }

  // PDF viewer event handlers
  setupPdfViewerHandlers() {
    // Close viewer
    $(SELECTORS.CLOSE_VIEWER)?.addEventListener('click', () => {
      pdfViewer.closeViewer();
    });

    // Navigation
    $(SELECTORS.PREV)?.addEventListener('click', () => {
      pdfViewer.previousPage();
    });

    $(SELECTORS.NEXT)?.addEventListener('click', () => {
      pdfViewer.nextPage();
    });

    // Zoom controls
    $(SELECTORS.ZOOM_IN)?.addEventListener('click', () => {
      pdfViewer.zoomIn();
    });

    $(SELECTORS.ZOOM_OUT)?.addEventListener('click', () => {
      pdfViewer.zoomOut();
    });

    $(SELECTORS.RESET)?.addEventListener('click', () => {
      pdfViewer.resetZoom();
    });

    // Download
    $(SELECTORS.DOWNLOAD)?.addEventListener('click', () => {
      pdfViewer.downloadPdf();
    });

    // Page jump
    const goBtn = $(SELECTORS.GO_PAGE);
    const pageInput = $(SELECTORS.PAGE_INPUT);
    
    goBtn?.addEventListener('click', () => {
      this.jumpToPage();
    });

    pageInput?.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') {
        this.jumpToPage();
      }
    });

    pageInput?.addEventListener('change', () => {
      this.jumpToPage();
    });
  }

  // Custom event handlers
  setupCustomEventHandlers() {
    // Repository loading
    window.addEventListener('loadRepository', async (e) => {
      const { path } = e.detail;
      await this.loadRepositoryContents(path);
    });

    // PDF opening
    window.addEventListener('openPdf', async (e) => {
      const { path, name } = e.detail;
      await pdfViewer.openPdfViewer(path, name);
    });

    // File deletion
    window.addEventListener('deleteFile', async (e) => {
      const { path, sha, name } = e.detail;
      await this.deleteFile(path, sha, name);
    });
  }

  // Storage event handlers
  setupStorageHandlers() {
    // Load stored data on page load
    window.addEventListener('load', () => {
      this.loadStoredData();
    });
  }

  // UI event handlers
  setupUIHandlers() {
    // Sidebar toggle
    const toggleBtn = $(SELECTORS.TOGGLE_SIDEBAR);
    toggleBtn?.addEventListener('click', () => {
      const panel = document.querySelector('.panel');
      if (!panel) return;
      
      const collapsed = panel.classList.toggle('collapsed');
      toggleBtn.textContent = collapsed ? 'Show Sidebar' : 'Hide Sidebar';
    });
  }

  // Load stored user data
  loadStoredData() {
    // Load token
    const storedToken = localStorage.getItem(STORAGE_KEYS.GITHUB_TOKEN);
    if (storedToken) {
      const tokenInput = $(SELECTORS.TOKEN);
      if (tokenInput) {
        tokenInput.value = storedToken;
      }
      appState.setToken(storedToken);
    }

    // Load user
    const storedUser = localStorage.getItem(STORAGE_KEYS.GITHUB_USER);
    if (storedUser) {
      const userInput = $(SELECTORS.GITHUB_USER);
      if (userInput) {
        userInput.value = storedUser;
      }
      // Auto-load user repositories if user is stored
      this.loadUserRepositories(storedUser);
    }
  }

  // Load user repositories
  async loadUserRepositories(username) {
    try {
      setError('');
      setStatus(`Fetching public repositories for ${username}...`);
      
      appState.setUserView(username);
      uiManager.updateBreadcrumb();
      uiManager.showLoading('Loading repositories...');

      const repos = await githubAPI.getUserRepositories(username);
      uiManager.renderRepoTiles(username, repos);
      
      setStatus(`Showing ${repos.length} repos for ${username}`);
    } catch (error) {
      console.error('Failed to load repositories:', error);
      setError(`Failed to fetch repositories: ${error.message}`);
      setStatus('Error');
      uiManager.clearExplorer();
    }
  }

  // Load repository contents
  async loadRepositoryContents(path = '') {
    if (!appState.isInRepository) {
      setError('No repository selected');
      return;
    }

    try {
      setError('');
      setStatus(`Loading ${appState.fullRepoPath}...`);
      
      appState.setCurrentPath(path);
      uiManager.updateBreadcrumb();
      uiManager.showLoading('Loading contents...');

      const contents = await githubAPI.getRepositoryContents(path);
      
      const dirs = contents.filter(item => item.type === 'dir');
      const files = contents.filter(item => item.type === 'file');
      
      uiManager.renderTiles(dirs, files);
      
      setStatus(`In ${appState.fullRepoPath}: ${dirs.length} folders, ${files.length} files`);
    } catch (error) {
      console.error('Failed to load repository contents:', error);
      setError(`Failed to list folder: ${error.message}`);
      setStatus('Error');
      uiManager.clearExplorer();
    }
  }

  // Upload files
  async uploadFiles(files) {
    if (!appState.canUpload) {
      setError(appState.viewingRepos ? 
        'Must open a repository before uploading' : 
        'Token required for upload');
      return;
    }

    for (const file of files) {
      try {
        setError('');
        setStatus(`Uploading ${file.name}...`);

        const targetPath = appState.currentRepoPath ? 
          `${appState.currentRepoPath}/${file.name}` : 
          file.name;

        await githubAPI.uploadFile(file, targetPath);
        setStatus(`Uploaded ${file.name} successfully`);
      } catch (error) {
        console.error('Upload failed:', error);
        setError(`Upload failed ${file.name}: ${error.message}`);
      }
    }

    // Refresh current view
    await this.loadRepositoryContents(appState.currentPath);
  }

  // Delete file
  async deleteFile(path, sha, name) {
    if (!confirm(`Are you sure you want to delete "${name}"? This will commit the change.`)) {
      return;
    }

    try {
      setError('');
      setStatus(`Deleting ${name}...`);

      await githubAPI.deleteFile(path, sha, name);
      setStatus(`${name} deleted`);
      
      // Refresh current view
      await this.loadRepositoryContents(appState.currentPath);
    } catch (error) {
      console.error('Delete failed:', error);
      setError(`Delete failed: ${error.message}`);
      setStatus('Error');
    }
  }

  // Refresh current view
  async refreshCurrentView() {
    if (appState.viewingRepos) {
      if (appState.currentViewUser) {
        await this.loadUserRepositories(appState.currentViewUser);
      }
    } else if (appState.isInRepository) {
      await this.loadRepositoryContents(appState.currentPath);
    }
  }

  // Navigate up one level
  navigateUp() {
    if (appState.viewingRepos) return;

    if (appState.currentPath) {
      const parts = appState.currentPath.split('/').filter(Boolean);
      parts.pop();
      const parentPath = parts.length ? parts.join('/') : '';
      
      appState.setCurrentPath(parentPath);
      uiManager.updateBreadcrumb();
      window.dispatchEvent(new CustomEvent('loadRepository', { 
        detail: { path: parentPath } 
      }));
    } else {
      // Go back to user repositories
      appState.setUserView(appState.currentViewUser);
      uiManager.updateBreadcrumb();
      if (appState.currentViewUser) {
        this.loadUserRepositories(appState.currentViewUser);
      }
    }
  }

  // Jump to specific page in PDF
  jumpToPage() {
    const pageInput = $(SELECTORS.PAGE_INPUT);
    if (!pageInput) return;

    const pageNumber = parseInt(pageInput.value, 10);
    if (!isNaN(pageNumber)) {
      pdfViewer.setPage(pageNumber);
    }
  }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new FileManagerApp();
});

// Export for potential external use
export default FileManagerApp;
