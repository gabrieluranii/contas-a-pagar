'use client';

function fileIcon(name) {
  const ext = (name || '').split('.').pop().toLowerCase();
  if (['jpg','jpeg','png','gif','webp'].includes(ext)) return '🖼';
  if (ext === 'pdf') return '📄';
  return '📎';
}

export default function AttachmentTab({
  attachments, setAttachments, onAddFiles, onPreview, fileRef
}) {
  const handlePreview = (a) => {
    if (a.url) {
      window.open(a.url, '_blank');
      return;
    }
    if (a.data) {
      try {
        const parts = a.data.split(',');
        const mime = parts[0].split(':')[1].split(';')[0];
        const b64 = parts[1];
        const bytes = atob(b64);
        const array = new Uint8Array(bytes.length);
        for (let i = 0; i < bytes.length; i++) array[i] = bytes.charCodeAt(i);
        const blob = new Blob([array], { type: mime });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
      } catch (e) {
        alert('Erro ao processar visualização');
      }
      return;
    }
    alert('Arquivo não disponível');
  };

  return (
    <div>
      {/* Drop area */}
      <div
        onClick={() => fileRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); onAddFiles(Array.from(e.dataTransfer.files)); }}
        style={{
          border: '1.5px dashed var(--border2)', borderRadius: 'var(--radius-lg)',
          padding: '1.25rem', marginBottom: '1.25rem', textAlign: 'center',
          cursor: 'pointer', transition: 'all 0.15s', background: 'var(--surface)',
        }}
      >
        <input ref={fileRef} type="file" accept="image/*,.pdf" multiple onChange={e => onAddFiles(Array.from(e.target.files))} style={{ display: 'none' }}/>
        <div style={{ fontSize: 14, color: 'var(--text2)' }}>
          <strong style={{ color: 'var(--accent-text)' }}>Clique aqui ou arraste</strong> para anexar arquivos
        </div>
        <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>PDF, imagem</div>
      </div>



      {/* Attachment list */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {attachments.map((a, i) => (
          <div key={i} className="attach-chip" style={{ maxWidth: 220 }}>
            <span style={{ fontSize: 14, flexShrink: 0 }}>{fileIcon(a.name)}</span>
            <span 
              onClick={() => onPreview ? onPreview(a) : handlePreview(a)}
              style={{ 
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
                cursor: 'pointer', textDecoration: 'underline', color: 'var(--info, #3b82f6)'
              }} 
              title="Clique para visualizar"
            >
              {a.name}
            </span>
            <button
              onClick={() => setAttachments(att => att.filter((_, j) => j !== i))}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 13, padding: 0, lineHeight: 1 }}
            >✕</button>
          </div>
        ))}
        {attachments.length === 0 && (
          <div style={{ fontSize: 13, color: 'var(--text3)' }}>Nenhum anexo</div>
        )}
      </div>
    </div>
  );
}
