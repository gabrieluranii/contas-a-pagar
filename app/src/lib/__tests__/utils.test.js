import {
  fmt,
  fmtDate,
  parseExcelDate,
  parseMoneyValue,
  urgencyStatus,
  normalizeKey,
  LAUNCH_DAYS,
  URGENT_DAYS
} from '../utils';

describe('utils.js', () => {

  describe('fmt', () => {
    it('formata valores monetários corretamente', () => {
      // Como estamos rodando fora do browser, e o locale do Node pode variar,
      // usaremos replace para remover espaços indesejados (ex: non-breaking space) e facilitar a asserção no Node.
      // E verificar as partes importantes: 1.540,50
      const res = fmt(1540.5).replace(/\s/g, ' ');
      expect(res).toContain('1.540,50');
      expect(res).toContain('R$');
      
      expect(fmt(0).replace(/\s/g, ' ')).toContain('0,00');
      expect(fmt(null).replace(/\s/g, ' ')).toContain('0,00');
      expect(fmt(2.333).replace(/\s/g, ' ')).toContain('2,33');
    });
  });

  describe('fmtDate', () => {
    it('formata datas ISO para DD/MM/YYYY', () => {
      expect(fmtDate('2026-10-15')).toBe('15/10/2026');
      expect(fmtDate(null)).toBe('—');
      expect(fmtDate('')).toBe('—');
    });
  });

  describe('parseExcelDate', () => {
    it('deixa a string inalterada se já for ISO', () => {
      expect(parseExcelDate('2026-10-15')).toBe('2026-10-15');
    });

    it('converte string formato BR para ISO', () => {
      expect(parseExcelDate('15/10/2026')).toBe('2026-10-15');
      expect(parseExcelDate('15-10-2026')).toBe('2026-10-15');
    });
    
    it('converte object Date nativo para ISO string', () => {
      // Janeiro = 0, dia 5
      const d = new Date(2026, 0, 5);
      expect(parseExcelDate(d)).toBe('2026-01-05');
    });

    it('converte número serial do Excel (ex: 45000) para data próxima', () => {
      const parsed = parseExcelDate(45000); // Relativo a 1900
      expect(typeof parsed).toBe('string');
      expect(parsed).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('parseMoneyValue', () => {
    it('converte strings tipográficas com cifrão e decimais', () => {
      expect(parseMoneyValue('R$ 1.500,25')).toBe(1500.25);
      expect(parseMoneyValue('R$ 0,50')).toBe(0.5);
    });

    it('converte strings sem cifrão', () => {
      expect(parseMoneyValue('1.500,25')).toBe(1500.25);
      expect(parseMoneyValue('1500,25')).toBe(1500.25);
    });

    it('mantém numbers como numbers', () => {
      expect(parseMoneyValue(1500.25)).toBe(1500.25);
    });

    it('lida com valores nulos vazios graciosamente', () => {
      expect(parseMoneyValue('')).toBe(0);
      expect(parseMoneyValue(null)).toBe(0);
    });
  });

  describe('normalizeKey', () => {
    it('remove acentos, pontuação e casing de strings para garantir um index seguro', () => {
      expect(normalizeKey('  Lançamento de Ações  ')).toBe('lancamento de acoes');
      expect(normalizeKey('Café & RESTAURANTE!!')).toBe('cafe  restaurante');
      expect(normalizeKey('')).toBe('');
    });
  });

  describe('urgencyStatus', () => {
    const today = new Date(); // base dynamic point to prevent test decay
    
    const shiftDays = (offset) => {
      const d = new Date(today);
      d.setDate(d.getDate() + offset);
      return d.toISOString().slice(0, 10);
    };

    it('retorna "paid" se o status for paid, independente de quando era o vencimento', () => {
      expect(urgencyStatus({ status: 'paid', due: shiftDays(-15) })).toBe('paid');
    });

    it('retorna "overdue" se está vencido (dias < 0) e não foi pago', () => {
      expect(urgencyStatus({ status: 'pending', due: shiftDays(-1) })).toBe('overdue');
      expect(urgencyStatus({ status: 'pending', due: shiftDays(-10) })).toBe('overdue');
    });

    it('retorna "critical" se faltam menos de URGENT_DAYS (7) e não venceu', () => {
      expect(urgencyStatus({ status: 'pending', due: shiftDays(0) })).toBe('critical'); // hoje
      expect(urgencyStatus({ status: 'pending', due: shiftDays(URGENT_DAYS - 1) })).toBe('critical'); // 6 dias
    });

    it('retorna "warning" se entre URGENT_DAYS e LAUNCH_DAYS (inclusive)', () => {
      expect(urgencyStatus({ status: 'pending', due: shiftDays(URGENT_DAYS) })).toBe('warning');  // 7 dias
      expect(urgencyStatus({ status: 'pending', due: shiftDays(LAUNCH_DAYS) })).toBe('warning'); // 10 dias
    });

    it('retorna "ok" se além de LAUNCH_DAYS', () => {
      expect(urgencyStatus({ status: 'pending', due: shiftDays(LAUNCH_DAYS + 1) })).toBe('ok'); // 11 dias
      expect(urgencyStatus({ status: 'pending', due: shiftDays(LAUNCH_DAYS + 3) })).toBe('ok'); // 13 dias — era warning, agora ok
      expect(urgencyStatus({ status: 'pending', due: shiftDays(30) })).toBe('ok');
    });

    it('pending + vence em 8 dias retorna warning (entre URGENT_DAYS e LAUNCH_DAYS)', () => {
      expect(urgencyStatus({ status: 'pending', due: shiftDays(8) })).toBe('warning');
    });

    it('pending + vence em 6 dias retorna critical (dentro de URGENT_DAYS)', () => {
      expect(urgencyStatus({ status: 'pending', due: shiftDays(6) })).toBe('critical');
    });
  });

});
