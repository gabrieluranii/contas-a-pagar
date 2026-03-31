'use client';

export default function AlertBanner({ type = 'warning', title, sub }) {
  const styles = {
    critical: { bg: 'var(--danger-light)', border: '#4a2020', icon: '⚠' },
    warning:  { bg: 'var(--warning-light)', border: '#4a3810', icon: '⏰' },
  };
  const s = styles[type] || styles.warning;
  return (
    <div style={{
      borderRadius: 'var(--radius-lg)',
      padding: '1rem 1.25rem',
      marginBottom: '1.5rem',
      display: 'flex',
      alignItems: 'flex-start',
      gap: 12,
      background: s.bg,
      border: `1px solid ${s.border}`,
    }}>
      <div style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{s.icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', marginBottom: 2 }}>{title}</div>
        {sub && <div style={{ fontSize: 13, color: 'var(--text2)' }}>{sub}</div>}
      </div>
    </div>
  );
}
