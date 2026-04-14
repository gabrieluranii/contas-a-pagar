'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { urgencyStatus } from '@/lib/utils';
import { APP_VERSION } from '@/lib/version';
import { sb, isSupabaseConfigured } from '@/lib/supabase';

// ── TOKENS ────────────────────────────────────────────────────────────────────
const NAV = {
  bg:       '#111111',
  activeBg: '#1a1a1a',
  accent:   '#d97757',
  text:     '#f0f0f0',
  textSec:  '#666666',
  subText:  '#888888',
  border:   '#1e1e1e',
  w:        56,
  wOpen:    224,
};

const FONT_URL = "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap";

// ── SVG ICONS (24×24 Lucide-style) ───────────────────────────────────────────
const Icon = ({ d, children, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={NAV.accent} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
    style={{ flexShrink: 0 }}>
    {d ? <path d={d}/> : children}
  </svg>
);

const HomeIcon = () => <Icon><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></Icon>;
const CalIcon  = () => <Icon><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></Icon>;
const CardIcon = () => <Icon><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></Icon>;
const ZapIcon  = () => <Icon d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>;
const ShieldIcon=() => <Icon d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>;
const DbIcon   = () => <Icon><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></Icon>;
const DashIcon = () => <Icon><rect x="3" y="12" width="4" height="9"/><rect x="10" y="7" width="4" height="14"/><rect x="17" y="3" width="4" height="18"/></Icon>;
const EmailIcon = () => <Icon><rect x="2" y="4" width="20" height="16" rx="2" ry="2"/><path d="m22 6-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 6"/></Icon>;
const GearIcon = () => <Icon><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></Icon>;

const ChevronDown = ({ open }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
    stroke={NAV.textSec} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease', marginLeft: 'auto' }}>
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

// ── NavItem (link simples) ────────────────────────────────────────────────────
function NavItem({ href, icon, label, expanded, badge }) {
  const pathname = usePathname();
  const active   = pathname === href || (href !== '/' && pathname.startsWith(href));
  const [hov, setHov] = useState(false);

  return (
    <Link href={href}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        height: 42,
        gap: 12,
        paddingLeft: 16,
        paddingRight: expanded ? 14 : 0,
        borderLeft: active ? `3px solid ${NAV.accent}` : '3px solid transparent',
        background: (active || hov) ? NAV.activeBg : 'transparent',
        textDecoration: 'none',
        transition: 'background 0.15s, border-color 0.15s',
        cursor: 'pointer',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ width: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </span>
      {expanded && (
        <>
          <span style={{
            fontFamily: 'Poppins, sans-serif',
            fontSize: 11,
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '1px',
            color: (active || hov) ? NAV.accent : NAV.text,
            transition: 'color 0.15s',
            flex: 1,
          }}>
            {label}
          </span>
          {badge > 0 && (
            <span style={{
              background: NAV.accent,
              color: '#fff',
              fontSize: 10,
              fontWeight: 600,
              borderRadius: 10,
              padding: '1px 6px',
              minWidth: 18,
              textAlign: 'center',
              fontFamily: 'Inter, sans-serif',
            }}>
              {badge}
            </span>
          )}
        </>
      )}
    </Link>
  );
}

// ── NavGroup (com submenu) ────────────────────────────────────────────────────
// isOpen e onToggle vêm do pai (Navbar), garantindo um único grupo aberto por vez
function NavGroup({ icon, label, children, expanded, isOpen, onToggle }) {
  const [hov, setHov] = useState(false);

  const handleClick = () => {
    if (!expanded) return;
    onToggle();
  };

  return (
    <div>
      <button
        onClick={handleClick}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          display: 'flex',
          alignItems: 'center',
          height: 42,
          gap: 12,
          paddingLeft: 16,
          paddingRight: expanded ? 14 : 0,
          width: '100%',
          border: 'none',
          borderLeft: '3px solid transparent',
          background: hov ? NAV.activeBg : 'transparent',
          cursor: 'pointer',
          transition: 'background 0.15s',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ width: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {icon}
        </span>
        {expanded && (
          <>
            <span style={{
              fontFamily: 'Poppins, sans-serif',
              fontSize: 11,
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              color: hov ? NAV.accent : NAV.text,
              transition: 'color 0.15s',
              flex: 1,
              textAlign: 'left',
            }}>
              {label}
            </span>
            <ChevronDown open={isOpen}/>
          </>
        )}
      </button>

      {isOpen && expanded && (
        <div style={{ background: '#0d0d0d' }}>
          {children}
        </div>
      )}
    </div>
  );
}

// ── SubItem ───────────────────────────────────────────────────────────────────
function SubItem({ href, label }) {
  const pathname = usePathname();
  const active   = pathname === href;
  const [hov, setHov] = useState(false);

  return (
    <Link href={href}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        height: 36,
        paddingLeft: 52,
        textDecoration: 'none',
        background: (active || hov) ? NAV.activeBg : 'transparent',
        transition: 'background 0.15s',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
      }}
    >
      {/* dot */}
      <span style={{
        width: 4,
        height: 4,
        borderRadius: '50%',
        background: (active || hov) ? NAV.accent : NAV.textSec,
        marginRight: 10,
        flexShrink: 0,
        transition: 'background 0.15s',
      }}/>
      <span style={{
        fontFamily: 'Poppins, sans-serif',
        fontSize: 11,
        fontWeight: 400,
        color: (active || hov) ? NAV.accent : NAV.subText,
        transition: 'color 0.15s',
      }}>
        {label}
      </span>
    </Link>
  );
}

