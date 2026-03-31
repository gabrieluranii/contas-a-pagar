"use client";

/**
 * VersionBadge.tsx
 * ──────────────────────────────────────────────────────────────
 * Componente visual para exibir metadados de versão do app.
 * Adequado para footer, sidebar ou tela "Sobre".
 *
 * Props:
 *   compact  — exibe apenas a tag de versão (padrão: false)
 *   className — classes Tailwind adicionais ao container
 *
 * Uso:
 *   <VersionBadge />
 *   <VersionBadge compact />
 *   <VersionBadge className="mt-4" />
 * ──────────────────────────────────────────────────────────────
 */

import { getVersionInfo } from "@/lib/version";

// ─── Props ────────────────────────────────────────────────────

interface VersionBadgeProps {
  /** Modo compacto: exibe só a tag "v1.0.0" */
  compact?: boolean;
  /** Classes Tailwind adicionais */
  className?: string;
}

// ─── Sub-componente: dot de ambiente ─────────────────────────

function EnvIndicator({ isDev }: { isDev: boolean }) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest",
        isDev
          ? "bg-amber-100 text-amber-700 ring-1 ring-amber-300"
          : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
      ].join(" ")}
      title={isDev ? "Ambiente de desenvolvimento" : "Ambiente de produção"}
    >
      <span
        className={[
          "h-1.5 w-1.5 rounded-full",
          isDev ? "bg-amber-500" : "bg-emerald-500 animate-pulse",
        ].join(" ")}
      />
      {isDev ? "dev" : "prod"}
    </span>
  );
}

// ─── Componente principal ────────────────────────────────────

export default function VersionBadge({
  compact = false,
  className = "",
}: VersionBadgeProps) {
  const info = getVersionInfo();

  /* ── Modo compacto ─────────────────────────────────────── */
  if (compact) {
    return (
      <span
        className={[
          "inline-flex items-center gap-1.5 rounded-md border border-[#2d5a3d]/20",
          "bg-[#f5f3ee] px-2 py-0.5 font-mono text-xs text-[#2d5a3d]",
          className,
        ].join(" ")}
        title={`${info.name} ${info.tag} — ${info.theme}`}
      >
        {info.tag}
      </span>
    );
  }

  /* ── Modo completo ─────────────────────────────────────── */
  return (
    <div
      className={[
        "inline-flex flex-col gap-2 rounded-xl border border-[#2d5a3d]/15",
        "bg-[#f5f3ee] p-3 shadow-sm",
        className,
      ].join(" ")}
      role="contentinfo"
      aria-label="Informações de versão do aplicativo"
    >
      {/* Linha 1: nome + tag de versão */}
      <div className="flex items-center gap-2">
        {/* Ícone decorativo */}
        <span
          className="flex h-6 w-6 items-center justify-center rounded-md bg-[#2d5a3d] text-white text-[11px] font-bold select-none"
          aria-hidden="true"
        >
          CA
        </span>

        <span className="text-sm font-semibold text-[#2d5a3d] leading-none">
          {info.name}
        </span>

        <span className="font-mono text-xs font-bold text-[#2d5a3d]/80 bg-[#2d5a3d]/10 rounded px-1.5 py-0.5">
          {info.tag}
        </span>

        <EnvIndicator isDev={info.isDev} />
      </div>

      {/* Divisor */}
      <div className="h-px bg-[#2d5a3d]/10" />

      {/* Linha 2: tema + data */}
      <div className="flex items-center justify-between gap-4 text-[11px] text-[#2d5a3d]/60">
        <span className="flex items-center gap-1">
          {/* Ícone de tema */}
          <svg
            className="h-3 w-3 opacity-60"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
          </svg>
          <span className="font-medium">{info.theme}</span>
        </span>

        <span className="flex items-center gap-1">
          {/* Ícone de calendário */}
          <svg
            className="h-3 w-3 opacity-60"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span>{info.buildDateFormatted}</span>
        </span>
      </div>
    </div>
  );
}
