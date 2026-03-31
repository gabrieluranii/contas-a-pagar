'use client';
import { createContext, useContext, useReducer, useEffect, useRef, useCallback } from 'react';
import { sb, isSupabaseConfigured } from '@/lib/supabase';
import { INITIAL_STATE } from '@/data/mockData';

// ── LOCALSTORAGE KEYS ─────────────────────────────────────────────────────────
const LS = {
  bills:       '_bills',
  tvoBills:    '_tvo_bills',
  lancamentos: '_lancamentos',
  tvoRegistros:'_tvo_registros',
  bases:       '_cc',
  cats:        '_cats',
  catDespesas: '_cat_despesas',
  gestores:    '_gestores',
  orcamentos:  '_orcamentos',
};

// ── REDUCER ───────────────────────────────────────────────────────────────────
function reducer(state, action) {
  switch (action.type) {
    case 'LOAD':        return { ...state, ...action.payload, loaded: true };
    case 'SET_ONLINE':  return { ...state, dbOnline: action.payload };
    case 'SET':         return { ...state, [action.key]: action.payload };
    case 'ADD_BILL':
      return { ...state, bills: [...state.bills, action.payload] };
    case 'UPDATE_BILL':
      return { ...state, bills: state.bills.map(b => b.id === action.payload.id ? action.payload : b) };
    case 'DELETE_BILL':
      return { ...state, bills: state.bills.filter(b => b.id !== action.payload) };
    case 'ADD_TVO_BILL':
      return { ...state, tvoBills: [...state.tvoBills, action.payload] };
    case 'UPDATE_TVO_BILL':
      return { ...state, tvoBills: state.tvoBills.map(b => b.id === action.payload.id ? action.payload : b) };
    case 'DELETE_TVO_BILL':
      return { ...state, tvoBills: state.tvoBills.filter(b => b.id !== action.payload) };
    case 'ADD_LANC':
      return { ...state, lancamentos: [...state.lancamentos, action.payload] };
    case 'UPDATE_LANC':
      return { ...state, lancamentos: state.lancamentos.map(l => l.id === action.payload.id ? action.payload : l) };
    case 'DELETE_LANC':
      return { ...state, lancamentos: state.lancamentos.filter(l => l.id !== action.payload) };
    case 'DELETE_LANCS':
      return { ...state, lancamentos: state.lancamentos.filter(l => !action.payload.has(l.id)) };
    case 'SET_LANCS':
      return { ...state, lancamentos: action.payload };
    case 'ADD_TVO_REG':
      return { ...state, tvoRegistros: [...state.tvoRegistros, action.payload] };
    case 'UPDATE_TVO_REG':
      return { ...state, tvoRegistros: state.tvoRegistros.map(r => r.id === action.payload.id ? action.payload : r) };
    case 'DELETE_TVO_REG':
      return { ...state, tvoRegistros: state.tvoRegistros.filter(r => r.id !== action.payload) };
    case 'DELETE_TVO_REGS':
      return { ...state, tvoRegistros: state.tvoRegistros.filter(r => !action.payload.has(r.id)) };
    case 'SET_TVO_REGS':
      return { ...state, tvoRegistros: action.payload };
    case 'ADD_BASE':
      return { ...state, bases: [...state.bases, action.payload] };
    case 'UPDATE_BASE':
      return { ...state, bases: state.bases.map((b, i) => i === action.idx ? action.payload : b) };
    case 'DELETE_BASE':
      return { ...state, bases: state.bases.filter((_, i) => i !== action.idx) };
    case 'DELETE_BASES':
      return { ...state, bases: state.bases.filter(b => !action.payload.has(b.nome)) };
    case 'SET_BASES':
      return { ...state, bases: action.payload };
    case 'ADD_CAT':
      return { ...state, cats: [...state.cats, action.payload] };
    case 'REMOVE_CAT':
      return { ...state, cats: state.cats.filter((_, i) => i !== action.idx) };
    case 'ADD_GESTOR':
      return { ...state, gestores: [...state.gestores, action.payload] };
    case 'REMOVE_GESTOR':
      return { ...state, gestores: state.gestores.filter((_, i) => i !== action.idx) };
    case 'ADD_CAT_DESPESA':
      return { ...state, catDespesas: [...state.catDespesas, action.payload] };
    case 'REMOVE_CAT_DESPESA':
      return { ...state, catDespesas: state.catDespesas.filter((_, i) => i !== action.idx) };
    case 'UPSERT_ORCAMENTO': {
      const { base, cat, month, value } = action.payload;
      const existing = state.orcamentos.findIndex(o => o.base === base && o.cat === cat && o.month === month);
      const newOrcs = [...state.orcamentos];
      if (existing >= 0) newOrcs[existing] = { base, cat, month, value };
      else newOrcs.push({ base, cat, month, value });
      return { ...state, orcamentos: newOrcs };
    }
    case 'DELETE_ORCAMENTO':
      return { ...state, orcamentos: state.orcamentos.filter(o => !(o.base === action.base && o.cat === action.cat && o.month === action.month)) };
    case 'IMPORT_ALL':
      return {
        ...state,
        bills:        action.payload.bills        || state.bills,
        tvoBills:     action.payload.tvoBills      || state.tvoBills,
        lancamentos:  action.payload.lancamentos   || state.lancamentos,
        tvoRegistros: action.payload.tvoRegistros  || state.tvoRegistros,
        bases:        action.payload.bases         || state.bases,
        cats:         action.payload.cats          || state.cats,
        catDespesas:  action.payload.catDespesas   || state.catDespesas,
        gestores:     action.payload.gestores      || state.gestores,
        orcamentos:   action.payload.orcamentos    || state.orcamentos,
      };
    case 'CLEAR_BILLS':
      return { ...state, bills: [] };
    default:
      return state;
  }
}

