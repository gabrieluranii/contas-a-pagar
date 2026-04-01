'use client';
import RateioSection from './RateioSection';

export default function ExtrasSection({
  rateioEnabled, setRateioEnabled, rateioLines, setRateioLines, billValue, activeBases,
  tvoEnabled, setTvoEnabled, tvoValue, setTvoValue,
  contEnabled, setContEnabled, contValue, setContValue
}) {
  return (
    <div style={{ gridColumn: '1 / -1', background: 'var(--surface2)', borderRadius: 'var(--radius)', padding: '1rem', marginTop: 4 }}>
      <div style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text3)', marginBottom: '0.75rem' }}>Opções extras</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <input type="checkbox" checked={rateioEnabled} onChange={e => {
            setRateioEnabled(e.target.checked);
            if (e.target.checked && rateioLines.length === 0) {
              setRateioLines([{ base: activeBases[0]?.nome || '', val: '', type: 'R$' }]);
            }
          }} style={{ width: 16, height: 16, accentColor: 'var(--accent)', padding: 0, border: 'none' }}/>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)' }}>Rateio</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <input type="checkbox" checked={tvoEnabled} onChange={e => setTvoEnabled(e.target.checked)} style={{ width: 16, height: 16, accentColor: 'var(--accent)', padding: 0, border: 'none' }}/>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)' }}>TVO</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <input type="checkbox" checked={contEnabled} onChange={e => setContEnabled(e.target.checked)} style={{ width: 16, height: 16, accentColor: 'var(--accent)', padding: 0, border: 'none' }}/>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)' }}>Contingência</span>
        </label>
      </div>

      <RateioSection 
        rateioEnabled={rateioEnabled} 
        rateioLines={rateioLines}
        setRateioLines={setRateioLines}
        billValue={billValue}
        activeBases={activeBases}
      />

      {tvoEnabled && (
        <div style={{ marginTop: '0.75rem' }}>
          <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text2)', display: 'block', marginBottom: 5 }}>Valor TVO (R$)</label>
          <input type="number" value={tvoValue} onChange={e => setTvoValue(e.target.value)} placeholder="0,00" style={{ padding: '7px 10px', fontSize: 13 }}/>
        </div>
      )}

      {contEnabled && (
        <div style={{ marginTop: '0.75rem' }}>
          <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text2)', display: 'block', marginBottom: 5 }}>Valor Contingência (R$)</label>
          <input type="number" value={contValue} onChange={e => setContValue(e.target.value)} placeholder="0,00" style={{ padding: '7px 10px', fontSize: 13 }}/>
        </div>
      )}
    </div>
  );
}
