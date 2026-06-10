"use client";
import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useRef,
  useMemo,
} from "react";
import { sb, isSupabaseConfigured, getUser } from "@/lib/supabase";

// ── REDUCER ───────────────────────────────────────────────────────────────────
function reducer(state, action) {
  if (action.type === "LOAD") {
    const data = action.payload.data || action.payload;
    return {
      ...state,
      ...data,
      loaded: true,
      isSyncing: false,
      dbOnline: true,
    };
  }

  const nextState = innerReducer(state, action);
  const isDataMutation =
    action.type.startsWith("ADD_") ||
    action.type.startsWith("UPDATE_") ||
    action.type.startsWith("DELETE_") ||
    action.type === "SET_LANCS" ||
    action.type === "SET_TVO_REGS";

  if (isDataMutation) {
    nextState.lastLocalEdit = Date.now();
  }
  return nextState;
}

function innerReducer(state, action) {
  switch (action.type) {
    case "SET_ONLINE":
      return { ...state, dbOnline: action.payload };
    case "SET":
      return { ...state, [action.key]: action.payload };
    case "ADD_BILL":
      return { ...state, bills: [...state.bills, action.payload] };
    case "UPDATE_BILL":
      return {
        ...state,
        bills: state.bills.map((b) =>
          b.id === action.payload.id ? action.payload : b,
        ),
      };
    case "DELETE_BILL":
      return {
        ...state,
        bills: state.bills.filter((b) => b.id !== action.payload),
      };
    case "ADD_TVO_BILL":
      return { ...state, tvoBills: [...state.tvoBills, action.payload] };
    case "UPDATE_TVO_BILL":
      return {
        ...state,
        tvoBills: state.tvoBills.map((b) =>
          b.id === action.payload.id ? action.payload : b,
        ),
      };
    case "DELETE_TVO_BILL":
      return {
        ...state,
        tvoBills: state.tvoBills.filter((b) => b.id !== action.payload),
      };
    case "ADD_LANC":
      return { ...state, lancamentos: [...state.lancamentos, action.payload] };
    case "UPDATE_LANC":
      return {
        ...state,
        lancamentos: state.lancamentos.map((l) =>
          l.id === action.payload.id ? action.payload : l,
        ),
      };
    case "DELETE_LANC":
      return {
        ...state,
        lancamentos: state.lancamentos.filter((l) => l.id !== action.payload),
      };
    case "DELETE_LANCS":
      return {
        ...state,
        lancamentos: state.lancamentos.filter((l) => !action.payload.has(l.id)),
      };
    case "SET_LANCS":
      return { ...state, lancamentos: action.payload };
    case "ADD_TVO_REG":
      return {
        ...state,
        tvoRegistros: [...state.tvoRegistros, action.payload],
      };
    case "UPDATE_TVO_REG":
      return {
        ...state,
        tvoRegistros: state.tvoRegistros.map((r) =>
          r.id === action.payload.id ? action.payload : r,
        ),
      };
    case "DELETE_TVO_REG":
      return {
        ...state,
        tvoRegistros: state.tvoRegistros.filter((r) => r.id !== action.payload),
      };
    case "DELETE_TVO_REGS":
      return {
        ...state,
        tvoRegistros: state.tvoRegistros.filter(
          (r) => !action.payload.has(r.id),
        ),
      };
    case "SET_TVO_REGS":
      return { ...state, tvoRegistros: action.payload };
    case "ADD_BASE":
      return { ...state, bases: [...state.bases, action.payload] };
    case "UPDATE_BASE":
      return {
        ...state,
        bases: state.bases.map((b) =>
          b.id === action.payload.id ? action.payload : b,
        ),
      };
    case "DELETE_BASE":
      return { ...state, bases: state.bases.filter((b) => b.id !== action.id) };
    case "DELETE_BASES":
      return {
        ...state,
        bases: state.bases.filter((b) => !action.payload.has(b.nome)),
      };
    case "SET_BASES":
      return { ...state, bases: action.payload };
    case "ADD_CAT":
      return { ...state, cats: [...state.cats, action.payload] };
    case "REMOVE_CAT":
      return { ...state, cats: state.cats.filter((n) => n !== action.name) };
    case "ADD_GESTOR":
      return { ...state, gestores: [...state.gestores, action.payload] };
    case "REMOVE_GESTOR":
      return {
        ...state,
        gestores: state.gestores.filter((n) => n !== action.name),
      };
    case "ADD_FORNECEDOR":
      return {
        ...state,
        fornecedores: [...state.fornecedores, action.payload],
      };
    case "REMOVE_FORNECEDOR":
      return {
        ...state,
        fornecedores: state.fornecedores.filter(
          (f) => f.name !== action.payload,
        ),
      };
    case "SET_FORNECEDORES":
      return { ...state, fornecedores: action.payload };
    case "SET_SUPPLIER_LOADING":
      return { ...state, loadingSuppliers: action.payload };
    case "SET_SUPPLIER_ERROR":
      return { ...state, supplierError: action.payload };
    case "SET_RECURRING_PAYMENTS":
      return { ...state, recurringPayments: action.payload };
    case "ADD_RECURRING_PAYMENT":
      return {
        ...state,
        recurringPayments: [action.payload, ...state.recurringPayments],
      };
    case "UPDATE_RECURRING_PAYMENT":
      return {
        ...state,
        recurringPayments: state.recurringPayments.map((p) =>
          p.id === action.payload.id ? action.payload : p,
        ),
      };
    case "DELETE_RECURRING_PAYMENT":
      return {
        ...state,
        recurringPayments: state.recurringPayments.filter(
          (p) => p.id !== action.payload,
        ),
      };
    case "TOGGLE_RECURRING_PAYMENT":
      return {
        ...state,
        recurringPayments: state.recurringPayments.map((p) =>
          p.id === action.payload.id
            ? { ...p, active: action.payload.active }
            : p,
        ),
      };
    case "SET_RECURRING_LOADING":
      return { ...state, loadingRecurring: action.payload };
    case "SET_RECURRING_ERROR":
      return { ...state, recurringError: action.payload };
    case "ADD_CAT_DESPESA":
      return { ...state, catDespesas: [...state.catDespesas, action.payload] };
    case "REMOVE_CAT_DESPESA":
      return {
        ...state,
        catDespesas: state.catDespesas.filter((n) => n !== action.name),
      };
    case "UPSERT_ORCAMENTO": {
      const { base, cat, month, value } = action.payload;
      const existing = state.orcamentos.findIndex(
        (o) => o.base === base && o.cat === cat && o.month === month,
      );
      const newOrcs = [...state.orcamentos];
      if (existing >= 0) newOrcs[existing] = { base, cat, month, value };
      else newOrcs.push({ base, cat, month, value });
      return { ...state, orcamentos: newOrcs };
    }
    case "DELETE_ORCAMENTO":
      return {
        ...state,
        orcamentos: state.orcamentos.filter(
          (o) =>
            !(
              o.base === action.base &&
              o.cat === action.cat &&
              o.month === action.month
            ),
        ),
      };
    case "IMPORT_ALL":
      return {
        ...state,
        bills: action.payload.bills || state.bills,
        tvoBills: action.payload.tvoBills || state.tvoBills,
        lancamentos: action.payload.lancamentos || state.lancamentos,
        tvoRegistros: action.payload.tvoRegistros || state.tvoRegistros,
        bases: action.payload.bases || state.bases,
        cats: action.payload.cats || state.cats,
        catDespesas: action.payload.catDespesas || state.catDespesas,
        gestores: action.payload.gestores || state.gestores,
        fornecedores: action.payload.fornecedores || state.fornecedores,
        orcamentos: action.payload.orcamentos || state.orcamentos,
      };
    case "CLEAR_BILLS":
      return { ...state, bills: [] };
    case "RESET_DATA":
      return {
        ...INITIAL,
        loaded: false,
        dbOnline: false,
        lastLocalEdit: null,
      };
    default:
      return state;
  }
}

