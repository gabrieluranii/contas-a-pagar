'use client';
import { fmt, fmtDate, isOverdue, daysUntil, urgencyStatus, urgencyPillText, billIcon, urgencyClass } from '@/lib/utils';

function Pill({ children, cls }) {
  return (
    <span className={`pill ${cls || ''}`} style={{
      fontSize: 11, padding: '2px 7px', borderRadius: 20, fontWeight: 500, whiteSpace: 'nowrap',
    }}>
      {children}
    </span>
  );
}

export default function BillRow({ bill: b, showActions = true, onToggle, onEdit, onDelete, onView }) {
  const over = isOverdue(b.due, b.status);
  const days = daysUntil(b.due);

  let dueTxt = `Venc. ${fmtDate(b.due)}`;
  if (over) dueTxt = `Venceu há ${Math.abs(days)} dia${Math.abs(days) !== 1 ? 's' : ''}`;
  else if (b.status === 'pending' && days === 0) dueTxt = 'Vence hoje';
  else if (b.status === 'pending' && days === 1) dueTxt = 'Vence amanhã';
  else if (b.status === 'pending' && days <= 7) dueTxt = `Vence em ${days} dias`;

  const uPill = urgencyPillText(b);
  const uCls = urgencyClass(b);
  const statusCls = b.status === 'paid' ? 'badge-paid' : over ? 'badge-overdue' : 'badge-pending';
  const statusLabel = b.status === 'paid' ? 'Pago' : over ? 'Vencida' : 'Pendente';

  const iconBg = b.status === 'paid' ? 'var(--accent-light)' : over ? 'var(--danger-light)' : 'var(--surface2)';

  return (
    <div
      className={`bill-row ${uCls}`}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '13px 0', borderBottom: '1px solid var(--border)',
        animation: 'fadeIn 0.2s ease',
      }}
    >
      {/* Icon */}
      <div style={{
        width: 36, height: 36, borderRadius: 9, background: iconBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 15, flexShrink: 0,
      }}>
        {billIcon(b)}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {b.supplier}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 3, display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ color: over ? 'var(--danger)' : 'var(--text3)' }}>{dueTxt}</span>
          {b.emission && <span style={{ fontSize: 11, color: 'var(--text3)' }}>Emissão: {fmtDate(b.emission)}</span>}
          {(b.nfnum || b.nfserie) && <span style={{ fontSize: 11, color: 'var(--text3)' }}>NF {b.nfnum || ''}{b.nfserie ? ' · Série ' + b.nfserie : ''}</span>}
          {uPill && <Pill cls={`pill-${uPill.type}`}>{uPill.label}</Pill>}
          {b.base && <Pill cls="pill-base">{b.base}</Pill>}
          {b.cat  && <Pill cls="pill-cat">{b.cat}</Pill>}
          {b.rateio?.length > 0 && <Pill cls="pill-rateio">Rateio {b.rateio.length}x</Pill>}
          {b.tvo != null && <Pill cls="pill-tvo">TVO {fmt(b.tvo)}</Pill>}
          {b.conting != null && <Pill cls="pill-conting">Conting. {fmt(b.conting)}</Pill>}
        </div>
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <span className={`badge ${statusCls}`} style={{ fontSize: 11, fontWeight: 500, padding: '3px 9px', borderRadius: 20, whiteSpace: 'nowrap' }}>
          {statusLabel}
        </span>
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 17, color: 'var(--text)', whiteSpace: 'nowrap' }}>
          {fmt(b.value)}
        </div>
      </div>

      {/* Actions */}
      {showActions && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={(e) => { e.stopPropagation(); onToggle?.(b.id); }}
              style={{ padding: '5px 11px', fontSize: 12, background: 'transparent', color: 'var(--text2)', border: '1px solid var(--border2)', borderRadius: 'var(--radius)', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}
            >
              {b.status === 'paid' ? 'Desfazer' : 'Marcar pago'}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onView?.(b.id); }}
              title="Visualizar"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 5, color: 'var(--text2)' }}
            >
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onEdit?.(b.id); }}
              title="Editar"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 5, color: 'var(--nav-orange)' }}
            >
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete?.(b.id); }}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontSize: 12, padding: '5px 8px', borderRadius: 'var(--radius)', fontFamily: 'inherit', transition: 'all 0.15s' }}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
