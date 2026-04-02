'use client';
import { createContext, useContext, useReducer, useEffect, useRef, useCallback, useMemo } from 'react';
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
    saveLocal(state, dispatch);
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

export const useAppSelector = (selectorFn) => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppSelector must be used within AppProvider');
  return useMemo(() => selectorFn(ctx.state), [ctx.state, selectorFn]);
};

// ── LOCALSTORAGE SAVE ─────────────────────────────────────────────────────────
function saveLocal(state, dispatch) {
  const data = {
    [LS.bills]:        JSON.stringify(state.bills),
    [LS.tvoBills]:     JSON.stringify(state.tvoBills),
    [LS.lancamentos]:  JSON.stringify(state.lancamentos),
    [LS.tvoRegistros]: JSON.stringify(state.tvoRegistros),
    [LS.bases]:        JSON.stringify(state.bases),
    [LS.cats]:         JSON.stringify(state.cats),
    [LS.catDespesas]:  JSON.stringify(state.catDespesas),
    [LS.gestores]:     JSON.stringify(state.gestores),
    [LS.orcamentos]:   JSON.stringify(state.orcamentos),
  };

  // Tentativa 1: salva tudo incluindo attachments
  try {
    Object.entries(data).forEach(([k, v]) => localStorage.setItem(k, v));
    return;
  } catch (e) {
    if (e.name !== 'QuotaExceededError') return; // erro desconhecido, ignora
  }

  // Tentativa 2: salva sem attachments (fallback de quota)
  const strip = (arr) => arr.map(({ attachments: _a, ...rest }) => rest);
  const slim = {
    [LS.bills]:        JSON.stringify(strip(state.bills)),
    [LS.tvoBills]:     JSON.stringify(strip(state.tvoBills)),
    [LS.lancamentos]:  JSON.stringify(strip(state.lancamentos)),
    [LS.tvoRegistros]: JSON.stringify(state.tvoRegistros), // sem attachments
    [LS.bases]:        JSON.stringify(state.bases),
    [LS.cats]:         JSON.stringify(state.cats),
    [LS.catDespesas]:  JSON.stringify(state.catDespesas),
    [LS.gestores]:     JSON.stringify(state.gestores),
    [LS.orcamentos]:   JSON.stringify(state.orcamentos),
  };
  try {
    Object.entries(slim).forEach(([k, v]) => localStorage.setItem(k, v));
    if (dispatch) dispatch({
      type: 'SET', key: 'storageWarning',
      payload: 'Anexos não salvos localmente — espaço insuficiente. Conecte ao Supabase para persistir anexos.',
    });
  } catch (e2) {
    console.error('localStorage save failed even without attachments:', e2);
  }
}

