import { SELECTORS } from './config.js';

// Utility functions
export const $ = (id) => document.getElementById(id);

export const $$ = (selector) => document.querySelector(selector);

export const setError = (message) => {
  const errorElement = $(SELECTORS.ERROR);
  if (!errorElement) return;
  
  if (message) {
    errorElement.textContent = message;
    errorElement.style.display = "block";
  } else {
    errorElement.style.display = "none";
  }
};

export const setStatus = (message) => {
  const statusElement = $(SELECTORS.STATUS);
  if (statusElement) {
    statusElement.textContent = message;
  }
};

export const showLoading = (show = true) => {
  const loadingElement = $(SELECTORS.LOADING);
  if (loadingElement) {
    loadingElement.style.display = show ? "flex" : "none";
  }
};

export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const throttle = (func, limit) => {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getFileExtension = (filename) => {
  return filename.split('.').pop()?.toLowerCase() || '';
};

export const getFileIcon = (filename, type) => {
  if (type === 'dir') return '📁';
  
  const ext = getFileExtension(filename);
  const iconMap = {
    pdf: '📄',
    txt: '📝',
    md: '📝',
    js: '📜',
    html: '🌐',
    css: '🎨',
    json: '📋',
    xml: '📄',
    zip: '🗜️',
    image: '🖼️',
    video: '🎥',
    audio: '🎵',
  };
  
  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'];
  const videoExts = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'];
  const audioExts = ['mp3', 'wav', 'flac', 'aac', 'ogg'];
  
  if (imageExts.includes(ext)) return iconMap.image;
  if (videoExts.includes(ext)) return iconMap.video;
  if (audioExts.includes(ext)) return iconMap.audio;
  
  return iconMap[ext] || '📄';
};

export const sanitizeHtml = (text) => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

export const createElement = (tag, className = '', innerHTML = '') => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (innerHTML) element.innerHTML = innerHTML;
  return element;
};

export const addEventListeners = (element, events) => {
  Object.entries(events).forEach(([event, handler]) => {
    element.addEventListener(event, handler);
  });
};

export const removeEventListeners = (element, events) => {
  Object.entries(events).forEach(([event, handler]) => {
    element.removeEventListener(event, handler);
  });
};
