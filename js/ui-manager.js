import { SELECTORS } from './config.js';
import { appState } from './state.js';
import { githubAPI } from './api.js';
import { $, setError, setStatus, createElement, getFileIcon, sanitizeHtml } from './utils.js';

// UI Manager class for handling all UI updates
export class UIManager {
  constructor() {
    this.explorer = null;
    this.breadcrumb = null;
  }

  // Initialize UI elements
  initialize() {
    this.explorer = $(SELECTORS.EXPLORER);
    this.breadcrumb = $(SELECTORS.BREADCRUMB);
    
    if (!this.explorer || !this.breadcrumb) {
      console.error('Required UI elements not found');
    }
  }

  // Render repository tiles
  renderRepoTiles(username, repos) {
    if (!this.explorer) return;
    
    this.explorer.innerHTML = '';
    
    // Sort by update date (newest first)
    const sortedRepos = repos.sort((a, b) => 
      new Date(b.updated_at) - new Date(a.updated_at)
    );

    sortedRepos.forEach(repo => {
      const tile = this.createRepoTile(repo, username);
      this.explorer.appendChild(tile);
    });
  }

  // Create repository tile
  createRepoTile(repo, username) {
    const tile = createElement('div', 'tile');
    
    tile.innerHTML = `
      <div class="icon">${getFileIcon('', 'dir')}</div>
      <div class="name">${sanitizeHtml(repo.name)}</div>
      <div class="sub">${repo.private ? 'private' : 'public'} · ${repo.language || ''}</div>
    `;

    // Add double-click handler
    tile.addEventListener('dblclick', () => {
      appState.setRepository(username, repo.name, repo.default_branch || 'main');
      this.updateBreadcrumb();
      // Trigger repository content loading (handled by main app)
      window.dispatchEvent(new CustomEvent('loadRepository', { 
        detail: { path: '' } 
      }));
    });

    // Add hover effects
    tile.addEventListener('mouseenter', () => {
      tile.style.transform = 'translateY(-2px)';
    });
    
    tile.addEventListener('mouseleave', () => {
      tile.style.transform = 'translateY(0)';
    });

    return tile;
  }

  // Render folder and file tiles
  renderTiles(dirs, files) {
    if (!this.explorer) return;
    
    this.explorer.innerHTML = '';

    // Render directories first
    dirs
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach(dir => {
        const tile = this.createDirTile(dir);
        this.explorer.appendChild(tile);
      });

    // Then render files
    files
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach(file => {
        const tile = this.createFileTile(file);
        this.explorer.appendChild(tile);
      });
  }

  // Create directory tile
  createDirTile(dir) {
    const tile = createElement('div', 'tile');
    
    tile.innerHTML = `
      <div class="icon">${getFileIcon('', 'dir')}</div>
      <div class="name">${sanitizeHtml(dir.name)}</div>
      <div class="sub">Folder</div>
    `;

    tile.addEventListener('dblclick', () => {
      const nextPath = appState.currentPath ? 
        `${appState.currentPath}/${dir.name}` : 
        dir.name;
      
      appState.setCurrentPath(nextPath);
      this.updateBreadcrumb();
      
      // Trigger folder loading
      window.dispatchEvent(new CustomEvent('loadRepository', { 
        detail: { path: nextPath } 
      }));
    });

    return tile;
  }

  // Create file tile
  createFileTile(file) {
    const tile = createElement('div', 'tile');
    const fileExt = file.name.split('.').pop()?.toUpperCase() || '';
    
    tile.innerHTML = `
      <div class="icon">${getFileIcon(file.name)}</div>
      <div class="name">${sanitizeHtml(file.name)}</div>
      <div class="sub">${fileExt}</div>
      ${appState.token ? 
        '<div class="delete-btn" title="Delete" style="position:absolute; top:6px; right:6px; font-size:16px; cursor:pointer;">🗑️</div>' : 
        ''
      }
    `;

    // File double-click handler
    tile.addEventListener('dblclick', () => {
      if (file.name.toLowerCase().endsWith('.pdf')) {
        window.dispatchEvent(new CustomEvent('openPdf', { 
          detail: { path: file.path, name: file.name } 
        }));
      } else {
        // For non-PDF files, show a message
        setStatus(`File type "${fileExt}" is not supported for preview. Only PDF files can be previewed.`);
      }
    });

    // Delete button handler
    if (appState.token) {
      const deleteBtn = tile.querySelector('.delete-btn');
      if (deleteBtn) {
        deleteBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          window.dispatchEvent(new CustomEvent('deleteFile', { 
            detail: { path: file.path, sha: file.sha, name: file.name } 
          }));
        });
      }
    }

    return tile;
  }

  // Update breadcrumb navigation
  updateBreadcrumb() {
    if (!this.breadcrumb) return;
    
    this.breadcrumb.innerHTML = '';

    if (appState.viewingRepos) {
      const span = createElement('span');
      span.textContent = appState.currentViewUser || '(user)';
      this.breadcrumb.appendChild(span);
      return;
    }

    if (appState.owner && appState.repoName) {
      // Repository root
      const root = createElement('span');
      root.textContent = `${appState.owner}/${appState.repoName}`;
      root.style.fontWeight = '600';
      root.style.cursor = 'pointer';
      
      root.addEventListener('click', () => {
        appState.setCurrentPath('');
        this.updateBreadcrumb();
        window.dispatchEvent(new CustomEvent('loadRepository', { 
          detail: { path: '' } 
        }));
      });
      
      this.breadcrumb.appendChild(root);

      // Path segments
      if (appState.currentPath) {
        const parts = appState.currentPath.split('/').filter(Boolean);
        let accumulatedPath = '';
        
        parts.forEach(part => {
          // Separator
          const separator = createElement('span');
          separator.textContent = '›';
          this.breadcrumb.appendChild(separator);

          // Path segment
          accumulatedPath = accumulatedPath ? `${accumulatedPath}/${part}` : part;
          const segment = createElement('span');
          segment.textContent = part;
          segment.style.cursor = 'pointer';
          
          segment.addEventListener('click', () => {
            appState.setCurrentPath(accumulatedPath);
            this.updateBreadcrumb();
            window.dispatchEvent(new CustomEvent('loadRepository', { 
              detail: { path: accumulatedPath } 
            }));
          });
          
          this.breadcrumb.appendChild(segment);
        });
      }
    } else {
      const span = createElement('span');
      span.textContent = appState.currentViewUser ? 
        `${appState.currentViewUser}'s repos` : 
        'Please load a user';
      this.breadcrumb.appendChild(span);
    }
  }

  // Update status display
  updateStatus(message, isError = false) {
    if (isError) {
      setError(message);
    } else {
      setStatus(message);
    }
  }

  // Clear explorer
  clearExplorer() {
    if (this.explorer) {
      this.explorer.innerHTML = '';
    }
  }

  // Show loading state
  showLoading(message = 'Loading...') {
    if (this.explorer) {
      this.explorer.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--muted);">
          ${message}
        </div>
      `;
    }
  }
}

// Create singleton instance
export const uiManager = new UIManager();
