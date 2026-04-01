export default function NotFound() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      fontFamily: 'sans-serif',
      gap: '1rem',
    }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 600 }}>404</h1>
      <p style={{ color: '#666' }}>Página não encontrada</p>
      <a href="/" style={{ color: '#d97757', textDecoration: 'none' }}>← Voltar ao início</a>
    </div>
  );
}
