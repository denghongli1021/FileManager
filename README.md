# GitHub File Manager & PDF Viewer

A modern, responsive web application for browsing GitHub repositories and viewing PDF files. Built with vanilla JavaScript using ES6 modules for clean, maintainable code.

## Features

### 📁 Repository Management
- Browse public GitHub repositories
- Navigate folder structures with breadcrumb navigation
- View repository contents with file type icons
- Upload files to repositories (requires GitHub token)
- Delete files from repositories (requires GitHub token)

### 📄 PDF Viewer
- In-browser PDF viewing with PDF.js
- Zoom controls (in/out/reset)
- Page navigation (previous/next/jump to page)
- Download PDF files
- Responsive design for mobile devices

### 🎨 User Experience
- Modern dark theme with smooth animations
- Responsive design for desktop, tablet, and mobile
- Keyboard navigation support
- Accessibility features (screen reader support, high contrast mode)
- Real-time error handling and status updates
- Persistent storage for GitHub token and username

## Architecture

The application is built using a modular architecture:

```
js/
├── config.js          # Configuration constants and selectors
├── state.js           # Application state management
├── utils.js           # Utility functions and helpers
├── api.js             # GitHub API service
├── pdf-viewer.js      # PDF viewing functionality
├── ui-manager.js      # UI rendering and management
└── app.js             # Main application logic
```

### Key Design Principles

1. **Separation of Concerns**: Each module has a specific responsibility
2. **State Management**: Centralized state with clear getters and setters
3. **Error Handling**: Comprehensive error handling with user-friendly messages
4. **Performance**: Debounced inputs, optimized rendering, and lazy loading
5. **Accessibility**: WCAG compliant with keyboard navigation and screen reader support

## Getting Started

### Prerequisites
- Modern web browser with ES6 module support
- GitHub Personal Access Token (for upload/delete operations)

### Installation

1. Clone or download the repository
2. Open `index.html` in a web browser
3. Enter a GitHub username to browse repositories
4. Optionally, enter a GitHub Personal Access Token for upload/delete operations

### GitHub Token Setup

To enable file upload and deletion features:

1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Generate a new token with `public_repo` scope
3. Enter the token in the application interface
4. The token is stored locally in your browser

## Usage

### Browsing Repositories
1. Enter a GitHub username in the input field
2. Click "Load User" to fetch public repositories
3. Double-click on a repository to browse its contents
4. Use breadcrumb navigation to move between folders
5. Double-click on files to preview (PDF files only)

### PDF Viewing
1. Double-click on a PDF file to open the viewer
2. Use zoom controls to adjust the view
3. Navigate pages using prev/next buttons or page input
4. Download the PDF using the download button
5. Close the viewer to return to file browsing

### File Operations
1. Ensure you have a valid GitHub token entered
2. Select files using the file input in the sidebar
3. Click "Upload" to add files to the current repository folder
4. Click the delete button (🗑️) on files to remove them

## Browser Compatibility

- Chrome 61+
- Firefox 60+
- Safari 11+
- Edge 16+

## Performance Optimizations

- **Debounced Input**: Prevents excessive API calls during typing
- **Lazy Loading**: PDF pages are rendered on demand
- **Efficient DOM Updates**: Minimal DOM manipulation with targeted updates
- **Memory Management**: Proper cleanup of event listeners and resources
- **Responsive Images**: Optimized rendering for different screen sizes

## Accessibility Features

- **Keyboard Navigation**: Full keyboard support for all operations
- **Screen Reader Support**: Proper ARIA labels and semantic HTML
- **High Contrast Mode**: Support for system high contrast preferences
- **Reduced Motion**: Respects user's motion preferences
- **Focus Management**: Clear focus indicators and logical tab order

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes following the existing code style
4. Test your changes across different browsers
5. Submit a pull request

## License

This project is open source and available under the MIT License.
