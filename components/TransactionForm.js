'use client';
import { useEffect, useRef, useState } from 'react';
import { CATS, todayISO } from '../lib/utils';
import { ArrowDownRight, ArrowUpRight, X } from 'lucide-react';

const formatBRLInput = (value) => {
  const digits = String(value ?? '').replace(/\D/g, '');
  if (!digits) return '';
  const amount = Number(digits) / 100;
  return amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export default function TransactionForm({ initial, onSave, onDelete, onClose }) {
  const editing = Boolean(initial?.id);
  const [f, setF] = useState(() => initial ? { ...initial, amount: formatBRLInput(Math.round(Number(initial.amount) * 100)) } : { type: 'despesa', description: '', amount: '', date: todayISO(), category: 'Mercado', paid: true, fixed: false });
  const [err, setErr] = useState('');
  const descriptionRef = useRef(null);
  const amountRef = useRef(null);
  useEffect(() => {
    const onKeyDown = (event) => { if (event.key === 'Escape') onClose(); };
    const previousRootOverflow = document.documentElement.style.overflow;
    const previousRootOverscroll = document.documentElement.style.overscrollBehavior;
    const previousOverflow = document.body.style.overflow;
    const previousOverscroll = document.body.style.overscrollBehavior;
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.overscrollBehavior = 'none';
    document.body.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'none';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.overscrollBehavior = previousOverscroll;
      document.documentElement.style.overflow = previousRootOverflow;
      document.documentElement.style.overscrollBehavior = previousRootOverscroll;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);
  useEffect(() => {
    if (window.matchMedia('(min-width: 640px)').matches) descriptionRef.current?.focus();
  }, []);
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const setType = (t) => setF((s) => ({ ...s, type: t, category: CATS[t][0] }));
  const setAmount = (value) => set('amount', formatBRLInput(value));
  const submit = (e) => {
    e.preventDefault();
    const amount = Number(String(f.amount).replace(/\./g, '').replace(',', '.'));
    if (!f.description.trim()) { setErr('Informe uma descrição.'); descriptionRef.current?.focus(); return; }
    if (!(amount > 0)) { setErr('Informe um valor maior que zero.'); amountRef.current?.focus(); return; }
    onSave({ ...f, description: f.description.trim(), amount });
  };

  return (
    <div className="fixed inset-0 z-50 flex touch-none items-end justify-center overscroll-none bg-black/65 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <form role="dialog" aria-modal="true" aria-labelledby="transaction-title" onSubmit={submit} onClick={(e) => e.stopPropagation()} className="max-h-[92dvh] w-full touch-pan-y overflow-y-auto overscroll-contain rounded-t-2xl border border-line bg-card p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-panel sm:max-w-lg sm:rounded-2xl sm:p-7">
        <div className="mb-5 flex items-start justify-between gap-4"><div><p className="eyebrow">{editing ? 'Atualize os detalhes' : 'Organize suas finanças'}</p><h2 id="transaction-title" className="mt-1 font-display text-2xl font-semibold tracking-tight">{editing ? 'Editar lançamento' : f.type === 'receita' ? 'Nova receita' : 'Nova despesa'}</h2></div><button type="button" onClick={onClose} aria-label="Fechar" className="flex h-10 w-10 items-center justify-center rounded-lg text-mute hover:bg-paper hover:text-ink"><X className="h-5 w-5" /></button></div>

        <div className="grid grid-cols-2 gap-2" role="group" aria-label="Tipo de lançamento">
          {[
            { type: 'receita', label: 'Receita', hint: 'Dinheiro que entra', Icon: ArrowUpRight, iconColor: 'text-receita' },
            { type: 'despesa', label: 'Despesa', hint: 'Dinheiro que sai', Icon: ArrowDownRight, iconColor: 'text-despesa' },
          ].map(({ type, label, hint, Icon, iconColor }) => <button type="button" key={type} onClick={() => setType(type)} aria-pressed={f.type === type} className={`flex items-center gap-2.5 rounded-lg border px-3 py-3 text-left transition-colors ${f.type === type ? 'border-violet/40 bg-violet/5 text-ink' : 'border-line bg-white text-mute hover:bg-paper'}`}><Icon className={`h-4 w-4 shrink-0 ${iconColor}`} /><span><span className="block text-sm font-semibold">{label}</span><span className="mt-0.5 block text-[11px]">{hint}</span></span></button>)}
        </div>
        <div className="mt-5 space-y-4">
          <p className="-mb-1 text-xs text-mute">{f.type === 'receita' ? 'Registre salário, renda extra ou qualquer valor recebido no mês.' : 'Registre um gasto pago ou que ainda será pago.'}</p>
          <label className="block scroll-mb-24 text-sm font-semibold">Descrição<input ref={descriptionRef} enterKeyHint="next" onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); amountRef.current?.focus(); } }} className="field mt-1.5 font-normal" value={f.description} onChange={(e) => { set('description', e.target.value); if (err) setErr(''); }} placeholder={f.type === 'receita' ? 'Ex.: Salário, renda extra' : 'Ex.: Aluguel'} /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block scroll-mb-24 text-sm font-semibold">{f.type === 'receita' ? 'Valor da receita (R$)' : 'Valor da despesa (R$)'}<input ref={amountRef} enterKeyHint="done" onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} className="field num mt-1.5 font-normal" inputMode="numeric" autoComplete="off" value={f.amount} onChange={(e) => { setAmount(e.target.value); if (err) setErr(''); }} placeholder="0,00" /></label>
            <label className="block text-sm font-semibold">Data<input type="date" className="field mt-1.5 font-normal" value={f.date} onChange={(e) => set('date', e.target.value)} required /></label>
          </div>
          <label className="block text-sm font-semibold">Categoria<select className="field mt-1.5 font-normal" value={f.category} onChange={(e) => set('category', e.target.value)}>{CATS[f.type].map((c) => <option key={c}>{c}</option>)}</select></label>
          <div className="space-y-2.5 rounded-xl bg-paper/75 p-4">
            <label className="flex cursor-pointer items-center gap-3 text-sm"><input type="checkbox" checked={f.paid} onChange={(e) => set('paid', e.target.checked)} className="h-4 w-4 accent-[#594e90]" />{f.type === 'despesa' ? 'Já paguei' : 'Já recebi'}</label>
            <label className="flex cursor-pointer items-center gap-3 text-sm"><input type="checkbox" checked={f.fixed} onChange={(e) => set('fixed', e.target.checked)} className="h-4 w-4 accent-[#594e90]" />Lançamento fixo (repete todo mês)</label>
          </div>
        </div>
        {err && <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-despesa" role="alert">{err}</p>}
        <div className="mt-6 flex items-center gap-2 border-t border-line pt-4">
          {editing && <button type="button" onClick={() => onDelete(f.id)} className="rounded-lg px-3 py-2.5 text-sm font-medium text-despesa hover:bg-rose-50">Excluir</button>}
          <button type="button" onClick={onClose} className="ml-auto rounded-lg border border-line px-4 py-2.5 text-sm font-medium text-mute hover:bg-paper">Cancelar</button>
          <button type="submit" className="rounded-lg bg-ink px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800">Salvar lançamento</button>
        </div>
      </form>
    </div>
  );
}
