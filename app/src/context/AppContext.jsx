'use client';
import { createContext, useContext, useReducer, useEffect, useRef, useMemo } from 'react';
import { sb, isSupabaseConfigured, getUser } from '@/lib/supabase';

// ── REDUCER ───────────────────────────────────────────────────────────────────
function reducer(state, action) {
  if (action.type === 'LOAD') {
    const data = action.payload.data || action.payload;
    return { ...state, ...data, loaded: true, isSyncing: false, dbOnline: true };
  }

  const nextState = innerReducer(state, action);
  const isDataMutation =
    action.type.startsWith('ADD_') ||
    action.type.startsWith('UPDATE_') ||
    action.type.startsWith('DELETE_') ||
    action.type === 'SET_LANCS' ||
    action.type === 'SET_TVO_REGS';

  if (isDataMutation) {
    nextState.lastLocalEdit = Date.now();
  }
  return nextState;
}

function innerReducer(state, action) {
  switch (action.type) {
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
      return { ...state, bases: state.bases.map(b => b.id === action.payload.id ? action.payload : b) };
    case 'DELETE_BASE':
      return { ...state, bases: state.bases.filter(b => b.id !== action.id) };
    case 'DELETE_BASES':
      return { ...state, bases: state.bases.filter(b => !action.payload.has(b.nome)) };
    case 'SET_BASES':
      return { ...state, bases: action.payload };
    case 'ADD_CAT':
      return { ...state, cats: [...state.cats, action.payload] };
    case 'REMOVE_CAT':
      return { ...state, cats: state.cats.filter(n => n !== action.name) };
    case 'ADD_GESTOR':
      return { ...state, gestores: [...state.gestores, action.payload] };
    case 'REMOVE_GESTOR':
      return { ...state, gestores: state.gestores.filter(n => n !== action.name) };
    case 'ADD_CAT_DESPESA':
      return { ...state, catDespesas: [...state.catDespesas, action.payload] };
    case 'REMOVE_CAT_DESPESA':
      return { ...state, catDespesas: state.catDespesas.filter(n => n !== action.name) };
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
    case 'RESET_DATA':
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
  bills: [], tvoBills: [], lancamentos: [], tvoRegistros: [],
  bases: [], cats: [], catDespesas: [], gestores: [], orcamentos: [],
  dbOnline: false, loaded: false,
};

// ── CONTEXT ───────────────────────────────────────────────────────────────────
const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, INITIAL);
  const syncTimer  = useRef(null);
  const isSyncing  = useRef(false);
  const currentUid = useRef(null);

  // ── Carrega dados do Supabase para o usuário logado ───────────────────────
  async function loadForUser(uid) {
    const previousUid = currentUid.current;
    currentUid.current = uid;

    // Troca de usuário: limpa estado anterior para evitar leak entre contas
    if (previousUid && previousUid !== uid) {
      dispatch({ type: 'RESET_DATA' });
    }

    if (!uid || !isSupabaseConfigured()) {
      dispatch({ type: 'RESET_DATA' });
      dispatch({ type: 'SET', key: 'loaded', payload: true });
      return;
    }

    await loadRemote(dispatch);
  }

  // ── Escuta mudanças de sessão ─────────────────────────────────────────────
  useEffect(() => {
    if (!isSupabaseConfigured() || !sb) {
      dispatch({ type: 'SET', key: 'loaded', payload: true });
      return;
    }

    sb.auth.getSession().then(({ data: { session } }) => {
      loadForUser(session?.user?.id || null);
    });

    const { data: { subscription } } = sb.auth.onAuthStateChange((_event, session) => {
      const uid = session?.user?.id || null;
      if (uid !== currentUid.current) {
        loadForUser(uid);
      }
    });

    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Sync para Supabase após mutações de dados ─────────────────────────────
  // Observa apenas os arrays de dados, não o estado inteiro, evitando loop
 useEffect(() => {
    if (!state.loaded) return;
    if (!state.dbOnline) return;
    if (!currentUid.current) return;
    if (!state.lastLocalEdit) return; // só sincroniza se houve edição local

    clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => syncToRemote(state, dispatch, isSyncing), 800);
  }, [
    state.bills, state.tvoBills, state.lancamentos, state.tvoRegistros,
    state.bases, state.cats, state.catDespesas, state.gestores, state.orcamentos,
  ]);

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

// ── SUPABASE LOAD ─────────────────────────────────────────────────────────────
async function loadRemote(dispatch) {
  if (!sb) return;
  dispatch({ type: 'SET', key: 'isSyncing', payload: true });
  dispatch({ type: 'SET', key: 'syncError', payload: null });
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
    if (errorResult) throw errorResult.error;

    const [
      { data: bills }, { data: tvoBills }, { data: lancamentos },
      { data: tvoRegistros }, { data: bases }, { data: cats },
      { data: gestores }, { data: catDespesas }, { data: orcamentos },
    ] = results;

    dispatch({
      type: 'LOAD',
      payload: {
        data: {
          bills:        (bills || []).map(mapBillFromDb),
          tvoBills:     (tvoBills || []).map(mapTvoBillFromDb),
          lancamentos:  (lancamentos || []).map(mapLancFromDb),
          tvoRegistros: (tvoRegistros || []).map(mapTvoRegFromDb),
          bases:        (bases || []).map(mapBaseFromDb),
          cats:         (cats || []).map(r => r.name),
          gestores:     (gestores || []).map(r => r.name),
          catDespesas:  (catDespesas || []).map(r => r.name),
          orcamentos:   (orcamentos || []).map(r => ({ base: r.base, cat: r.cat, month: r.month, value: r.value })),
        }
      },
    });
    dispatch({ type: 'SET_ONLINE', payload: true });
  } catch (e) {
    console.warn('Supabase load failed:', e.message);
    dispatch({ type: 'SET_ONLINE', payload: false });
    dispatch({ type: 'SET', key: 'isSyncing', payload: false });
    dispatch({ type: 'SET', key: 'syncError', payload: `Erro ao carregar: ${e.message}` });
    dispatch({ type: 'SET', key: 'loaded', payload: true });
  }
}

