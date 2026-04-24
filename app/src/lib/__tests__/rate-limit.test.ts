import { checkRateLimit } from '../rate-limit';

describe('rate-limit.ts', () => {

  // Reseta o estado interno entre testes via módulo isolado
  beforeEach(() => {
    jest.resetModules();
  });

  it('permite a primeira requisição', () => {
    const result = checkRateLimit('user-a');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.remaining).toBe(19);
    }
  });

  it('decrementa remaining a cada chamada', () => {
    const key = `user-decrement-${Date.now()}`;
    checkRateLimit(key); // 1
    checkRateLimit(key); // 2
    const r = checkRateLimit(key); // 3
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.remaining).toBe(17);
  });

  it('bloqueia após 20 requisições', () => {
    const key = `user-limit-${Date.now()}`;
    for (let i = 0; i < 20; i++) checkRateLimit(key);
    const blocked = checkRateLimit(key);
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) {
      expect(blocked.retryAfterMs).toBeGreaterThan(0);
    }
  });

  it('isola contagens por key', () => {
    const k1 = `user-iso-1-${Date.now()}`;
    const k2 = `user-iso-2-${Date.now()}`;
    for (let i = 0; i < 20; i++) checkRateLimit(k1);
    const r = checkRateLimit(k2);
    expect(r.ok).toBe(true); // k2 tem bucket independente
  });

  it('retorna retryAfterMs <= 10 minutos quando bloqueado', () => {
    const key = `user-after-${Date.now()}`;
    for (let i = 0; i < 20; i++) checkRateLimit(key);
    const r = checkRateLimit(key);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.retryAfterMs).toBeLessThanOrEqual(10 * 60 * 1000);
    }
  });

});
