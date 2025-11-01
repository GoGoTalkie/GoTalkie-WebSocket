import React, { useMemo } from 'react';
import './FilePreviewModal.css';

interface FilePreviewModalProps {
  file: File;
  content: string;
  onClose: () => void;
  onSend: () => void;
  isReceived?: boolean;
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

const highlightCode = (code: string, ext: string): string => {
  // Language-specific keywords
  const languageKeywords: Record<string, string[]> = {
    c: ['auto', 'break', 'case', 'char', 'const', 'continue', 'default', 'do',
        'double', 'else', 'enum', 'extern', 'float', 'for', 'goto', 'if',
        'inline', 'int', 'long', 'register', 'restrict', 'return', 'short',
        'signed', 'sizeof', 'static', 'struct', 'switch', 'typedef', 'union',
        'unsigned', 'void', 'volatile', 'while'],
    cpp: ['auto', 'break', 'case', 'char', 'const', 'continue', 'default', 'do',
          'double', 'else', 'enum', 'extern', 'float', 'for', 'goto', 'if',
          'inline', 'int', 'long', 'register', 'return', 'short', 'signed',
          'sizeof', 'static', 'struct', 'switch', 'typedef', 'union', 'unsigned',
          'void', 'volatile', 'while', 'class', 'namespace', 'template', 'typename',
          'public', 'private', 'protected', 'virtual', 'friend', 'operator', 'new',
          'delete', 'this', 'try', 'catch', 'throw', 'using', 'bool', 'true', 'false',
          'nullptr', 'constexpr', 'decltype', 'explicit', 'mutable', 'override', 'final'],
    python: ['False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await', 'break',
             'class', 'continue', 'def', 'del', 'elif', 'else', 'except', 'finally',
             'for', 'from', 'global', 'if', 'import', 'in', 'is', 'lambda', 'nonlocal',
             'not', 'or', 'pass', 'raise', 'return', 'try', 'while', 'with', 'yield'],
    javascript: ['abstract', 'arguments', 'await', 'boolean', 'break', 'byte', 'case',
                 'catch', 'char', 'class', 'const', 'continue', 'debugger', 'default',
                 'delete', 'do', 'double', 'else', 'enum', 'eval', 'export', 'extends',
                 'false', 'final', 'finally', 'float', 'for', 'function', 'goto', 'if',
                 'implements', 'import', 'in', 'instanceof', 'int', 'interface', 'let',
                 'long', 'native', 'new', 'null', 'package', 'private', 'protected',
                 'public', 'return', 'short', 'static', 'super', 'switch', 'synchronized',
                 'this', 'throw', 'throws', 'transient', 'true', 'try', 'typeof', 'var',
                 'void', 'volatile', 'while', 'with', 'yield', 'async', 'of'],
    java: ['abstract', 'assert', 'boolean', 'break', 'byte', 'case', 'catch', 'char',
           'class', 'const', 'continue', 'default', 'do', 'double', 'else', 'enum',
           'extends', 'final', 'finally', 'float', 'for', 'goto', 'if', 'implements',
           'import', 'instanceof', 'int', 'interface', 'long', 'native', 'new', 'package',
           'private', 'protected', 'public', 'return', 'short', 'static', 'strictfp',
           'super', 'switch', 'synchronized', 'this', 'throw', 'throws', 'transient',
           'try', 'void', 'volatile', 'while', 'true', 'false', 'null'],
    go: ['break', 'case', 'chan', 'const', 'continue', 'default', 'defer', 'else',
         'fallthrough', 'for', 'func', 'go', 'goto', 'if', 'import', 'interface',
         'map', 'package', 'range', 'return', 'select', 'struct', 'switch', 'type',
         'var', 'true', 'false', 'nil'],
    rust: ['as', 'break', 'const', 'continue', 'crate', 'else', 'enum', 'extern',
           'false', 'fn', 'for', 'if', 'impl', 'in', 'let', 'loop', 'match', 'mod',
           'move', 'mut', 'pub', 'ref', 'return', 'self', 'Self', 'static', 'struct',
           'super', 'trait', 'true', 'type', 'unsafe', 'use', 'where', 'while']
  };

  const langMap: Record<string, string> = {
    '.c': 'c', '.h': 'c',
    '.cpp': 'cpp', '.cc': 'cpp', '.cxx': 'cpp', '.hpp': 'cpp',
    '.py': 'python',
    '.js': 'javascript', '.jsx': 'javascript',
    '.ts': 'javascript', '.tsx': 'javascript',
    '.java': 'java',
    '.go': 'go',
    '.rs': 'rust'
  };

  const lang = langMap[ext] || 'c';
  const keywords = languageKeywords[lang] || languageKeywords.c;

  // Use placeholder system to preserve highlighting during HTML escaping
  const placeholders: Array<{ id: string; html: string }> = [];
  let placeholderIndex = 0;
  let highlighted = code;

  // Helper to create placeholder
  const createPlaceholder = (html: string): string => {
    const id = `__PLACEHOLDER_${placeholderIndex++}__`;
    placeholders.push({ id, html });
    return id;
  };

  // Helper to escape HTML
  const escapeHtml = (text: string): string => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  };

