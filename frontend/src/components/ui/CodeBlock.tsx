import { CopyButton } from './CopyButton';

interface CodeBlockProps {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
  className?: string;
}

// Very lightweight token coloring — no external dep
function tokenize(code: string): React.ReactNode[] {
  const lines = code.split('\n');
  return lines.map((line, lineIdx) => {
    // Basic patterns
    const tokenized = line
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    return (
      <span key={lineIdx} style={{ display: 'block' }}>
        <span dangerouslySetInnerHTML={{ __html: applyColors(tokenized) }} />
      </span>
    );
  });
}

function applyColors(line: string): string {
  return line
    // Comments
    .replace(/(#.*$)/g, '<span class="tok-comment">$1</span>')
    // Keywords
    .replace(/\b(import|from|def|class|return|await|async|if|else|elif|for|while|with|as|try|except|raise|in|not|and|or|True|False|None|pip|python)\b/g, '<span class="tok-keyword">$1</span>')
    // Strings
    .replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, '<span class="tok-string">$1</span>')
    // Numbers
    .replace(/\b(\d+\.?\d*)\b/g, '<span class="tok-number">$1</span>');
}

export function CodeBlock({ code, language = 'python', showLineNumbers = true, className = '' }: CodeBlockProps) {
  return (
    <div className={`code-block ${className}`}>
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/8">
        <span className="text-[11px] font-mono tracking-widest text-slate-500 uppercase">{language}</span>
        <CopyButton text={code} />
      </div>
      <pre style={{ margin: 0, padding: '1rem 1.25rem', overflowX: 'auto' }}>
        <code style={{ fontSize: '13px', lineHeight: '1.8' }}>
          {showLineNumbers
            ? code.split('\n').map((line, i) => (
                <span key={i} style={{ display: 'block' }}>
                  <span className="code-line-number">{i + 1}</span>
                  <span dangerouslySetInnerHTML={{ __html: applyColors(
                    line.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
                  ) }} />
                </span>
              ))
            : tokenize(code)
          }
        </code>
      </pre>
    </div>
  );
}
