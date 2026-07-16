/**
 * Minimal renderer for AI/human comment bodies: splits on ```fenced code
 * blocks``` and renders those in <pre><code>, everything else as wrapped
 * text. Deliberately not a full markdown parser (no extra dependency) —
 * good enough to make CodeAI's generated files and Mermaid blocks readable.
 */
export default function CommentBody({ text }: { text: string }) {
  const parts = text.split(/```(\w*)\n([\s\S]*?)```/g);
  // String.split with a capturing-group regex yields: [text, lang, code, text, lang, code, ...]
  const nodes: JSX.Element[] = [];
  for (let i = 0; i < parts.length; i += 3) {
    const plain = parts[i];
    if (plain) nodes.push(<p key={`t${i}`} className="whitespace-pre-wrap text-sm mb-2">{plain.trim()}</p>);
    const lang = parts[i + 1];
    const code = parts[i + 2];
    if (code !== undefined) {
      nodes.push(
        <pre key={`c${i}`} className="mono text-xs p-3 rounded-md overflow-x-auto mb-2"
            style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
          {lang && <div className="text-text-muted mb-1">{lang}</div>}
          <code>{code.trim()}</code>
        </pre>
      );
    }
  }
  return <div>{nodes}</div>;
}
