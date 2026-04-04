import pkg from '../../package.json';

// Versão lida automaticamente do package.json
// Basta rodar `npm run version:patch/minor/major` e o badge atualiza sozinho
export const APP_VERSION: string = pkg.version;
export const APP_NAME = "Contas a Pagar";
export const THEME = "Obsidian Ledger";
export const BUILD_DATE = new Date("2026-04-03");
export const ENVIRONMENT = (process.env.NODE_ENV ?? "production") as "development" | "production" | "test";

export function getVersionInfo() {
  return {
    version: APP_VERSION,
    tag: `v${APP_VERSION}`,
    name: APP_NAME,
    theme: THEME,
    buildDate: BUILD_DATE,
    buildDateFormatted: BUILD_DATE.toLocaleDateString("pt-BR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      timeZone: "America/Sao_Paulo",
    }),
    environment: ENVIRONMENT,
    isDev: ENVIRONMENT === "development",
  };
}

export default getVersionInfo;