// ── Divider ───────────────────────────────────────────────────────────────────
const Div = () => <div style={{ height: 1, background: NAV.border, margin: '3px 0' }}/>;

// ── MAIN NAVBAR ───────────────────────────────────────────────────────────────
export default function Navbar() {
  const { state } = useApp();
  const pathname  = usePathname();
  const [expanded, setExpanded] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    sb.auth.getSession().then(({ data: { session } }) => {
      setUserEmail(session?.user?.email || '');
    });
    const { data: { subscription } } = sb.auth.onAuthStateChange((_e, session) => {
      setUserEmail(session?.user?.email || '');
    });
    return () => subscription.unsubscribe();
  }, []);
  // Estado compartilhado: id do grupo aberto ou null
  const [openGroup, setOpenGroup] = useState(() => {
    if (pathname.startsWith('/cadastro') || pathname.startsWith('/cc')) return 'cadastro';
    if (pathname.startsWith('/config')) return 'config';
    return null;
  });

  const toggleGroup = (id) =>
    setOpenGroup(prev => (prev === id ? null : id));

  const pending = state.bills.filter(b => b.status === 'pending');
  const urgentCount = pending.filter(b => {
    const st = urgencyStatus(b);
    return st === 'critical' || st === 'overdue';
  }).length;

  const tvoPendingCount = (state.tvoBills || []).filter(b => b.tvoStage === 'pending').length;

  const navW = expanded ? NAV.wOpen : NAV.w;

  return (
    <>
      <style>{`@import url('${FONT_URL}');`}</style>

      <nav
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
        style={{
          width: navW,
          minHeight: '100vh',
          background: NAV.bg,
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: 0, left: 0, bottom: 0,
          overflow: 'hidden',
          transition: 'width 0.2s cubic-bezier(.4,0,.2,1)',
          zIndex: 50,
          borderRight: `1px solid ${NAV.border}`,
        }}
      >
        {/* ── HEADER ──────────────────────────────────────────────────── */}
        <div style={{
          height: 56,
          background: NAV.accent,
          display: 'flex',
          alignItems: 'center',
          flexShrink: 0,
          gap: 12,
          paddingLeft: 16,
          overflow: 'hidden',
        }}>
          {/* Hamburger icon */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="white" strokeWidth="2.2" strokeLinecap="round" style={{ flexShrink: 0 }}>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
          {expanded && (
            <span style={{
              fontFamily: 'Poppins, sans-serif',
              fontSize: 12,
              fontWeight: 700,
              color: '#ffffff',
              textTransform: 'uppercase',
              letterSpacing: '2px',
              whiteSpace: 'nowrap',
            }}>
              Menu
            </span>
          )}
        </div>

        {/* ── BODY ────────────────────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: expanded ? 'auto' : 'hidden', overflowX: 'hidden', padding: '6px 0', scrollbarWidth: 'none' }}>

          <Div/>
          <NavItem href="/"             icon={<HomeIcon/>}  label="Página Inicial"     expanded={expanded}/>
          <NavItem href="/calendario"   icon={<CalIcon/>}   label="Calendário"         expanded={expanded}/>
          <NavItem href="/dashboards"   icon={<DashIcon/>}  label="Dashboards"         expanded={expanded}/>
          <NavItem href="/email"        icon={<EmailIcon/>} label="Modo IA"            expanded={expanded}/>
          <Div/>
          <NavItem href="/contas"       icon={<CardIcon/>}  label="Pagamentos Pendentes" expanded={expanded} badge={urgentCount}/>
          <NavItem href="/lancamentos"  icon={<ZapIcon/>}   label="Lançamentos"        expanded={expanded}/>
          <NavItem href="/tvo"          icon={<ShieldIcon/>}label="TVO e Contingência" expanded={expanded} badge={tvoPendingCount}/>
          <Div/>
          <NavGroup
            icon={<DbIcon/>}
            label="Cadastro"
            expanded={expanded}
            isOpen={openGroup === 'cadastro'}
            onToggle={() => toggleGroup('cadastro')}
          >
            <SubItem href="/cc"                 label="Centro de Custo"/>
            <SubItem href="/cadastro/produto"   label="Produtos"/>
            <SubItem href="/cadastro/gestores"  label="Gestores"/>
          </NavGroup>
          <Div/>
          <NavGroup
            icon={<GearIcon/>}
            label="Configurações"
            expanded={expanded}
            isOpen={openGroup === 'config'}
            onToggle={() => toggleGroup('config')}
          >
            <SubItem href="/config/backup" label="Backup"/>
            <SubItem href="/config/api"    label="Chave API"/>
          </NavGroup>
          <Div/>

        </div>

        {/* ── FOOTER: status DB + versão ────────────────────────────────── */}
        <div style={{ padding: '10px 0', borderTop: `1px solid ${NAV.border}`, flexShrink: 0 }}>
          {expanded ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '0 14px 0 18px', fontFamily: 'Poppins, sans-serif', fontSize: 10, color: NAV.textSec }}>
              {userEmail && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 130 }} title={userEmail}>
                    {userEmail}
                  </span>
                  <button onClick={() => sb.auth.signOut()} style={{ background: 'none', border: 'none', color: NAV.accent, cursor: 'pointer', fontSize: 10, fontWeight: 600, padding: 0 }}>Sair</button>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span title={state.syncError || ''} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ 
                    color: state.syncError ? '#ef4444' : (state.dbOnline ? '#4caf82' : '#c97c3a'), 
                    fontWeight: 600,
                    opacity: state.isSyncing ? 0.5 : 1,
                    transition: 'opacity 0.3s'
                  }}>●</span>
                  <span>
                    {state.isSyncing ? 'Sincronizando...' : (state.syncError ? 'Erro no Sync' : (state.dbOnline ? 'Supabase' : 'Local'))}
                  </span>
                </span>
                <span style={{ opacity: 0.45, fontFamily: 'monospace', fontSize: 9.5, letterSpacing: '0.3px' }}>
                  v{APP_VERSION}
                </span>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center' }} title={state.syncError || (state.isSyncing ? 'Sincronizando...' : (state.dbOnline ? 'Supabase' : 'Local'))}>
              <span style={{ 
                color: state.syncError ? '#ef4444' : (state.dbOnline ? '#4caf82' : '#c97c3a'), 
                fontWeight: 600, 
                fontSize: 10,
                opacity: state.isSyncing ? 0.5 : 1,
                transition: 'opacity 0.3s'
              }}>●</span>
            </div>
          )}
        </div>

      </nav>

      {/* ── MOBILE BOTTOM NAV ───────────────────────────────────────────── */}
      <div className="mobile-nav" style={{ alignItems: 'center', justifyContent: 'space-around' }}>
        {[
          { href: '/',            icon: <HomeIcon/>,  label: 'Home' },
          { href: '/contas',      icon: <CardIcon/>,  label: 'Contas' },
          { href: '/lancamentos', icon: <ZapIcon/>,   label: 'Lance' },
          { href: '/tvo',         icon: <ShieldIcon/>,label: 'TVO' },
          { href: '/cc',          icon: <DbIcon/>,    label: 'CC' },
        ].map(({ href, icon, label }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <Link key={href} href={href} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              color: active ? NAV.accent : NAV.textSec,
              textDecoration: 'none', fontSize: 10, padding: '8px 12px',
              fontFamily: 'Poppins, sans-serif',
            }}>
              {icon}
              {label}
            </Link>
          );
        })}
      </div>
    </>
  );
}
