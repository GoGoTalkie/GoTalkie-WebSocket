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

  return (
    <div className="file-attachment">
      <div className="file-icon">{fileType}</div>
      <div className="file-info-inline">
        <div className="file-name">{file.name}</div>
        <div className="file-size">{sizeKB} KB</div>
      </div>
      <button className="file-preview-btn" onClick={onPreview}>
        👁️ Preview
      </button>
    </div>
  );
};

export default FileMessage;