  // 1. Extract and highlight strings (preserve order for nested patterns)
  highlighted = highlighted.replace(/"""[\s\S]*?"""/g, match => 
    createPlaceholder(`<span class="string">${escapeHtml(match)}</span>`)
  );
  highlighted = highlighted.replace(/'''[\s\S]*?'''/g, match => 
    createPlaceholder(`<span class="string">${escapeHtml(match)}</span>`)
  );
  highlighted = highlighted.replace(/"([^"\\]*(\\.[^"\\]*)*)"/g, match => 
    createPlaceholder(`<span class="string">${escapeHtml(match)}</span>`)
  );
  highlighted = highlighted.replace(/'([^'\\]*(\\.[^'\\]*)*)'/g, match => 
    createPlaceholder(`<span class="string">${escapeHtml(match)}</span>`)
  );
  highlighted = highlighted.replace(/`[^`]*`/g, match => 
    createPlaceholder(`<span class="string">${escapeHtml(match)}</span>`)
  );

  // 2. Extract and highlight preprocessor directives BEFORE comments (C/C++)
  if (['.c', '.cpp', '.h', '.hpp', '.cc', '.cxx'].includes(ext)) {
    highlighted = highlighted.replace(/^(#\s*\w+.*?)$/gm, match => 
      createPlaceholder(`<span class="preprocessor">${escapeHtml(match)}</span>`)
    );
  }

  // 3. Extract and highlight Python decorators
  if (ext === '.py') {
    highlighted = highlighted.replace(/^(\s*@\w+.*?)$/gm, match => 
      createPlaceholder(`<span class="preprocessor">${escapeHtml(match)}</span>`)
    );
  }

  // 4. Extract and highlight comments
  // C/C++/Java style block comments
  highlighted = highlighted.replace(/\/\*[\s\S]*?\*\//g, match => 
    createPlaceholder(`<span class="comment">${escapeHtml(match)}</span>`)
  );
  
  // C/C++/Java/JavaScript style line comments
  if (['.c', '.cpp', '.h', '.hpp', '.cc', '.cxx', '.java', '.js', '.jsx', '.ts', '.tsx', '.go', '.rs'].includes(ext)) {
    highlighted = highlighted.replace(/\/\/.*/g, match => 
      createPlaceholder(`<span class="comment">${escapeHtml(match)}</span>`)
    );
  }
  
  // Python/Shell comments (only for specific file types)
  if (['.py', '.sh'].includes(ext)) {
    highlighted = highlighted.replace(/#.*/g, match => 
      createPlaceholder(`<span class="comment">${escapeHtml(match)}</span>`)
    );
  }

  // 5. Now escape remaining HTML (actual code content)
  highlighted = escapeHtml(highlighted);

  // 6. Highlight keywords
  keywords.forEach(keyword => {
    const regex = new RegExp(`\\b(${keyword})\\b`, 'g');
    highlighted = highlighted.replace(regex, '<span class="keyword">$1</span>');
  });

  // 7. Highlight numbers
  highlighted = highlighted.replace(/\b(\d+\.?\d*[fFlLuU]*)\b/g, '<span class="number">$1</span>');

  // 8. Highlight function calls
  highlighted = highlighted.replace(/\b([a-zA-Z_]\w*)\s*\(/g, '<span class="function">$1</span>(');

  // 9. Restore all placeholders
  placeholders.forEach(({ id, html }) => {
    highlighted = highlighted.replace(id, html);
  });

  return highlighted;
};

const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  file,
  content,
  onClose,
  onSend,
  isReceived = false
}) => {
  const ext = useMemo(() => '.' + file.name.split('.').pop()?.toLowerCase(), [file.name]);
  const fileType = FILE_TYPES[ext] || 'File';
  const sizeKB = (file.size / 1024).toFixed(2);
  const lines = content.split('\n');
  const lineCount = lines.length;

  const highlightedCode = useMemo(() => highlightCode(content, ext), [content, ext]);

  const lineNumbers = useMemo(() => {
    return Array.from({ length: lineCount }, (_, i) => i + 1);
  }, [lineCount]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="file-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{file.name}</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="file-modal-body">
          <div className="file-info">
            <span>{fileType}</span>
            <span>{sizeKB} KB</span>
            <span>{lineCount} lines</span>
          </div>
          <div className="code-preview-container">
            <div className="code-preview-wrapper">
              <div className="line-numbers">
                {lineNumbers.map(num => (
                  <div key={num}>{num}</div>
                ))}
              </div>
              <pre 
                className="code-content"
                dangerouslySetInnerHTML={{ __html: highlightedCode }}
              />
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>Close</button>
          {!isReceived && (
            <button className="btn-send-file" onClick={onSend}>Send File</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilePreviewModal;
