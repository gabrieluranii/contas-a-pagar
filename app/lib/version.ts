/**
 * version.ts
 * ──────────────────────────────────────────────────────────────
 * Fonte única de verdade para metadados de versão do aplicativo.
 * Importe este módulo para exibir versão, tema e data de build
 * em qualquer componente ou página.
 *
 * Uso:
 *   import { APP_VERSION, getVersionInfo } from "@/lib/version";
 * ──────────────────────────────────────────────────────────────
 */

// ─── Constantes de versão ────────────────────────────────────

/** Versão semântica atual do aplicativo (SemVer). */
export const APP_VERSION = "1.0.0" as const;

/** Nome público do aplicativo. */
export const APP_NAME = "Contas a Pagar" as const;

/** Tema visual ativo. */
export const THEME = "Obsidian Ledger" as const;

/** Data oficial de lançamento desta versão. */
export const BUILD_DATE = new Date("2026-03-31") as const;

// ─── Utilitários ─────────────────────────────────────────────

/** Ambiente de execução atual. */
export const ENVIRONMENT =
  (process.env.NODE_ENV as "development" | "production" | "test") ??
  "production";

/** Prefixo de versão para exibição (ex: "v1.0.0"). */
export const VERSION_TAG = `v${APP_VERSION}` as const;

// ─── Tipo do objeto de informação de versão ──────────────────

export interface VersionInfo {
  /** Versão semântica, ex: "1.0.0" */
  version: string;
  /** Tag de versão, ex: "v1.0.0" */
  tag: string;
  /** Nome do aplicativo */
  name: string;
  /** Nome do tema visual */
  theme: string;
  /** Data de build como objeto Date */
  buildDate: Date;
  /** Data de build formatada para pt-BR */
  buildDateFormatted: string;
  /** Ambiente de execução */
  environment: "development" | "production" | "test";
  /** Indica se está em ambiente de desenvolvimento */
  isDev: boolean;
}

// ─── Função principal ─────────────────────────────────────────

/**
 * Retorna um objeto com todas as informações de versão do app.
 *
 * @example
 * const info = getVersionInfo();
 * console.log(info.tag);              // "v1.0.0"
 * console.log(info.buildDateFormatted); // "31/03/2026"
 */
export function getVersionInfo(): VersionInfo {
  return {
    version: APP_VERSION,
    tag: VERSION_TAG,
    name: APP_NAME,
    theme: THEME,
    buildDate: BUILD_DATE,
    buildDateFormatted: BUILD_DATE.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "America/Sao_Paulo",
    }),
    environment: ENVIRONMENT,
    isDev: ENVIRONMENT === "development",
  };
}

// ─── Export padrão (conveniente para import simples) ─────────

export default getVersionInfo;
