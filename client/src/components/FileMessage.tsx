import React from 'react';
import { FileData } from '../types';

interface FileMessageProps {
  file: FileData;
  onPreview: () => void;
}

const FILE_TYPES: Record<string, string> = {
  '.c': 'C',
  '.cpp': 'C++',
  '.cc': 'C++',
  '.cxx': 'C++',
  '.h': 'C/C++ Header',
  '.hpp': 'C++ Header',
  '.py': 'Python',
  '.js': 'JavaScript',
  '.ts': 'TypeScript',
  '.jsx': 'React JSX',
  '.tsx': 'React TSX',
  '.java': 'Java',
  '.go': 'Go',
  '.rs': 'Rust',
  '.json': 'JSON',
  '.xml': 'XML',
  '.html': 'HTML',
  '.css': 'CSS',
  '.sql': 'SQL',
  '.sh': 'Shell Script',
  '.bat': 'Batch',
  '.md': 'Markdown',
  '.txt': 'Text'
};

const FileMessage: React.FC<FileMessageProps> = ({ file, onPreview }) => {
  const ext = '.' + file.name.split('.').pop()?.toLowerCase();
  const fileType = FILE_TYPES[ext] || 'File';
  const sizeKB = (file.size / 1024).toFixed(2);
  const onDownload = () => {
    try {
      // Create a blob from the file content and trigger a download
      const blob = new Blob([file.content], { type: file.type || 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      // Release the object URL after a short delay to ensure download starts
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error('Download failed', err);
    }
  };

  return (
    <div className="file-attachment">
      <div className="file-icon">{fileType}</div>
      <div className="file-info-inline">
        <div className="file-name">{file.name}</div>
        <div className="file-size">{sizeKB} KB</div>
      </div>
      <div className="file-actions">
        <button className="file-preview-btn" onClick={onPreview} title="Preview file">
          👁️ Preview
        </button>
        <button className="file-download-btn" onClick={onDownload} title="Download file">
          ⤓ Download
        </button>
      </div>
    </div>
  );
};

export default FileMessage;
