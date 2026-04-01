'use client';
import { fmt } from '@/lib/utils';

export default function RateioSection({ rateioEnabled, rateioLines, setRateioLines, billValue, activeBases }) {
  function addRateioLine() {
    setRateioLines(l => [...l, { base: activeBases[0]?.nome || '', val: '', type: 'R$' }]);
  }
  function updateRatLine(idx, key, val) {
    setRateioLines(l => l.map((r, i) => i === idx ? { ...r, [key]: val } : r));
  }
  function removeRatLine(idx) {
    setRateioLines(l => l.filter((_, i) => i !== idx));
  }

  const rateioTotal = rateioLines.reduce((s, r) => {
    const v = parseFloat(r.val) || 0;
    return s + (r.type === '%' ? billValue * v / 100 : v);
  }, 0);

  if (!rateioEnabled) return null;

  return (
    <div style={{ marginTop: '0.75rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rateioLines.map((r, i) => (
          <div key={i} className="rateio-line">
            <select value={r.base} onChange={e => updateRatLine(i, 'base', e.target.value)}>
              {activeBases.map(b => <option key={b.nome} value={b.nome}>{b.nome}</option>)}
            </select>
            <input type="number" placeholder="Valor" value={r.val} onChange={e => updateRatLine(i, 'val', e.target.value)} min="0" step="0.01"/>
            <select value={r.type} onChange={e => updateRatLine(i, 'type', e.target.value)} style={{ width: 70, padding: '7px 6px', fontSize: 12 }}>
              <option value="R$">R$</option>
              <option value="%">%</option>
            </select>
            <button onClick={() => removeRatLine(i)} style={{ background: 'transparent', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 16 }}>×</button>
          </div>
        ))}
      </div>
      <button onClick={addRateioLine} style={{ background: 'transparent', border: '1px dashed var(--border2)', borderRadius: 'var(--radius)', padding: '6px 12px', fontSize: 13, color: 'var(--accent-text)', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', width: '100%', marginTop: 4 }}>
        + Adicionar linha de rateio
      </button>
      <div style={{ fontSize: 12, color: Math.abs(billValue - rateioTotal) > 0.01 ? 'var(--danger)' : 'var(--text3)', marginTop: 6 }}>
        Rateado: {fmt(rateioTotal)} de {fmt(billValue)}{Math.abs(billValue - rateioTotal) > 0.01 ? ` · Faltam ${fmt(billValue - rateioTotal)}` : ' · Completo ✓'}
      </div>
    </div>
  );
}
