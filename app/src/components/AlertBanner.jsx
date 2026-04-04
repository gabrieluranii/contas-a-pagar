'use client';

export default function AlertBanner({ type = 'warning', title, sub }) {
  const styles = {
    critical: { bg: '#b45309', border: '#f59e0b', icon: '⚠' },
    warning:  { bg: '#b45309', border: '#f59e0b', icon: '⏰' },
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
      color: '#fffbeb', // Amber 50 for all text in the banner
    }}>
      <div style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{s.icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#fffbeb', marginBottom: 2 }}>{title}</div>
        {sub && <div style={{ fontSize: 13, color: '#fffbeb', opacity: 0.9 }}>{sub}</div>}
      </div>
    </div>
  );
}
