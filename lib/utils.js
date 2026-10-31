export const CATS = {
  despesa: ['Moradia', 'Mercado', 'Transporte', 'Saúde', 'Lazer', 'Educação', 'Assinaturas', 'Cartão', 'Outros'],
  receita: ['Salário', 'Extra', 'Investimentos', 'Outros'],
};
const PALETTE = ['#3B6FB6', '#C98A1B', '#8B5CB0', '#2A9DA8', '#7A8B3A', '#B5651D', '#C0394F', '#1F7A5C', '#6B7280'];
export const catColor = (c) => PALETTE[Math.max(0, [...CATS.despesa, ...CATS.receita].indexOf(c)) % PALETTE.length];

export const brl = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
export const todayISO = () => new Date().toLocaleDateString('sv-SE');

export const monthLabel = (key) => {
  const [y, m] = key.split('-').map(Number);
  const s = new Date(y, m - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  return s.charAt(0).toUpperCase() + s.slice(1);
};
export const shiftMonth = (key, n) => {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1 + n, 1).toLocaleDateString('sv-SE').slice(0, 7);
};
export const moveToMonth = (date, key) => {
  const [y, m] = key.split('-').map(Number);
  const last = new Date(y, m, 0).getDate();
  return `${key}-${String(Math.min(Number(date.slice(8)), last)).padStart(2, '0')}`;
};
export const shortDate = (d) => `${d.slice(8)}/${d.slice(5, 7)}`;
export const uid = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()));

export function download(name, text, type) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}
