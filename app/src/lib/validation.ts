import type { BillFormInput, LancamentoFormInput, PagamentoFormInput } from '@/types';

export function isValidDate(str: string | null | undefined): boolean {
  if (!str) return false;
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(str)) return false;

  const d = new Date(str + 'T00:00:00');
  const [y, m, day] = str.split('-').map(Number);
  return d.getFullYear() === y && d.getMonth() + 1 === m && d.getDate() === day;
}

export function validateBill(form: BillFormInput): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!form.supplier || !form.supplier.trim()) errors.supplier = 'Obrigatório';

  const val = Number(form.value);
  // Preservado do JS original: string vazia também é inválida
  if ((form.value as unknown) === '' || isNaN(val) || val <= 0) errors.value = 'Inválido';

  if (!form.due || !isValidDate(form.due)) errors.due = 'Inválido';
  if (!form.base) errors.base = 'Obrigatório';
  if (!form.cat) errors.cat = 'Obrigatório';

  if (form.emission) {
    if (!isValidDate(form.emission)) {
      errors.emission = 'Inválido';
    } else if (form.due && isValidDate(form.due)) {
      if (form.emission > form.due) {
        errors.emission = 'Não pode ser após vencimento';
      }
    }
  }

  return errors;
}

export function validateLancamento(form: LancamentoFormInput): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!form.supplier || !form.supplier.trim()) errors.supplier = 'Obrigatório';

  const val = Number(form.value);
  // Preservado do JS original: string vazia também é inválida
  if ((form.value as unknown) === '' || isNaN(val) || val <= 0) errors.value = 'Inválido';

  if (form.soldate && !isValidDate(form.soldate)) errors.soldate = 'Inválido';
  if (form.due && !isValidDate(form.due)) errors.due = 'Inválido';
  if (form.emission && !isValidDate(form.emission)) errors.emission = 'Inválido';

  return errors;
}

export function validatePagamento(form: PagamentoFormInput): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!form.gestor || !form.gestor.trim()) errors.gestor = 'Obrigatório';
  if (!form.fluig || !form.fluig.trim()) errors.fluig = 'Obrigatório';
  if (!form.nf || !form.nf.trim()) errors.nf = 'Obrigatório';
  if (!form.emission || !isValidDate(form.emission)) errors.emission = 'Inválido/Obrigatório';

  return errors;
}