const INITIAL = {
  bills: [], tvoBills: [], lancamentos: [], tvoRegistros: [],
  bases: [], cats: [], catDespesas: [], gestores: [], orcamentos: [],
  dbOnline: false, loaded: false,
};

// ── CONTEXT ───────────────────────────────────────────────────────────────────
const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, INITIAL);
  const syncTimer = useRef(null);

  // ── Load from localStorage ─────────────────────────────────────────────────
  useEffect(() => {
    const get = (key, def = []) => {
      try { return JSON.parse(localStorage.getItem(key)) || def; } catch { return def; }
    };
    dispatch({
      type: 'LOAD',
      payload: {
        bills:        get(LS.bills),
        tvoBills:     get(LS.tvoBills),
        lancamentos:  get(LS.lancamentos),
        tvoRegistros: get(LS.tvoRegistros),
        bases:        get(LS.bases),
        cats:         get(LS.cats),
        catDespesas:  get(LS.catDespesas),
        gestores:     get(LS.gestores),
        orcamentos:   get(LS.orcamentos),
      },
    });

    // Try Supabase
    if (isSupabaseConfigured()) {
      loadRemote(dispatch);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Save to localStorage whenever state changes ────────────────────────────
  useEffect(() => {
    if (!state.loaded) return;
    saveLocal(state);
    // Debounced Supabase sync
    if (state.dbOnline) {
      clearTimeout(syncTimer.current);
      syncTimer.current = setTimeout(() => syncToRemote(state, dispatch), 800);
    }
  }, [state]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};

// ── LOCALSTORAGE SAVE ─────────────────────────────────────────────────────────
function saveLocal(state) {
  try {
    localStorage.setItem(LS.bills,        JSON.stringify(state.bills));
    localStorage.setItem(LS.tvoBills,     JSON.stringify(state.tvoBills));
    localStorage.setItem(LS.lancamentos,  JSON.stringify(state.lancamentos));
    localStorage.setItem(LS.tvoRegistros, JSON.stringify(state.tvoRegistros));
    localStorage.setItem(LS.bases,        JSON.stringify(state.bases));
    localStorage.setItem(LS.cats,         JSON.stringify(state.cats));
    localStorage.setItem(LS.catDespesas,  JSON.stringify(state.catDespesas));
    localStorage.setItem(LS.gestores,     JSON.stringify(state.gestores));
    localStorage.setItem(LS.orcamentos,   JSON.stringify(state.orcamentos));
  } catch {}
}

// ── SUPABASE LOAD ─────────────────────────────────────────────────────────────
async function loadRemote(dispatch) {
  if (!sb) return;
  try {
    const [
      { data: bills }, { data: tvoBills }, { data: lancamentos },
      { data: tvoRegistros }, { data: bases }, { data: cats },
      { data: gestores }, { data: catDespesas }, { data: orcamentos },
    ] = await Promise.all([
      sb.from('bills').select('*'),
      sb.from('tvo_bills').select('*'),
      sb.from('lancamentos').select('*'),
      sb.from('tvo_registros').select('*'),
      sb.from('bases').select('*'),
      sb.from('categories').select('*'),
      sb.from('gestores').select('*'),
      sb.from('cat_despesas').select('*'),
      sb.from('orcamentos').select('*'),
    ]);

    dispatch({
      type: 'LOAD',
      payload: {
        bills:        (bills || []).map(mapBillFromDb),
        tvoBills:     (tvoBills || []).map(mapTvoBillFromDb),
        lancamentos:  (lancamentos || []).map(mapLancFromDb),
        tvoRegistros: (tvoRegistros || []).map(mapTvoRegFromDb),
        bases:        (bases || []).map(mapBaseFromDb),
        cats:         (cats || []).map(r => r.name),
        gestores:     (gestores || []).map(r => r.name),
        catDespesas:  (catDespesas || []).map(r => r.name),
        orcamentos:   (orcamentos || []).map(r => ({ base: r.base, cat: r.cat, month: r.month, value: r.value })),
        dbOnline: true,
      },
    });
    dispatch({ type: 'SET_ONLINE', payload: true });
  } catch (e) {
    console.warn('Supabase load failed, using localStorage:', e.message);
    dispatch({ type: 'SET_ONLINE', payload: false });
  }
}

// ── SUPABASE SYNC ─────────────────────────────────────────────────────────────
async function syncToRemote(state, dispatch) {
  if (!sb) return;
  try {
    const ops = [
      sb.from('bills').delete().neq('id', 0).then(() =>
        state.bills.length ? sb.from('bills').insert(state.bills.map(mapBillToDb)) : Promise.resolve()
      ),
      sb.from('bases').delete().neq('id', 0).then(() =>
        state.bases.length ? sb.from('bases').insert(state.bases.map(mapBaseToDb)) : Promise.resolve()
      ),
      sb.from('categories').delete().neq('id', 0).then(() =>
        state.cats.length ? sb.from('categories').insert(state.cats.map(n => ({ name: n }))) : Promise.resolve()
      ),
      sb.from('gestores').delete().neq('id', 0).then(() =>
        state.gestores.length ? sb.from('gestores').insert(state.gestores.map(n => ({ name: n }))) : Promise.resolve()
      ),
      sb.from('cat_despesas').delete().neq('id', 0).then(() =>
        state.catDespesas.length ? sb.from('cat_despesas').insert(state.catDespesas.map(n => ({ name: n }))) : Promise.resolve()
      ),
      sb.from('orcamentos').delete().neq('id', 0).then(() =>
        state.orcamentos.length ? sb.from('orcamentos').insert(state.orcamentos.map(o => ({ base: o.base, cat: o.cat, month: o.month, value: o.value }))) : Promise.resolve()
      ),
      sb.from('tvo_bills').delete().neq('id', 0).then(() =>
        state.tvoBills.length ? sb.from('tvo_bills').insert(state.tvoBills.map(mapTvoBillToDb)) : Promise.resolve()
      ),
      sb.from('lancamentos').delete().neq('id', 0).then(() =>
        state.lancamentos.length ? sb.from('lancamentos').insert(state.lancamentos.map(mapLancToDb)) : Promise.resolve()
      ),
      sb.from('tvo_registros').delete().neq('id', 0).then(() =>
        state.tvoRegistros.length ? sb.from('tvo_registros').insert(state.tvoRegistros.map(mapTvoRegToDb)) : Promise.resolve()
      ),
    ];
    await Promise.all(ops);
  } catch (e) {
    console.error('Sync error:', e);
  }
}

// ── DB MAPPERS ────────────────────────────────────────────────────────────────
const mapBillToDb = (b) => ({
  supplier: b.supplier, value: b.value, emission: b.emission || null,
  due: b.due, status: b.status, base: b.base, cat: b.cat,
  nfnum: b.nfnum || '', nfserie: b.nfserie || '', fluig: b.fluig || '',
  fluig_value: b.fluigVal, obs: b.obs || '', rateio: b.rateio || [],
  tvo: b.tvo, conting: b.conting, attachments: b.attachments || [],
});

const mapBillFromDb = (r) => ({
  id: r.id, supplier: r.supplier, value: r.value, emission: r.emission,
  due: r.due, status: r.status, base: r.base, cat: r.cat,
  nfnum: r.nfnum, nfserie: r.nfserie, fluig: r.fluig, fluigVal: r.fluig_value,
  obs: r.obs, rateio: r.rateio || [], tvo: r.tvo, conting: r.conting,
  attachments: r.attachments || [],
});

const mapTvoBillToDb = (b) => ({
  supplier: b.supplier, value: b.value, emission: b.emission || null,
  due: b.due, status: b.status || 'pending', base: b.base, cat: b.cat,
  nfnum: b.nfnum || '', nfserie: b.nfserie || '', fluig: b.fluig || '',
  tvo_stage: b.tvoStage || 'pending', rateio: b.rateio || [],
  tvo: b.tvo, conting: b.conting, attachments: b.attachments || [],
});

const mapTvoBillFromDb = (r) => ({
  id: r.id, supplier: r.supplier, value: r.value, emission: r.emission,
  due: r.due, status: r.status, base: r.base, cat: r.cat,
  nfnum: r.nfnum, nfserie: r.nfserie, fluig: r.fluig,
  tvoStage: r.tvo_stage, rateio: r.rateio || [],
  tvo: r.tvo, conting: r.conting, attachments: r.attachments || [],
});

const mapLancToDb = (l) => ({
  origin_bill_id: l.originBillId || null, gestor: l.gestor || '',
  solnum: l.solnum || '', soldate: l.soldate || null, supplier: l.supplier,
  nf: l.nf || '', emission: l.emission || null, due: l.due || null,
  descr: l.desc || '', cat: l.cat || '', value: l.value, tipopgto: l.tipopgto || '',
  ccpgto: l.ccpgto || '', obs: l.obs || '', rateio: l.rateio || [],
  tvo: l.tvo, conting: l.conting, attachments: l.attachments || [],
  origem_pagamento: l.origemPagamento || false,
});

const mapLancFromDb = (r) => ({
  id: r.id, originBillId: r.origin_bill_id, gestor: r.gestor,
  solnum: r.solnum, soldate: r.soldate, supplier: r.supplier,
  nf: r.nf, emission: r.emission, due: r.due, desc: r.descr,
  cat: r.cat, value: r.value, tipopgto: r.tipopgto, ccpgto: r.ccpgto,
  obs: r.obs, rateio: r.rateio || [], tvo: r.tvo, conting: r.conting,
  attachments: r.attachments || [], origemPagamento: r.origem_pagamento,
});

const mapBaseToDb = (b) => ({
  nome: b.nome, gestor: b.gestor || '', data: b.data || null,
  mes: b.mes || '', desmobilizado: b.desmobilizado || false,
});

const mapBaseFromDb = (r) => ({
  id: r.id, nome: r.nome, gestor: r.gestor, data: r.data,
  mes: r.mes, desmobilizado: r.desmobilizado,
});

const mapTvoRegToDb = (r) => ({
  gestor: r.gestor || '', fluig: r.fluig || '', soldate: r.soldate || null,
  value: r.value, tipo: r.tipo || 'TVO', produto: r.produto || '',
  cc: r.cc || '', origem: r.origem || 'Manual',
});

const mapTvoRegFromDb = (r) => ({
  id: r.id, gestor: r.gestor, fluig: r.fluig, soldate: r.soldate,
  value: r.value, tipo: r.tipo, produto: r.produto, cc: r.cc, origem: r.origem,
});
