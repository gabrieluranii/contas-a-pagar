export function isValidDate(str) {
  if (!str) return false;
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(str)) return false;
  
  const d = new Date(str + 'T00:00:00');
  const [y, m, day] = str.split('-').map(Number);
  return d.getFullYear() === y && d.getMonth() + 1 === m && d.getDate() === day;
}

export function validateBill(form) {
  const errors = {};
  if (!form.supplier || !form.supplier.trim()) errors.supplier = 'Obrigatório';
  
  const val = Number(form.value);
  if (form.value === '' || isNaN(val) || val <= 0) errors.value = 'Inválido';
  
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

export function validateLancamento(form) {
  const errors = {};
  if (!form.supplier || !form.supplier.trim()) errors.supplier = 'Obrigatório';
  
  const val = Number(form.value);
  if (form.value === '' || isNaN(val) || val <= 0) errors.value = 'Inválido';
  
  if (form.soldate && !isValidDate(form.soldate)) errors.soldate = 'Inválido';
  if (form.due && !isValidDate(form.due)) errors.due = 'Inválido';
  if (form.emission && !isValidDate(form.emission)) errors.emission = 'Inválido';
  
  return errors;
}

export function validatePagamento(form) {
  const errors = {};
  if (!form.gestor || !form.gestor.trim()) errors.gestor = 'Obrigatório';
  if (!form.fluig || !form.fluig.trim()) errors.fluig = 'Obrigatório';
  if (!form.nf || !form.nf.trim()) errors.nf = 'Obrigatório';
  if (!form.emission || !isValidDate(form.emission)) errors.emission = 'Inválido/Obrigatório';
  
  return errors;
}
