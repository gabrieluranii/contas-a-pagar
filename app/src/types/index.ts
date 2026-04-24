// app/src/types/index.ts

export type BillStatus = 'pending' | 'paid';

export type RateioItem = {
  base: string;
  cat: string;
  value: number;
};

export type Attachment = {
  filename: string;
  url?: string;
  data?: string; // base64 se aplicável
};

export type Bill = {
  id: string;
  supplier: string;
  value: number;
  emission: string | null;
  due: string;
  status: BillStatus;
  base: string;
  cat: string;
  nfnum: string;
  nfserie: string;
  fluig: string;
  fluigVal: number | null;
  obs: string;
  rateio: RateioItem[];
  tvo: unknown | null;
  conting: number | null;
  attachments: Attachment[];
};

export type Lancamento = {
  id: string;
  originBillId: string | null;
  gestor: string;
  solnum: string;
  soldate: string | null;
  supplier: string;
  nf: string;
  emission: string | null;
  due: string | null;
  desc: string;
  cat: string;
  value: number;
  tipopgto: string;
  ccpgto: string;
  obs: string;
  rateio: RateioItem[];
  tvo: unknown | null;
  conting: number | null;
  attachments: Attachment[];
  origemPagamento: boolean;
};

export type TvoStage = 'pending' | string;

export type TvoBill = Omit<Bill, 'fluigVal'> & {
  tvoStage: TvoStage;
};

export type TvoRegistro = {
  id: string;
  gestor: string;
  fluig: string;
  soldate: string | null;
  value: number;
  tipo: string;
  produto: string;
  cc: string;
  origem: string;
};

export type Base = {
  id: string;
  nome: string;
  gestor: string;
  data: string | null;
  mes: string;
  desmobilizado: boolean;
};

export type Orcamento = {
  base: string;
  cat: string;
  month: string;
  value: number;
};

// Pode ser tipado depois quando migrar AppContext
export type BillFormInput = Partial<Bill>;
export type LancamentoFormInput = Partial<Lancamento>;
export type PagamentoFormInput = {
  gestor?: string;
  fluig?: string;
  nf?: string;
  emission?: string;
};
