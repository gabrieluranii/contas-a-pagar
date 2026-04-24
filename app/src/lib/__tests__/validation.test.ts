import { isValidDate, validateBill, validateLancamento, validatePagamento } from '../validation';
import type { BillFormInput, LancamentoFormInput, PagamentoFormInput } from '@/types';

describe('validation.ts', () => {

  // ── isValidDate ─────────────────────────────────────────────────────────────
  describe('isValidDate', () => {
    it('retorna true para datas ISO válidas', () => {
      expect(isValidDate('2026-10-15')).toBe(true);
      expect(isValidDate('2000-01-01')).toBe(true);
      expect(isValidDate('2024-02-29')).toBe(true); // 2024 é bissexto
    });

    it('retorna false para null/undefined/string vazia', () => {
      expect(isValidDate(null)).toBe(false);
      expect(isValidDate(undefined)).toBe(false);
      expect(isValidDate('')).toBe(false);
    });

    it('retorna false para formato errado', () => {
      expect(isValidDate('15/10/2026')).toBe(false);
      expect(isValidDate('10-15-2026')).toBe(false);
      expect(isValidDate('2026-13-01')).toBe(false); // mês inválido
      expect(isValidDate('abc')).toBe(false);
    });

    it('retorna false para data inexistente (ex: 30 de fevereiro)', () => {
      expect(isValidDate('2026-02-30')).toBe(false);
    });

    it('retorna false para 29/02 em ano não bissexto', () => {
      expect(isValidDate('2025-02-29')).toBe(false);
    });
  });

  // ── validateBill ─────────────────────────────────────────────────────────────
  describe('validateBill', () => {
    const validBill: BillFormInput = {
      supplier: 'Fornecedor LTDA',
      value: 500,
      due: '2026-12-31',
      base: 'BA - CAMPO DE MARTE',
      cat: 'Serviços',
    };

    it('retorna objeto vazio para conta válida', () => {
      const errors = validateBill(validBill);
      expect(Object.keys(errors)).toHaveLength(0);
    });

    it('exige supplier', () => {
      expect(validateBill({ ...validBill, supplier: '' }).supplier).toBe('Obrigatório');
      expect(validateBill({ ...validBill, supplier: '   ' }).supplier).toBe('Obrigatório');
    });

    it('exige value > 0', () => {
      expect(validateBill({ ...validBill, value: 0 }).value).toBe('Inválido');
      expect(validateBill({ ...validBill, value: -1 }).value).toBe('Inválido');
      // Preservado do .js original: string vazia (cast) também é inválida
      expect(validateBill({ ...validBill, value: '' as unknown as number }).value).toBe('Inválido');
    });

    it('exige due válido', () => {
      expect(validateBill({ ...validBill, due: '' }).due).toBe('Inválido');
      expect(validateBill({ ...validBill, due: 'abc' }).due).toBe('Inválido');
    });

    it('exige base', () => {
      expect(validateBill({ ...validBill, base: '' }).base).toBe('Obrigatório');
    });

    it('exige cat', () => {
      expect(validateBill({ ...validBill, cat: '' }).cat).toBe('Obrigatório');
    });

    it('detecta emissão após vencimento', () => {
      const err = validateBill({ ...validBill, due: '2026-01-15', emission: '2026-01-16' });
      expect(err.emission).toBe('Não pode ser após vencimento');
    });

    it('aceita emissão igual ao vencimento (não é erro)', () => {
      const err = validateBill({ ...validBill, due: '2026-01-15', emission: '2026-01-15' });
      expect(err.emission).toBeUndefined();
    });

    it('rejeita emissão com formato inválido', () => {
      const err = validateBill({ ...validBill, emission: '15/01/2026' });
      expect(err.emission).toBe('Inválido');
    });
  });

  // ── validateLancamento ────────────────────────────────────────────────────────
  describe('validateLancamento', () => {
    const validLanc: LancamentoFormInput = {
      supplier: 'Fornecedor LTDA',
      value: 100,
    };

    it('retorna objeto vazio para lançamento válido mínimo', () => {
      expect(Object.keys(validateLancamento(validLanc))).toHaveLength(0);
    });

    it('exige supplier', () => {
      expect(validateLancamento({ ...validLanc, supplier: '' }).supplier).toBe('Obrigatório');
    });

    it('exige value > 0', () => {
      expect(validateLancamento({ ...validLanc, value: 0 }).value).toBe('Inválido');
    });

    it('valida campos opcionais de data quando fornecidos', () => {
      expect(validateLancamento({ ...validLanc, soldate: 'abc' }).soldate).toBe('Inválido');
      expect(validateLancamento({ ...validLanc, due: 'abc' }).due).toBe('Inválido');
      expect(validateLancamento({ ...validLanc, emission: 'abc' }).emission).toBe('Inválido');
    });

    it('aceita datas opcionais válidas sem erro', () => {
      const err = validateLancamento({ ...validLanc, soldate: '2026-01-01', due: '2026-02-01', emission: '2025-12-01' });
      expect(err.soldate).toBeUndefined();
      expect(err.due).toBeUndefined();
      expect(err.emission).toBeUndefined();
    });

    it('não valida due/soldate/emission quando ausentes (campos opcionais)', () => {
      const err = validateLancamento(validLanc);
      expect(err.soldate).toBeUndefined();
      expect(err.due).toBeUndefined();
      expect(err.emission).toBeUndefined();
    });
  });

  // ── validatePagamento ────────────────────────────────────────────────────────
  describe('validatePagamento', () => {
    const validPagamento: PagamentoFormInput = {
      gestor: 'Camila Rocha',
      fluig: 'FLU-001',
      nf:    '12345',
      emission: '2026-01-10',
    };

    it('retorna objeto vazio para pagamento completo e válido', () => {
      expect(Object.keys(validatePagamento(validPagamento))).toHaveLength(0);
    });

    it('exige gestor', () => {
      expect(validatePagamento({ ...validPagamento, gestor: '' }).gestor).toBe('Obrigatório');
    });

    it('exige fluig', () => {
      expect(validatePagamento({ ...validPagamento, fluig: '' }).fluig).toBe('Obrigatório');
    });

    it('exige nf', () => {
      expect(validatePagamento({ ...validPagamento, nf: '' }).nf).toBe('Obrigatório');
    });

    it('exige emission válida', () => {
      expect(validatePagamento({ ...validPagamento, emission: '' }).emission).toBe('Inválido/Obrigatório');
      expect(validatePagamento({ ...validPagamento, emission: 'abc' }).emission).toBe('Inválido/Obrigatório');
      expect(validatePagamento({ ...validPagamento, emission: undefined }).emission).toBe('Inválido/Obrigatório');
    });

    it('retorna múltiplos erros quando vários campos faltam', () => {
      const err = validatePagamento({});
      expect(Object.keys(err)).toEqual(expect.arrayContaining(['gestor', 'fluig', 'nf', 'emission']));
    });
  });

});
