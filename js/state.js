// Application state management
class AppState {
  constructor() {
    this.reset();
  }

  reset() {
    this.currentViewUser = "";
    this.owner = "";
    this.repoName = "";
    this.branch = "main";
    this.token = "";
    this.currentPath = "";
    this.viewingRepos = false;
    this.currentPdfPath = "";
    this.currentPdfName = "";
  }

  // Repository state
  setRepository(owner, repoName, branch = "main") {
    this.owner = owner;
    this.repoName = repoName;
    this.branch = branch;
    this.viewingRepos = false;
    this.currentPath = "";
  }

  setUserView(username) {
    this.currentViewUser = username;
    this.viewingRepos = true;
    this.owner = "";
    this.repoName = "";
    this.branch = "main";
    this.currentPath = "";
  }

  setCurrentPath(path) {
    this.currentPath = path;
  }

  setToken(token) {
    this.token = token;
  }

  setPdfInfo(path, name) {
    this.currentPdfPath = path;
    this.currentPdfName = name;
  }

  // Getters
  get isInRepository() {
    return !this.viewingRepos && this.owner && this.repoName;
  }

  get canUpload() {
    return this.isInRepository && this.token;
  }

  get currentRepoPath() {
    if (!this.isInRepository) return null;
    return this.currentPath ? `${this.currentPath}` : "";
  }

  get fullRepoPath() {
    if (!this.isInRepository) return null;
    return `${this.owner}/${this.repoName}/${this.currentRepoPath || ""}`;
  }
}

// Create singleton instance
export const appState = new AppState();