const INITIAL = {
  bills: [],
  tvoBills: [],
  lancamentos: [],
  tvoRegistros: [],
  bases: [],
  cats: [],
  catDespesas: [],
  gestores: [],
  orcamentos: [],
  fornecedores: [],
  loadingSuppliers: false,
  supplierError: null,
  recurringPayments: [],
  loadingRecurring: false,
  recurringError: null,
};

// ── CONTEXT ───────────────────────────────────────────────────────────────────
export const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, INITIAL);
  const syncTimer = useRef(null);
  const isSyncing = useRef(false);
  const currentUid = useRef(null);

  // 1. ADICIONE ESTA REF (Guarda o estado atualizado sem disparar re-render no timer)
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // ── Carrega dados do Supabase para o usuário logado ───────────────────────
  async function loadForUser(uid) {
    const previousUid = currentUid.current;
    currentUid.current = uid;

    if (previousUid && previousUid !== uid) {
      dispatch({ type: "RESET_DATA" });
    }

    if (!uid || !isSupabaseConfigured()) {
      dispatch({ type: "RESET_DATA" });
      dispatch({ type: "SET", key: "loaded", payload: true });
      return;
    }

    await loadRemote(dispatch);
  }

  // ── Escuta mudanças de sessão (PRIMEIRO useEffect - MANTÉM IGUAL) ───────────
  useEffect(() => {
    if (!isSupabaseConfigured() || !sb) {
      dispatch({ type: "SET", key: "loaded", payload: true });
      return;
    }

    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await loadForUser(session.user.id);
      } else {
        dispatch({ type: "RESET_DATA" });
        dispatch({ type: "SET", key: "loaded", payload: true });
      }
    });

    return () => subscription?.unsubscribe?.();
  }, []);

  // ── Sincronização periódica (SEGUNDO useEffect - SUBSTITUA POR ESTE) ──────
  useEffect(() => {
    if (!state.loaded || !currentUid.current) return;

    const doSync = async () => {
      // Usa stateRef.current para ler os dados mais novos sem reiniciar o setInterval
      await doSyncIfReady(
        stateRef.current,
        dispatch,
        currentUid.current,
        isSyncing,
      );
    };

    syncTimer.current = setInterval(doSync, 5000);
    return () => clearInterval(syncTimer.current);
  }, [state.loaded]); // Só reinicia o timer se o status de carregamento mudar

  return (
    <AppContext.Provider
      value={{
        state,
        dispatch,
        fetchBillAttachments,
        fetchLancamentoAttachments,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
};

export const useAppSelector = (selectorFn) => {
  const { state } = useApp();
  return useMemo(() => selectorFn(state), [state, selectorFn]);
};

// ── API ATTACHMENTS ──────────────────────────────────────────────────────────
async function fetchBillAttachments(billId) {
  if (!sb) return [];
  try {
    const { data, error } = await sb.storage.from("bills").list(`${billId}`);
    if (error) throw error;
    return data?.map((f) => ({ name: f.name, size: f.metadata?.size })) || [];
  } catch (e) {
    console.error("Erro ao buscar anexos de bill:", e);
    return [];
  }
}

async function fetchLancamentoAttachments(lancId) {
  if (!sb) return [];
  try {
    const { data, error } = await sb.storage
      .from("lancamentos")
      .list(`${lancId}`);
    if (error) throw error;
    return data?.map((f) => ({ name: f.name, size: f.metadata?.size })) || [];
  } catch (e) {
    console.error("Erro ao buscar anexos de lançamento:", e);
    return [];
  }
}

// ── REMOTE LOAD ──────────────────────────────────────────────────────────────
async function loadRemote(dispatch) {
  if (!sb) return;
  try {
    const user = await getUser();
    if (!user) {
      dispatch({ type: "SET", key: "loaded", payload: true });
      return;
    }

    const [
      billsRes,
      lancRes,
      baseRes,
      catRes,
      gestRes,
      despRes,
      tvoRegRes,
      tvoRes,
      orcRes,
      supplierRes,
      recurringRes,
    ] = await Promise.all([
      sb.from("bills").select("*").eq("user_id", user.id),
      sb.from("lancamentos").select("*").eq("user_id", user.id),
      sb.from("bases").select("*").eq("user_id", user.id),
      sb.from("categories").select("name").eq("user_id", user.id),
      sb.from("gestores").select("name").eq("user_id", user.id),
      sb.from("cat_despesas").select("name").eq("user_id", user.id),
      sb.from("tvo_registros").select("*").eq("user_id", user.id),
      sb.from("tvo_bills").select("*").eq("user_id", user.id),
      sb.from("orcamentos").select("*").eq("user_id", user.id),
      sb.from("suppliers").select("*").eq("user_id", user.id),
      sb.from("recurring_payments").select("*").eq("user_id", user.id),
    ]);

    const bills = billsRes.data?.map(mapBillFromDb) || [];
    const lancs = lancRes.data?.map(mapLancFromDb) || [];
    const bases = baseRes.data?.map(mapBaseFromDb) || [];
    const cats = catRes.data?.map((r) => r.name) || [];
    const gestores = gestRes.data?.map((r) => r.name) || [];
    const despesas = despRes.data?.map((r) => r.name) || [];
    const tvoRegs = tvoRegRes.data?.map(mapTvoRegFromDb) || [];
    const tvoBills = tvoRes.data?.map(mapTvoBillFromDb) || [];
    const orcs = orcRes.data || [];
    const suppliers = supplierRes.data || [];
    const recurring = recurringRes.data || [];

    dispatch({
      type: "LOAD",
      payload: {
        bills,
        lancamentos: lancs,
        bases,
        cats,
        catDespesas: despesas,
        gestores,
        tvoRegistros: tvoRegs,
        tvoBills,
        orcamentos: orcs,
        fornecedores: suppliers,
        recurringPayments: recurring,
      },
    });
  } catch (e) {
    console.error("Erro ao carregar dados remotos:", e);
    dispatch({ type: "SET", key: "syncError", payload: e.message });
    dispatch({ type: "SET", key: "loaded", payload: true });
  }
}

// ── DB MAPPERS ────────────────────────────────────────────────────────────────
const mapBillToDb = (b, uid) => ({
  id: b.id,
  user_id: uid,
  supplier: b.supplier,
  value: b.value,
  emission: b.emission || null,
  due: b.due,
  status: b.status,
  base: b.base,
  cat: b.cat,
  nfnum: b.nfnum || "",
  nfserie: b.nfserie || "",
  fluig: b.fluig || "",
  fluig_value: b.fluigVal,
  obs: b.obs || "",
  rateio: b.rateio || [],
  tvo: b.tvo,
  conting: b.conting,
  attachments: b.attachments || [],
});

const mapBillFromDb = (r) => ({
  id: r.id,
  supplier: r.supplier,
  value: r.value,
  emission: r.emission,
  due: r.due,
  status: r.status,
  base: r.base,
  cat: r.cat,
  nfnum: r.nfnum,
  nfserie: r.nfserie,
  fluig: r.fluig,
  fluigVal: r.fluig_value,
  obs: r.obs,
  rateio: r.rateio || [],
  tvo: r.tvo,
  conting: r.conting,
  attachments: r.attachments || [],
});

const mapTvoBillToDb = (b, uid) => ({
  id: b.id,
  user_id: uid,
  supplier: b.supplier,
  value: b.value,
  emission: b.emission || null,
  due: b.due,
  status: b.status || "pending",
  base: b.base,
  cat: b.cat,
  nfnum: b.nfnum || "",
  nfserie: b.nfserie || "",
  fluig: b.fluig || "",
  tvo_stage: b.tvoStage || "pending",
  rateio: b.rateio || [],
  tvo: b.tvo,
  conting: b.conting,
  attachments: b.attachments || [],
});

const mapTvoBillFromDb = (r) => ({
  id: r.id,
  supplier: r.supplier,
  value: r.value,
  emission: r.emission,
  due: r.due,
  status: r.status,
  base: r.base,
  cat: r.cat,
  nfnum: r.nfnum,
  nfserie: r.nfserie,
  fluig: r.fluig,
  tvoStage: r.tvo_stage,
  rateio: r.rateio || [],
  tvo: r.tvo,
  conting: r.conting,
  attachments: r.attachments || [],
});

const mapLancToDb = (l, uid) => ({
  id: l.id,
  user_id: uid,
  origin_bill_id: l.originBillId || null,
  gestor: l.gestor || "",
  solnum: l.solnum || "",
  soldate: l.soldate || null,
  supplier: l.supplier,
  nf: l.nf || "",
  emission: l.emission || null,
  due: l.due || null,
  descr: l.desc || "",
  cat: l.cat || "",
  value: l.value,
  tipopgto: l.tipopgto || "",
  ccpgto: l.ccpgto || "",
  obs: l.obs || "",
  rateio: l.rateio || [],
  tvo: l.tvo,
  conting: l.conting,
  attachments: l.attachments || [],
  origem_pagamento: l.origemPagamento || false,
});

const mapLancFromDb = (r) => ({
  id: r.id,
  originBillId: r.origin_bill_id,
  gestor: r.gestor,
  solnum: r.solnum,
  soldate: r.soldate,
  supplier: r.supplier,
  nf: r.nf,
  emission: r.emission,
  due: r.due,
  desc: r.descr,
  cat: r.cat,
  value: r.value,
  tipopgto: r.tipopgto,
  ccpgto: r.ccpgto,
  obs: r.obs,
  rateio: r.rateio || [],
  tvo: r.tvo,
  conting: r.conting,
  attachments: r.attachments || [],
  origemPagamento: r.origem_pagamento,
});

const mapBaseToDb = (b, uid) => ({
  id: b.id,
  user_id: uid,
  nome: b.nome,
  gestor: b.gestor || "",
  data: b.data || null,
  mes: b.mes || "",
  desmobilizado: b.desmobilizado || false,
});

const mapBaseFromDb = (r) => ({
  id: r.id,
  nome: r.nome,
  gestor: r.gestor,
  data: r.data,
  mes: r.mes,
  desmobilizado: r.desmobilizado,
});

const mapTvoRegToDb = (r, uid) => ({
  id: r.id,
  user_id: uid,
  gestor: r.gestor || "",
  fluig: r.fluig || "",
  soldate: r.soldate || null,
  value: r.value,
  tipo: r.tipo || "TVO",
  produto: r.produto || "",
  cc: r.cc || "",
  origem: r.origem || "Manual",
  base: r.base || "",
  cat: r.cat || "",
  obs: r.obs || "",
});

const mapTvoRegFromDb = (r) => ({
  id: r.id,
  gestor: r.gestor,
  fluig: r.fluig,
  soldate: r.soldate,
  value: r.value,
  tipo: r.tipo,
  produto: r.produto,
  cc: r.cc,
  origem: r.origem,
  base: r.base ?? "",
  cat: r.cat ?? "",
  obs: r.obs ?? "",
});

async function doSyncIfReady(state, dispatch, uid, isSyncingRef) {
  const now = Date.now();
  if (
    isSyncingRef.current ||
    !state.lastLocalEdit ||
    now - state.lastLocalEdit < 1000
  )
    return;

  isSyncingRef.current = true;
  dispatch({ type: "SET", key: "isSyncing", payload: true });
  try {
    dispatch({ type: "SET", key: "dbOnline", payload: true });
  } catch (e) {
    console.error("Sync error:", e);
    dispatch({ type: "SET", key: "dbOnline", payload: false });
  } finally {
    dispatch({ type: "SET", key: "isSyncing", payload: false });
    isSyncingRef.current = false;
  }
}
