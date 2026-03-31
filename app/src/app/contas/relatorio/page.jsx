'use client';
import { useApp } from '@/context/AppContext';
import MetricCard from '@/components/MetricCard';
import { fmt, isOverdue } from '@/lib/utils';

function GroupRow({ name, count, total }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: 14 }}>
      <span style={{ color: 'var(--text)', flex: 1, minWidth: 0 }}>
        {name}
        <span style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginTop: 1 }}>{count} lançamento{count !== 1 ? 's' : ''}</span>
      </span>
      <span style={{ fontWeight: 500, color: 'var(--text)', fontFamily: "'DM Serif Display', serif", fontSize: 16, whiteSpace: 'nowrap' }}>{fmt(total)}</span>
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
  list.forEach(b => { const k = b[key] || '(sem)'; if (!map[k]) map[k] = { val: 0, count: 0 }; map[k].val += b.value; map[k].count++; });
  return Object.entries(map).sort((a, b) => b[1].val - a[1].val);
};

export default function ContasRelatorioPage() {
  const { state } = useApp();
  const { bills } = state;

  const pending = bills.filter(b => b.status === 'pending');
  const paid    = bills.filter(b => b.status === 'paid');
  const overdue = bills.filter(b => isOverdue(b.due, b.status));
  const rate    = bills.length ? Math.round(paid.length / bills.length * 100) : 0;

  const tvoList   = bills.filter(b => b.tvo != null);
  const contList  = bills.filter(b => b.conting != null);

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: 24, fontWeight: 600, color: '#1a1a1a', letterSpacing: '-0.3px', lineHeight: 1.2 }}>Relatório</div>
        <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>Resumo por base e categoria</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14, marginBottom: '1.5rem' }}>
        <MetricCard label="Total lançamentos" value={bills.length} sub={fmt(bills.reduce((s, b) => s + b.value, 0))}/>
        <MetricCard label="Total em aberto" value={fmt(pending.reduce((s, b) => s + b.value, 0))} sub={`${pending.length} lançamentos`} color="red"/>
        <MetricCard label="Total pago" value={fmt(paid.reduce((s, b) => s + b.value, 0))} sub={`${paid.length} lançamentos`} color="green"/>
        <MetricCard label="Contas vencidas" value={overdue.length} color="red"/>
        <MetricCard label="Taxa de pagamento" value={`${rate}%`} color="green"/>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: '1.5rem' }}>
        <Card title="Por base (pendente)">
          {groupBy(pending, 'base').length > 0
            ? groupBy(pending, 'base').map(([k, v]) => <GroupRow key={k} name={k} count={v.count} total={v.val}/>)
            : <div style={{ fontSize: 13, color: 'var(--text3)' }}>Sem dados</div>}
        </Card>
        <Card title="Por categoria (pendente)">
          {groupBy(pending, 'cat').length > 0
            ? groupBy(pending, 'cat').map(([k, v]) => <GroupRow key={k} name={k} count={v.count} total={v.val}/>)
            : <div style={{ fontSize: 13, color: 'var(--text3)' }}>Sem dados</div>}
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: '1.5rem' }}>
        <Card title="TVO lançados">
          {tvoList.length > 0
            ? tvoList.map(b => <GroupRow key={b.id} name={b.supplier} count={1} total={b.tvo}/>)
            : <div style={{ fontSize: 13, color: 'var(--text3)' }}>Sem dados</div>}
        </Card>
        <Card title="Contingências lançadas">
          {contList.length > 0
            ? contList.map(b => <GroupRow key={b.id} name={b.supplier} count={1} total={b.conting}/>)
            : <div style={{ fontSize: 13, color: 'var(--text3)' }}>Sem dados</div>}
        </Card>
      </div>

      <Card title="Por fornecedor (pendente)">
        {groupBy(pending, 'supplier').length > 0
          ? groupBy(pending, 'supplier').map(([k, v]) => <GroupRow key={k} name={k} count={v.count} total={v.val}/>)
          : <div style={{ fontSize: 13, color: 'var(--text3)' }}>Sem dados</div>}
      </Card>
    </div>
  );
}