// ── SUPABASE LOAD ─────────────────────────────────────────────────────────────
async function loadRemote(dispatch) {
  if (!sb) return;
  try {
    const results = await Promise.all([
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

    const errorResult = results.find(r => r.error);
    if (errorResult) {
      throw errorResult.error;
    }

    const [
      { data: bills }, { data: tvoBills }, { data: lancamentos },
      { data: tvoRegistros }, { data: bases }, { data: cats },
      { data: gestores }, { data: catDespesas }, { data: orcamentos },
    ] = results;

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

  // Helper: upsert por ID + delete IDs orfãos
  const syncById = async (table, localItems, toDb, idField = 'id') => {
    if (localItems.length > 0) {
      const { error: upsertErr } = await sb
        .from(table)
        .upsert(localItems.map(toDb), { onConflict: idField });
      if (upsertErr) throw upsertErr;
    }
    // Busca IDs remotos e deleta os que não existem mais localmente
    const { data: remote } = await sb.from(table).select(idField);
    const localIds = new Set(localItems.map(i => i[idField]));
    const orphans = (remote || []).map(r => r[idField]).filter(id => !localIds.has(id));
    if (orphans.length > 0) {
      await sb.from(table).delete().in(idField, orphans);
    }
  };

  // Helper: upsert por name + delete names orfãos
  const syncByName = async (table, localNames) => {
    const items = localNames.map(name => ({ name }));
    if (items.length > 0) {
      const { error: upsertErr } = await sb
        .from(table)
        .upsert(items, { onConflict: 'name' });
      if (upsertErr) throw upsertErr;
    }
    const { data: remote } = await sb.from(table).select('name');
    const localSet = new Set(localNames);
    const orphans = (remote || []).map(r => r.name).filter(n => !localSet.has(n));
    if (orphans.length > 0) {
      await sb.from(table).delete().in('name', orphans);
    }
  };

  // Tabelas com ID numérico
  const idTables = [
    { table: 'bills',         items: state.bills,        toDb: mapBillToDb },
    { table: 'tvo_bills',     items: state.tvoBills,     toDb: mapTvoBillToDb },
    { table: 'lancamentos',   items: state.lancamentos,  toDb: mapLancToDb },
    { table: 'tvo_registros', items: state.tvoRegistros, toDb: mapTvoRegToDb },
    { table: 'bases',         items: state.bases,        toDb: mapBaseToDb },
  ];

  for (const { table, items, toDb } of idTables) {
    try {
      await syncById(table, items, toDb);
    } catch (e) {
      console.error(`Sync error [${table}]:`, e);
      dispatch({ type: 'SET', key: 'syncError', payload: `Erro ao sincronizar "${table}": ${e.message}` });
    }
  }

  // Tabelas com chave 'name'
  const nameTables = [
    { table: 'categories',  names: state.cats },
    { table: 'gestores',    names: state.gestores },
    { table: 'cat_despesas',names: state.catDespesas },
  ];

  for (const { table, names } of nameTables) {
    try {
      await syncByName(table, names);
    } catch (e) {
      console.error(`Sync error [${table}]:`, e);
      dispatch({ type: 'SET', key: 'syncError', payload: `Erro ao sincronizar "${table}": ${e.message}` });
    }
  }

  // Orçamentos: chave composta (base + cat + month), sem ID numérico
  try {
    const localOrcs = state.orcamentos.map(o => ({ base: o.base, cat: o.cat, month: o.month, value: o.value }));
    if (localOrcs.length > 0) {
      const { error } = await sb
        .from('orcamentos')
        .upsert(localOrcs, { onConflict: 'base,cat,month' });
      if (error) throw error;
    }
    // Delete orcãos orfãos pela chave composta
    const { data: remoteOrcs } = await sb.from('orcamentos').select('base,cat,month');
    const localKey = new Set(state.orcamentos.map(o => `${o.base}|${o.cat}|${o.month}`));
    const orphanOrcs = (remoteOrcs || []).filter(r => !localKey.has(`${r.base}|${r.cat}|${r.month}`));
    for (const o of orphanOrcs) {
      await sb.from('orcamentos').delete()
        .eq('base', o.base).eq('cat', o.cat).eq('month', o.month);
    }
  } catch (e) {
    console.error('Sync error [orcamentos]:', e);
    dispatch({ type: 'SET', key: 'syncError', payload: `Erro ao sincronizar "orcamentos": ${e.message}` });
  }
}

// ── DB MAPPERS ────────────────────────────────────────────────────────────────
const mapBillToDb = (b) => ({
  id: b.id, supplier: b.supplier, value: b.value, emission: b.emission || null,
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
  id: b.id, supplier: b.supplier, value: b.value, emission: b.emission || null,
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
  id: l.id, origin_bill_id: l.originBillId || null, gestor: l.gestor || '',
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
  id: b.id, nome: b.nome, gestor: b.gestor || '', data: b.data || null,
  mes: b.mes || '', desmobilizado: b.desmobilizado || false,
});

const mapBaseFromDb = (r) => ({
  id: r.id, nome: r.nome, gestor: r.gestor, data: r.data,
  mes: r.mes, desmobilizado: r.desmobilizado,
});

const mapTvoRegToDb = (r) => ({
  id: r.id, gestor: r.gestor || '', fluig: r.fluig || '', soldate: r.soldate || null,
  value: r.value, tipo: r.tipo || 'TVO', produto: r.produto || '',
  cc: r.cc || '', origem: r.origem || 'Manual',
});

const mapTvoRegFromDb = (r) => ({
  id: r.id, gestor: r.gestor, fluig: r.fluig, soldate: r.soldate,
  value: r.value, tipo: r.tipo, produto: r.produto, cc: r.cc, origem: r.origem,
});
