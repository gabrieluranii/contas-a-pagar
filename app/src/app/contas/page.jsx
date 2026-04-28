'use client';
import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import MetricCard from '@/components/MetricCard';
import AlertBanner from '@/components/AlertBanner';
import BillRow from '@/components/BillRow';
import BillModal from '@/components/BillModal';
import PagarModal from '@/components/PagarModal';
import ConfirmModal from '@/components/ConfirmModal';
import { isOverdue, urgencyStatus, LAUNCH_DAYS } from '@/lib/utils';

function EmptyState({ icon, text }) {
  return (
    <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#888888', fontSize: 13, fontFamily: 'Inter, sans-serif' }}>
      <div style={{ fontSize: 28, marginBottom: '0.5rem', color: '#cccccc' }}>{icon}</div>
      {text}
    </div>
  );
}

function Card({ title, children, style }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid #e0e0dd', borderRadius: 'var(--radius-lg)', padding: '1.5rem', marginBottom: '1.5rem', ...style }}>
      {title && <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '1px', color: '#444444', marginBottom: '1.25rem' }}>{title}</div>}
      {children}
    </div>
  );
}

function PageBtn({ onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: '9px 20px', fontSize: 13,
        fontFamily: 'Poppins, sans-serif', fontWeight: 600,
        borderRadius: 'var(--radius)', cursor: 'pointer',
        background: hov ? '#c4663f' : '#d97757',
        color: '#fff', border: 'none',
        transition: 'background 0.15s',
      }}
    >
      + Novo lançamento
    </button>
  );
}

export default function ContasPage() {
  const { state, dispatch } = useApp();
  const [billModalOpen, setBillModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [pagarModalOpen, setPagarModalOpen] = useState(false);
  const [pagarBillId, setPagarBillId] = useState(null);
  const [dateStr, setDateStr] = useState('');
  const [confirmCfg, setConfirmCfg] = useState({ isOpen: false, message: '', onConfirm: null });

  useEffect(() => {
    setDateStr(new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
  }, []);

  const { bills } = state;
  const pending  = bills.filter(b => b.status === 'pending');
  const paid     = bills.filter(b => b.status === 'paid');
  const overdue  = pending.filter(b => isOverdue(b.due, b.status));
  const upcoming = pending
    .filter(b => !isOverdue(b.due, b.status))
    .sort((a, b) => a.due.localeCompare(b.due))
    .slice(0, 8);

  const actionNeeded = pending.filter(b => {
    const st = urgencyStatus(b);
    return st === 'critical' || st === 'warning';
  }).sort((a, b) => a.due.localeCompare(b.due));

  const criticalCount = pending.filter(b => urgencyStatus(b) === 'critical').length;
  const urgentTotal   = overdue.length + criticalCount;

  const today = new Date().toISOString().slice(0, 10);
  const in7   = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const venceHoje    = bills.filter(b => b.status === 'pending' && b.due === today).length;
  const proximos7    = bills.filter(b => b.status === 'pending' && b.due > today && b.due <= in7).length;
  const totalPendente = bills.filter(b => b.status === 'pending').length;



  function handleToggle(id) {
    const b = bills.find(x => x.id === id);
    if (!b) return;
    if (b.status === 'paid') dispatch({ type: 'UPDATE_BILL', payload: { ...b, status: 'pending' } });
    else { setPagarBillId(id); setPagarModalOpen(true); }
  }
  function handleEdit(id) { setEditId(id); setIsReadOnly(false); setBillModalOpen(true); }
  function handleDelete(id) {
    setConfirmCfg({
      isOpen: true,
      message: 'Excluir este lançamento?',
      onConfirm: () => dispatch({ type: 'DELETE_BILL', payload: id })
    });
  }
  function handleView(id) { setEditId(id); setIsReadOnly(true); setBillModalOpen(true); }

  const allUrgent = [...overdue, ...actionNeeded.filter(b => !isOverdue(b.due, b.status))];

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10, marginBottom: '2rem' }}>
        <div>
          <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: 24, fontWeight: 600, color: '#1a1a1a', letterSpacing: '-0.3px', lineHeight: 1.2 }}>Pagamentos Pendentes</div>
        </div>
        <PageBtn onClick={() => { setEditId(null); setIsReadOnly(false); setBillModalOpen(true); }}/>
      </div>

      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: '2rem' }}>
        <MetricCard
          label="Vence hoje"
          value={venceHoje}
          sub="lançamentos"
          color={venceHoje > 0 ? 'red' : undefined}
        />
        <MetricCard
          label="Próximos 10 dias"
          value={proximos7}
          sub="lançamentos"
          color={proximos7 > 0 ? 'yellow' : undefined}
        />
        <MetricCard
          label="Total pendente"
          value={totalPendente}
          sub="lançamentos"
        />
      </div>

      {/* Alert */}
      {urgentTotal > 0 && (
        <AlertBanner
          type="critical"
          title={`${urgentTotal} conta${urgentTotal > 1 ? 's' : ''} precisam de ação imediata`}
          sub={`${overdue.length > 0 ? `${overdue.length} vencida${overdue.length > 1 ? 's' : ''} · ` : ''}${criticalCount > 0 ? `${criticalCount} dentro da janela de ${LAUNCH_DAYS} dias para lançar` : ''}`}
        />
      )}
      {urgentTotal === 0 && actionNeeded.length > 0 && (
        <AlertBanner
          type="warning"
          title={`${actionNeeded.length} conta${actionNeeded.length > 1 ? 's' : ''} se aproximam da janela de lançamento`}
          sub={`Lançar o pagamento com ${LAUNCH_DAYS} dias de antecedência para garantir o pagamento no vencimento.`}
        />
      )}

      {/* Action card */}
      {allUrgent.length > 0 && (
        <Card title="Ação necessária — lançar pagamento" style={{ borderColor: 'var(--danger)' }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--danger)', marginBottom: '1rem', marginTop: '-0.5rem' }}>Ação necessária — lançar pagamento</div>
          <div className="bill-list">
            {allUrgent.map(b => <BillRow key={b.id} bill={b} onToggle={handleToggle} onEdit={handleEdit} onDelete={handleDelete} onView={handleView}/>)}
          </div>
        </Card>
      )}

      {/* Upcoming */}
      <Card title="Próximas a vencer">
        {upcoming.length > 0
          ? <div className="bill-list">
              {upcoming.map(b => (
                <BillRow
                  key={b.id}
                  bill={b}
                  onToggle={handleToggle}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onView={handleEdit}
                />
              ))}
            </div>
          : <EmptyState icon="🗓" text="Sem contas próximas a vencer"/>
        }
      </Card>

      {/* Overdue */}
      <Card title="Vencidas">
        {overdue.length > 0
          ? <div className="bill-list">{overdue.sort((a, b) => a.due.localeCompare(b.due)).map(b => <BillRow key={b.id} bill={b} showActions={false}/>)}</div>
          : <EmptyState icon="✓" text="Nenhuma conta vencida"/>
        }
      </Card>

      <BillModal open={billModalOpen} onClose={() => { setBillModalOpen(false); setEditId(null); }} editId={editId} readOnly={isReadOnly}/>
      <PagarModal open={pagarModalOpen} onClose={() => { setPagarModalOpen(false); setPagarBillId(null); }} billId={pagarBillId}/>
      
      <ConfirmModal 
        isOpen={confirmCfg.isOpen}
        message={confirmCfg.message}
        onConfirm={confirmCfg.onConfirm}
        onCancel={() => setConfirmCfg(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