// ── SUPABASE SYNC ─────────────────────────────────────────────────────────────
async function syncToRemote(state, dispatch, isSyncingRef) {
  if (!sb) return;
  if (isSyncingRef.current) return;

  isSyncingRef.current = true;
  dispatch({ type: 'SET', key: 'syncError', payload: null });

  const user = await getUser();
  if (!user?.id) {
    isSyncingRef.current = false;
    return;
  }
  const uid = user.id;

  // Sync por ID — filtra delete apenas pelo próprio user_id
  const syncById = async (table, localItems, toDb, idField = 'id') => {
    if (localItems.length > 0) {
      const { error } = await sb
        .from(table)
        .upsert(localItems.map(item => toDb(item, uid)), { onConflict: idField });
      if (error) throw error;
    }
    const { data: remote } = await sb.from(table).select(idField).eq('user_id', uid);
    const localIds = new Set(localItems.map(i => i[idField]));
    const orphans = (remote || []).map(r => r[idField]).filter(id => !localIds.has(id));
    if (orphans.length > 0) {
      await sb.from(table).delete().eq('user_id', uid).in(idField, orphans);
    }
  };

  // Sync por nome — filtra delete apenas pelo próprio user_id
  const syncByName = async (table, localNames) => {
    const items = localNames.map(name => ({ name, user_id: uid }));
    if (items.length > 0) {
      const { error } = await sb
        .from(table)
        .upsert(items, { onConflict: 'name,user_id' });
      if (error) throw error;
    }
    const { data: remote } = await sb.from(table).select('name').eq('user_id', uid);
    const localSet = new Set(localNames);
    const orphans = (remote || []).map(r => r.name).filter(n => !localSet.has(n));
    if (orphans.length > 0) {
      await sb.from(table).delete().eq('user_id', uid).in('name', orphans);
    }
  };

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

  const nameTables = [
    { table: 'categories',   names: state.cats },
    { table: 'gestores',     names: state.gestores },
    { table: 'cat_despesas', names: state.catDespesas },
  ];

  for (const { table, names } of nameTables) {
    try {
      await syncByName(table, names);
    } catch (e) {
      console.error(`Sync error [${table}]:`, e);
      dispatch({ type: 'SET', key: 'syncError', payload: `Erro ao sincronizar "${table}": ${e.message}` });
    }
  }

  // Orçamentos
  try {
    const localOrcs = state.orcamentos.map(o => ({
      base: o.base, cat: o.cat, month: o.month, value: o.value, user_id: uid
    }));
    if (localOrcs.length > 0) {
      const { error } = await sb
        .from('orcamentos')
        .upsert(localOrcs, { onConflict: 'base,cat,month,user_id' });
      if (error) throw error;
    }
    const { data: remoteOrcs } = await sb.from('orcamentos').select('base,cat,month').eq('user_id', uid);
    const localKey = new Set(state.orcamentos.map(o => `${o.base}|${o.cat}|${o.month}`));
    const orphanOrcs = (remoteOrcs || []).filter(r => !localKey.has(`${r.base}|${r.cat}|${r.month}`));
    for (const o of orphanOrcs) {
      await sb.from('orcamentos').delete()
        .eq('user_id', uid)
        .eq('base', o.base).eq('cat', o.cat).eq('month', o.month);
    }
  } catch (e) {
    console.error('Sync error [orcamentos]:', e);
    dispatch({ type: 'SET', key: 'syncError', payload: `Erro ao sincronizar "orcamentos": ${e.message}` });
  }

  isSyncingRef.current = false;
}

// ── DB MAPPERS ────────────────────────────────────────────────────────────────
const mapBillToDb = (b, uid) => ({
  id: b.id, user_id: uid, supplier: b.supplier, value: b.value, emission: b.emission || null,
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

const mapTvoBillToDb = (b, uid) => ({
  id: b.id, user_id: uid, supplier: b.supplier, value: b.value, emission: b.emission || null,
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

const mapLancToDb = (l, uid) => ({
  id: l.id, user_id: uid, origin_bill_id: l.originBillId || null, gestor: l.gestor || '',
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

const mapBaseToDb = (b, uid) => ({
  id: b.id, user_id: uid, nome: b.nome, gestor: b.gestor || '', data: b.data || null,
  mes: b.mes || '', desmobilizado: b.desmobilizado || false,
});

const mapBaseFromDb = (r) => ({
  id: r.id, nome: r.nome, gestor: r.gestor, data: r.data,
  mes: r.mes, desmobilizado: r.desmobilizado,
});

const mapTvoRegToDb = (r, uid) => ({
  id: r.id, user_id: uid, gestor: r.gestor || '', fluig: r.fluig || '', soldate: r.soldate || null,
  value: r.value, tipo: r.tipo || 'TVO', produto: r.produto || '',
  cc: r.cc || '', origem: r.origem || 'Manual',
});

const mapTvoRegFromDb = (r) => ({
  id: r.id, gestor: r.gestor, fluig: r.fluig, soldate: r.soldate,
  value: r.value, tipo: r.tipo, produto: r.produto, cc: r.cc, origem: r.origem,
});
