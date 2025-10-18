import { CONFIG } from './config.js';
import { appState } from './state.js';
import { setError, setStatus } from './utils.js';

// API service for GitHub interactions
export class GitHubAPI {
  constructor() {
    this.baseUrl = CONFIG.API_BASE;
  }

  // Get authentication headers
  getAuthHeaders(extra = {}) {
    const headers = {
      'Accept': 'application/vnd.github+json',
      ...extra
    };
    
    if (appState.token) {
      headers['Authorization'] = `Bearer ${appState.token}`;
    }
    
    return headers;
  }

  // Generic fetch wrapper with error handling
  async fetchWithErrorHandling(url, options = {}) {
    try {
      const response = await fetch(url, {
        headers: this.getAuthHeaders(options.headers),
        ...options
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Get user's public repositories
  async getUserRepositories(username) {
    const url = `${this.baseUrl}/users/${encodeURIComponent(username)}/repos?per_page=${CONFIG.REPOS_PER_PAGE}&sort=updated`;
    return await this.fetchWithErrorHandling(url);
  }

  // Get repository contents
  async getRepositoryContents(path = '') {
    if (!appState.isInRepository) {
      throw new Error('No repository selected');
    }

    const url = `${this.baseUrl}/repos/${appState.owner}/${appState.repoName}/contents/${path}?ref=${appState.branch}`;
    return await this.fetchWithErrorHandling(url);
  }

  // Check if file exists (to get SHA for updates)
  async getFileInfo(path) {
    if (!appState.isInRepository) {
      throw new Error('No repository selected');
    }

    try {
      const url = `${this.baseUrl}/repos/${appState.owner}/${appState.repoName}/contents/${path}?ref=${appState.branch}`;
      const response = await fetch(url, { headers: this.getAuthHeaders() });
      
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  // Upload file to repository
  async uploadFile(file, targetPath) {
    if (!appState.canUpload) {
      throw new Error('Upload requires repository access and authentication token');
    }

    const url = `${this.baseUrl}/repos/${appState.owner}/${appState.repoName}/contents/${targetPath}`;
    
    // Check if file exists to get SHA
    const existingFile = await this.getFileInfo(targetPath);
    const sha = existingFile?.sha;

    // Convert file to base64
    const content = await this.fileToBase64(file);

    const body = {
      message: sha ? `Update ${file.name}` : `Add ${file.name}`,
      content,
      branch: appState.branch,
    };

    if (sha) {
      body.sha = sha;
    }

    return await this.fetchWithErrorHandling(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  }

  // Delete file from repository
  async deleteFile(path, sha, name) {
    if (!appState.canUpload) {
      throw new Error('Delete requires repository access and authentication token');
    }

    const url = `${this.baseUrl}/repos/${appState.owner}/${appState.repoName}/contents/${path}`;
    
    const body = {
      message: `Delete ${name}`,
      sha,
      branch: appState.branch,
    };

    return await this.fetchWithErrorHandling(url, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  }

  // Convert file to base64
  async fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const arrayBuffer = reader.result;
        const bytes = new Uint8Array(arrayBuffer);
        let binary = '';
        
        // Process in chunks to avoid stack overflow
        for (let i = 0; i < bytes.length; i += CONFIG.CHUNK_SIZE) {
          const chunk = bytes.subarray(i, i + CONFIG.CHUNK_SIZE);
          binary += String.fromCharCode.apply(null, chunk);
        }
        
        resolve(btoa(binary));
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  // Get raw file URL for direct access
  getRawFileUrl(path) {
    if (!appState.isInRepository) {
      throw new Error('No repository selected');
    }
    return `https://raw.githubusercontent.com/${appState.owner}/${appState.repoName}/${appState.branch}/${path}`;
  }
}

// Create singleton instance
export const githubAPI = new GitHubAPI();
