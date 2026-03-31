'use client';
import { useApp } from '@/context/AppContext';
import MetricCard from '@/components/MetricCard';
import { fmt } from '@/lib/utils';

function GroupRow({ name, count, total }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: 14 }}>
      <span style={{ color: 'var(--text)', flex: 1, minWidth: 0 }}>
        {name}<span style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginTop: 1 }}>{count} lançamento{count !== 1 ? 's' : ''}</span>
      </span>
      <span style={{ fontWeight: 500, color: 'var(--text)', fontFamily: "'DM Serif Display', serif", fontSize: 16, whiteSpace: 'nowrap', flexShrink: 0 }}>{fmt(total)}</span>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', marginBottom: '1.5rem' }}>
      <div style={{ fontSize: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text3)', marginBottom: '1rem' }}>{title}</div>
      {children}
    </div>
  );
}

const groupBy = (list, key) => {
  const map = {};
  list.forEach(l => { const k = l[key] || '(sem)'; if (!map[k]) map[k] = { val: 0, count: 0 }; map[k].val += l.value; map[k].count++; });
  return Object.entries(map).sort((a, b) => b[1].val - a[1].val);
};

export default function LancRelatorioPage() {
  const { state } = useApp();
  const { lancamentos } = state;
  const total = lancamentos.reduce((s, l) => s + l.value, 0);
  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: 24, fontWeight: 600, color: '#1a1a1a', letterSpacing: '-0.3px', lineHeight: 1.2 }}>Relatório de lançamentos</div>
        <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>Resumo por gestor e categoria</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14, marginBottom: '1.5rem' }}>
        <MetricCard label="Total lançamentos" value={lancamentos.length}/>
        <MetricCard label="Valor total" value={fmt(total)}/>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: '1.5rem' }}>
        <Card title="Por gestor">
          {groupBy(lancamentos, 'gestor').length > 0 ? groupBy(lancamentos, 'gestor').map(([k, v]) => <GroupRow key={k} name={k} count={v.count} total={v.val}/>) : <div style={{ fontSize: 13, color: 'var(--text3)' }}>Sem dados</div>}
        </Card>
        <Card title="Por categoria de despesa">
          {groupBy(lancamentos, 'cat').length > 0 ? groupBy(lancamentos, 'cat').map(([k, v]) => <GroupRow key={k} name={k} count={v.count} total={v.val}/>) : <div style={{ fontSize: 13, color: 'var(--text3)' }}>Sem dados</div>}
        </Card>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Card title="Por tipo de pagamento">
          {groupBy(lancamentos, 'tipopgto').length > 0 ? groupBy(lancamentos, 'tipopgto').map(([k, v]) => <GroupRow key={k} name={k} count={v.count} total={v.val}/>) : <div style={{ fontSize: 13, color: 'var(--text3)' }}>Sem dados</div>}
        </Card>
      </div>
    </div>
  );
}
