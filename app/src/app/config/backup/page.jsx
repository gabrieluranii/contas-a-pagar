'use client';
import { useApp } from '@/context/AppContext';

export default function BackupPage() {
  const { state, dispatch } = useApp();

  function exportData() {
    const data = {
      bills: state.bills, tvoBills: state.tvoBills, lancamentos: state.lancamentos,
      tvoRegistros: state.tvoRegistros, bases: state.bases, cats: state.cats,
      catDespesas: state.catDespesas, gestores: state.gestores, orcamentos: state.orcamentos,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contas_a_pagar_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importData(e) {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!data.bills || !Array.isArray(data.bills)) throw new Error();
        if (!confirm(`Importar ${data.bills.length} lançamento(s)? Os dados atuais serão substituídos.`)) return;
        dispatch({ type: 'IMPORT_ALL', payload: data });
        alert(`${data.bills.length} lançamento(s) importado(s) com sucesso!`);
      } catch {
        alert('Arquivo inválido. Use um backup exportado por este app.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function clearAll() {
    if (!confirm('Tem certeza? Todos os lançamentos serão apagados permanentemente.')) return;
    dispatch({ type: 'CLEAR_BILLS' });
  }

  const cardStyle = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', maxWidth: 520, marginBottom: '1.5rem' };
  const titleStyle = { fontSize: 13, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text3)', marginBottom: '1.25rem' };
  const btnPrimary = { padding: '9px 20px', fontSize: 14, fontFamily: 'inherit', borderRadius: 'var(--radius)', cursor: 'pointer', fontWeight: 500, background: 'var(--accent)', color: '#fff', border: 'none' };
  const btnSecondary = { padding: '9px 20px', fontSize: 14, fontFamily: 'inherit', borderRadius: 'var(--radius)', cursor: 'pointer', fontWeight: 500, background: 'transparent', color: 'var(--text2)', border: '1px solid var(--border2)' };
  const btnDanger = { padding: '9px 20px', fontSize: 14, fontFamily: 'inherit', borderRadius: 'var(--radius)', cursor: 'pointer', fontWeight: 500, background: 'transparent', color: 'var(--danger)', border: '1px solid var(--danger)' };

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: 24, fontWeight: 600, color: '#1a1a1a', letterSpacing: '-0.3px', lineHeight: 1.2 }}>Backup</div>
        <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>Exporte ou importe seus dados</div>
      </div>

      <div style={cardStyle}>
        <div style={titleStyle}>Exportar dados</div>
        <p style={{ fontSize: 14, color: 'var(--text2)', marginBottom: '1.25rem', lineHeight: 1.6 }}>
          Salva lançamentos, bases e categorias em um arquivo <code style={{ fontFamily: 'monospace', background: 'var(--surface2)', padding: '2px 6px', borderRadius: 5 }}>.json</code>.
        </p>
        <button onClick={exportData} style={btnPrimary}>Exportar backup</button>
      </div>

      <div style={cardStyle}>
        <div style={titleStyle}>Importar dados</div>
        <p style={{ fontSize: 14, color: 'var(--text2)', marginBottom: '1.25rem', lineHeight: 1.6 }}>
          Restaura a partir de um backup. Os dados atuais serão <strong style={{ fontWeight: 500, color: 'var(--danger)' }}>substituídos</strong>.
        </p>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={btnSecondary}>
            Escolher arquivo
            <input type="file" accept=".json" onChange={importData} style={{ display: 'none' }}/>
          </label>
        </div>
      </div>

      <div style={{ ...cardStyle, borderColor: 'var(--danger-light)' }}>
        <div style={{ ...titleStyle, color: 'var(--danger)' }}>Zona de perigo</div>
        <p style={{ fontSize: 14, color: 'var(--text2)', marginBottom: '1.25rem', lineHeight: 1.6 }}>
          Apaga permanentemente todos os lançamentos. Bases e categorias são mantidas.
        </p>
        <button onClick={clearAll} style={btnDanger}>Apagar todos os lançamentos</button>
      </div>
    </div>
  );
}
