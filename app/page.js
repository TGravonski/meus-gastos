'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import TransactionForm from '../components/TransactionForm';
import AuthForm from '../components/AuthForm';
import { supabase, supabaseConfigured } from '../lib/supabase';
import { brl, CATS, download, monthLabel, moveToMonth, shiftMonth, shortDate, todayISO, uid } from '../lib/utils';
import { ArrowDownRight, ArrowLeft, ArrowRight, ArrowUpRight, BarChart3, BriefcaseBusiness, CarFront, Check, CircleDollarSign, Clapperboard, Clock3, CreditCard, Download, FileDown, GraduationCap, HeartPulse, House, ListFilter, LogOut, Mail, MessageCircle, PencilLine, PieChart, Plus, Repeat2, Search, ShoppingBasket, Trash2, TrendingUp, Upload, X } from 'lucide-react';

const FILTERS = [['todos', 'Todos'], ['despesa', 'Despesas'], ['receita', 'Receitas'], ['pendente', 'Pendentes']];
const ACCENTS = ['#5887A3', '#477893', '#366984', '#245A74', '#134B64', '#10465E', '#0D4158', '#0A3C52', '#07374C'];
const CATEGORY_ICONS = {
  Moradia: House, Mercado: ShoppingBasket, Transporte: CarFront, Saúde: HeartPulse,
  Lazer: Clapperboard, Educação: GraduationCap, Assinaturas: Repeat2, Cartão: CreditCard,
  Salário: BriefcaseBusiness, Extra: TrendingUp, Investimentos: TrendingUp,
};
const isValidTransaction = (t) => t && typeof t === 'object' && typeof t.description === 'string' && typeof t.category === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(t.date) && ['despesa', 'receita'].includes(t.type) && Number.isFinite(Number(t.amount)) && Number(t.amount) > 0;
const normalizeTransactions = (items) => items.map((t) => ({ ...t, id: t.id || uid(), amount: Number(t.amount), paid: Boolean(t.paid), fixed: Boolean(t.fixed) }));
const normalizeCategoryList = (items, fallback) => {
  const normalized = Array.isArray(items) ? [...new Map(items.filter((item) => typeof item === 'string').map((item) => item.trim().replace(/\s+/g, ' ')).filter(Boolean).map((item) => [item.toLocaleLowerCase('pt-BR'), item])).values()] : [];
  return normalized.length ? normalized : [...fallback];
};
const normalizeCategories = (stored) => ({
  despesa: normalizeCategoryList(stored?.despesa, CATS.despesa),
  receita: normalizeCategoryList(stored?.receita, CATS.receita),
});

function CategorySummary({ title, entries, total, chartType, onChartTypeChange }) {
  const pieGradient = entries.map(([, value], index, all) => {
    const start = all.slice(0, index).reduce((sum, [, amount]) => sum + amount, 0) / total * 100;
    const end = start + value / total * 100;
    return `${ACCENTS[index % ACCENTS.length]} ${start}% ${end}%`;
  }).join(', ');

  return (
    <section className="panel p-5 sm:p-6" aria-label={`${title} por categoria`}>
      <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="eyebrow">Visão geral</p><h2 className="mt-1 font-display text-xl font-semibold tracking-tight">{title} por categoria</h2></div><div className="flex rounded-lg bg-paper p-1" role="group" aria-label={`Tipo de gráfico de ${title.toLowerCase()}`}><button type="button" onClick={() => onChartTypeChange('barras')} aria-pressed={chartType === 'barras'} className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${chartType === 'barras' ? 'bg-white text-ink shadow-sm ring-1 ring-black/[0.04]' : 'text-mute hover:text-ink'}`}><BarChart3 className="h-3.5 w-3.5" /> Barras</button><button type="button" onClick={() => onChartTypeChange('pizza')} aria-pressed={chartType === 'pizza'} className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${chartType === 'pizza' ? 'bg-white text-ink shadow-sm ring-1 ring-black/[0.04]' : 'text-mute hover:text-ink'}`}><PieChart className="h-3.5 w-3.5" /> Pizza</button></div></div>
      {entries.length === 0 ? <div className="py-10 text-center"><CircleDollarSign className="mx-auto h-7 w-7 text-mute" aria-hidden="true" /><p className="mt-2 text-sm text-mute">Sem {title.toLowerCase()} registradas neste mês.</p></div> : <>
        {chartType === 'barras' ? <div className="mt-5 flex h-2 overflow-hidden rounded-full bg-paper" role="img" aria-label={`Proporção de ${title.toLowerCase()} por categoria`}>{entries.map(([category, value], index) => <div key={category} className="opacity-80 transition-all duration-200" style={{ width: `${(value / total) * 100}%`, background: ACCENTS[index % ACCENTS.length] }} title={`${category}: ${brl(value)}`} />)}</div> : <div className="mt-5 flex justify-center"><div className="h-44 w-44 rounded-full border border-black/[0.06] shadow-sm" role="img" aria-label={`Gráfico de pizza de ${title.toLowerCase()} por categoria`} style={{ background: `conic-gradient(${pieGradient})` }} /></div>}
        <ul className="mt-5 space-y-4">{entries.map(([category, value], index) => <li key={category} className="flex items-center gap-3 text-sm"><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: ACCENTS[index % ACCENTS.length] }} /><span className="min-w-0 flex-1 truncate font-medium">{category}</span><span className="num text-xs text-mute">{Math.round((value / total) * 100)}%</span><span className="num w-24 text-right font-semibold">{brl(value)}</span></li>)}</ul>
      </>}
    </section>
  );
}

function PrintCategoryChart({ title, entries, total }) {
  let offset = 0;
  const segments = entries.map(([category, value], index) => {
    const width = total > 0 ? (value / total) * 600 : 0;
    const segment = { category, value, x: offset, width, color: ACCENTS[index % ACCENTS.length] };
    offset += width;
    return segment;
  });
  return <section className="report-category"><h2>{title}</h2>{entries.length ? <>
    <svg className="report-chart" viewBox="0 0 600 18" role="img" aria-label={`${title} por categoria`}><rect width="600" height="18" rx="9" fill="#e5e7eb" />{segments.map((segment) => <rect key={segment.category} x={segment.x} y="0" width={segment.width} height="18" fill={segment.color} />)}</svg>
    <ul>{entries.map(([category, value], index) => <li key={category}><span><i style={{ backgroundColor: ACCENTS[index % ACCENTS.length] }} />{category}</span><strong>{brl(value)} <small>{Math.round((value / total) * 100)}%</small></strong></li>)}</ul>
  </> : <p className="report-empty">Sem {title.toLowerCase()} neste mês.</p>}</section>;
}

export default function Home() {
  const [txs, setTxs] = useState([]);
  const [categories, setCategories] = useState(() => normalizeCategories(CATS));
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState(null);
  const [month, setMonth] = useState(todayISO().slice(0, 7));
  const [filter, setFilter] = useState('todos');
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(null);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [expenseChartType, setExpenseChartType] = useState('barras');
  const [incomeChartType, setIncomeChartType] = useState('barras');
  const [msg, setMsg] = useState('');
  const fileRef = useRef(null);

  useEffect(() => {
    if (!supabaseConfigured) return;
    let active = true;
    const loadUserData = async (authUser) => {
      if (!active) return;
      setReady(false);
      setUser(authUser || null);
      setTxs([]);
      setCategories(normalizeCategories(CATS));
      if (!authUser) { setReady(true); return; }
      const [transactionsResult, categoriesResult] = await Promise.all([
        supabase.from('transactions').select('*').order('date', { ascending: false }),
        supabase.from('user_categories').select('categories').maybeSingle(),
      ]);
      if (!active) return;
      if (transactionsResult.error || categoriesResult.error) {
        setMsg(`Erro ao carregar dados: ${(transactionsResult.error || categoriesResult.error).message}`);
      } else {
        setTxs(normalizeTransactions((transactionsResult.data || []).filter(isValidTransaction)));
        if (categoriesResult.data?.categories) setCategories(normalizeCategories(categoriesResult.data.categories));
      }
      setReady(true);
    };
    supabase.auth.getSession().then(({ data }) => loadUserData(data.session?.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setTimeout(() => loadUserData(session?.user), 0);
    });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, []);
  useEffect(() => {
    if (!ready || !user) return;
    const timer = setTimeout(async () => {
      const rows = txs.map((t) => ({ ...t, user_id: user.id }));
      const [txResult, catResult] = await Promise.all([
        rows.length ? supabase.from('transactions').upsert(rows) : Promise.resolve({ error: null }),
        supabase.from('user_categories').upsert({ user_id: user.id, categories, updated_at: new Date().toISOString() }),
      ]);
      if (txResult.error || catResult.error) setMsg(`Erro ao salvar: ${(txResult.error || catResult.error).message}`);
    }, 350);
    return () => clearTimeout(timer);
  }, [txs, categories, ready, user]);
  useEffect(() => { if (msg) { const t = setTimeout(() => setMsg(''), 3000); return () => clearTimeout(t); } }, [msg]);
  useEffect(() => {
    if (!addMenuOpen) return;
    const onKeyDown = (event) => { if (event.key === 'Escape') setAddMenuOpen(false); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [addMenuOpen]);

  const monthTxs = useMemo(() => txs.filter((t) => t?.date?.startsWith(month)), [txs, month]);
  const sum = (arr) => arr.reduce((a, t) => a + t.amount, 0);
  const receitas = sum(monthTxs.filter((t) => t.type === 'receita'));
  const despesasArr = monthTxs.filter((t) => t.type === 'despesa');
  const despesas = sum(despesasArr);
  const aPagar = sum(despesasArr.filter((t) => !t.paid));
  const aReceber = sum(monthTxs.filter((t) => t.type === 'receita' && !t.paid));
  const saldo = receitas - despesas;
  const categorySummaries = useMemo(() => {
    const group = (type) => {
      const totals = {};
      monthTxs.filter((transaction) => transaction.type === type).forEach((transaction) => {
        totals[transaction.category] = (totals[transaction.category] || 0) + transaction.amount;
      });
      return Object.entries(totals).sort((a, b) => b[1] - a[1]);
    };
    return { expenses: group('despesa'), income: group('receita') };
  }, [monthTxs]);
  const expenseTotal = categorySummaries.expenses.reduce((sum, [, value]) => sum + value, 0);
  const incomeTotal = categorySummaries.income.reduce((sum, [, value]) => sum + value, 0);
  const categoryUsage = useMemo(() => txs.reduce((usage, transaction) => {
    if (['despesa', 'receita'].includes(transaction.type) && transaction.category) {
      usage[transaction.type][transaction.category] = (usage[transaction.type][transaction.category] || 0) + 1;
    }
    return usage;
  }, { despesa: {}, receita: {} }), [txs]);
  const reportText = useMemo(() => [
    `Resumo financeiro — ${monthLabel(month)}`,
    `Saldo: ${brl(saldo)}`,
    `Receitas: ${brl(receitas)}`,
    `Despesas: ${brl(despesas)}`,
    `A pagar: ${brl(aPagar)}`,
    '',
    'Receitas por categoria:',
    ...(categorySummaries.income.length ? categorySummaries.income.map(([category, value]) => `• ${category}: ${brl(value)}`) : ['• Sem receitas registradas']),
    '',
    'Despesas por categoria:',
    ...(categorySummaries.expenses.length ? categorySummaries.expenses.map(([category, value]) => `• ${category}: ${brl(value)}`) : ['• Sem despesas registradas']),
  ].join('\n'), [month, saldo, receitas, despesas, aPagar, categorySummaries]);
  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return monthTxs.filter((t) => (filter === 'todos' ? true : filter === 'pendente' ? !t.paid : t.type === filter))
      .filter((t) => !q || (t.description || '').toLowerCase().includes(q) || (t.category || '').toLowerCase().includes(q))
      .sort((a, b) => b.date.localeCompare(a.date) || (b.description || '').localeCompare(a.description || '', 'pt-BR'));
  }, [monthTxs, filter, query]);

  const save = (t) => { setTxs((p) => (t.id ? p.map((x) => (x.id === t.id ? t : x)) : [...p, { ...t, id: uid() }])); setEditing(null); };
  const addCategory = (type, name) => setCategories((current) => ({ ...current, [type]: [...current[type], name] }));
  const deleteCategory = (type, name) => setCategories((current) => ({ ...current, [type]: current[type].filter((item) => item !== name) }));
  const renameCategory = (type, oldName, newName) => {
    setCategories((current) => ({ ...current, [type]: current[type].map((item) => item === oldName ? newName : item) }));
    setTxs((current) => current.map((transaction) => transaction.type === type && transaction.category === oldName ? { ...transaction, category: newName } : transaction));
  };
  const remove = (id) => {
    if (!window.confirm('Excluir este lançamento? Esta ação não pode ser desfeita.')) return;
    setTxs((p) => p.filter((x) => x.id !== id));
    if (user) supabase.from('transactions').delete().eq('id', id).then(({ error }) => { if (error) setMsg(`Erro ao excluir: ${error.message}`); });
    setEditing(null);
    setMsg('Lançamento excluído.');
  };
  const togglePaid = (id) => setTxs((p) => p.map((x) => (x.id === id ? { ...x, paid: !x.paid } : x)));
  const copyFixed = () => {
    const prev = txs.filter((t) => t.fixed && t.date.startsWith(shiftMonth(month, -1)));
    const exists = (t) => monthTxs.some((x) => x.description === t.description && x.type === t.type && x.category === t.category);
    const novos = prev.filter((t) => !exists(t)).map((t) => ({ ...t, id: uid(), date: moveToMonth(t.date, month), paid: false }));
    setTxs((p) => [...p, ...novos]);
    setMsg(novos.length ? `${novos.length} lançamento(s) fixo(s) copiado(s).` : 'Nenhum lançamento fixo novo para copiar.');
  };
  const exportJSON = () => download(`financas-${todayISO()}.json`, JSON.stringify({ version: 2, transactions: txs, categories }, null, 2), 'application/json');
  const exportPDF = () => window.print();
  const shareWhatsApp = () => window.open(`https://wa.me/?text=${encodeURIComponent(reportText)}`, '_blank', 'noopener,noreferrer');
  const shareEmail = () => {
    const subject = `Resumo financeiro — ${monthLabel(month)}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(reportText)}`;
  };
  const exportCSV = () => {
    const rows = [['Data', 'Tipo', 'Descrição', 'Categoria', 'Valor', 'Pago', 'Fixo'], ...monthTxs.map((t) => [t.date, t.type, `"${t.description.replace(/"/g, '""')}"`, t.category, String(t.amount).replace('.', ','), t.paid ? 'sim' : 'não', t.fixed ? 'sim' : 'não'])];
    download(`financas-${month}.csv`, '\ufeff' + rows.map((r) => r.join(';')).join('\n'), 'text/csv');
  };
  const importJSON = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (txs.length && !window.confirm('Importar este backup substituirá os dados salvos neste dispositivo. Deseja continuar?')) {
      setMsg('Importação cancelada. Seus dados foram mantidos.');
      e.target.value = '';
      return;
    }
    file.text().then((txt) => {
      try {
        const backup = JSON.parse(txt);
        const data = Array.isArray(backup) ? backup : backup?.transactions;
        const valid = Array.isArray(data) && data.every(isValidTransaction);
        if (!valid) throw new Error('invalid backup');
        setTxs(normalizeTransactions(data));
        if (!Array.isArray(backup) && backup.categories) setCategories(normalizeCategories(backup.categories));
        setMsg('Backup importado.');
      } catch { setMsg('Este arquivo não parece ser um backup válido. Seus dados atuais foram mantidos.'); }
    }).catch(() => setMsg('Não foi possível ler o arquivo. Seus dados atuais foram mantidos.'));
    e.target.value = '';
  };

  if (!supabaseConfigured) return <main className="flex min-h-screen items-center justify-center bg-paper px-4"><section className="panel max-w-lg p-6"><h1 className="text-xl font-semibold">Configure o Supabase</h1><p className="mt-2 text-sm text-mute">Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no arquivo .env.local e na Vercel.</p></section></main>;
  if (!ready) return <main className="flex min-h-screen items-center justify-center bg-paper text-sm text-mute">Carregando sua conta…</main>;
  if (!user) return <AuthForm />;
  const blank = { type: 'despesa', description: '', amount: '', date: month === todayISO().slice(0, 7) ? todayISO() : `${month}-01`, category: categories.despesa[0] || CATS.despesa[0], paid: true, fixed: false };
  const blankIncome = { ...blank, type: 'receita', category: categories.receita[0] || CATS.receita[0] };
  const [monthName, monthYear] = monthLabel(month).split(' de ');

  return (
    <main className="mx-auto max-w-7xl px-4 pb-28 pt-5 sm:px-7 sm:pt-8 lg:px-10">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 sm:mb-7 sm:flex-nowrap sm:gap-4">
        <div className="order-1 flex min-h-12 min-w-0 shrink items-center justify-start pl-1 sm:order-1 sm:shrink-0 sm:pl-0">
          <img src="/logo-meus-gastos.png" alt="Meus gastos" className="h-11 w-24 object-contain sm:h-16 sm:w-36" />
        </div>
        <button type="button" onClick={() => supabase.auth.signOut()} aria-label="Sair da conta" title="Sair" className="order-2 ml-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-black transition-colors hover:bg-black/5 sm:order-3"><LogOut className="h-5 w-5" aria-hidden="true" /></button>
        <div className="order-3 flex min-w-0 basis-full items-center justify-end gap-1.5 sm:order-2 sm:ml-auto sm:basis-auto sm:gap-3">
          <div className="flex min-w-0 shrink items-center gap-0.5 rounded-xl border border-line bg-card p-1 sm:shrink-0 sm:gap-2 sm:rounded-lg">
            <button onClick={() => setMonth(shiftMonth(month, -1))} className="flex h-9 w-8 shrink-0 items-center justify-center rounded-lg text-mute transition-colors hover:bg-paper hover:text-ink sm:w-9" aria-label="Mês anterior"><ArrowLeft className="h-4 w-4" /></button>
            <label className="relative flex min-w-0 flex-1 flex-col items-center justify-center px-1 text-center sm:hidden"><span className="pointer-events-none max-w-full truncate text-xs font-semibold leading-4 capitalize">{monthName}</span><span className="pointer-events-none text-[10px] font-medium leading-3 text-mute">{monthYear}</span><input type="month" value={month} onChange={(event) => event.target.value && setMonth(event.target.value)} aria-label="Escolher mês" className="absolute inset-0 h-full w-full cursor-pointer opacity-0" /></label>
            <h1 className="hidden min-w-40 px-2 text-center text-sm font-semibold capitalize sm:block">{monthLabel(month)}</h1>
            <button onClick={() => setMonth(shiftMonth(month, 1))} className="flex h-9 w-8 shrink-0 items-center justify-center rounded-lg text-mute transition-colors hover:bg-paper hover:text-ink sm:w-9" aria-label="Próximo mês"><ArrowRight className="h-4 w-4" /></button>
          </div>
          <button onClick={() => setEditing(blank)} className="hidden items-center gap-2 rounded-lg bg-ink px-4 py-3 text-sm font-medium text-white hover:bg-zinc-800 sm:flex"><Plus className="h-4 w-4" /> Novo lançamento</button>
        </div>
      </header>

      <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]" aria-label="Resumo do mês">
        <article className="relative isolate col-span-2 flex min-h-40 flex-col justify-between overflow-hidden rounded-xl border border-zinc-800 bg-[#09090B] p-5 text-white shadow-panel sm:min-h-44 sm:p-6 lg:col-span-1 lg:min-h-[304px]">
          <svg className="pointer-events-none absolute inset-0 -z-10 h-full w-full opacity-20" viewBox="0 0 600 240" preserveAspectRatio="none" aria-hidden="true"><g fill="none" stroke="#A1A1AA" strokeWidth="1"><circle cx="510" cy="20" r="110" /><circle cx="510" cy="20" r="140" strokeOpacity=".55" /><path d="M0 190h160l34-34 28 28 56-56 34 34 54-54h72" strokeOpacity=".45" /><path d="M450 240v-36l26-26 24 24 44-44 56 56" strokeOpacity=".35" /></g></svg>
          <div className="flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3"><p className="text-xs font-medium text-zinc-300 sm:text-sm">Saldo do mês</p><span className="rounded-md border border-white/10 bg-white/[0.06] px-1.5 py-0.5 text-[9px] font-medium text-zinc-300 sm:px-2.5 sm:py-1 sm:text-xs">{monthLabel(month)}</span></div>
          <div className="min-w-0"><p className="num truncate whitespace-nowrap font-display text-[clamp(1rem,5vw,1.5rem)] font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">{brl(saldo)}</p><p className="mt-2 text-xs text-zinc-400">{saldo < 0 ? 'Seu mês está no vermelho' : 'Seu mês está no azul'}</p></div>
        </article>
        <div className="col-span-2 grid grid-cols-2 gap-3 sm:gap-4 lg:col-span-1 lg:grid-cols-2">
        {[
          { label: 'Receitas', value: receitas, color: '#047857', Icon: ArrowUpRight },
          { label: 'Despesas', value: despesas, color: '#B45359', Icon: ArrowDownRight },
          { label: 'A pagar', value: aPagar, color: '#A16207', Icon: Clock3 },
          { label: 'A receber', value: aReceber, color: '#047857', Icon: Clock3 },
        ].map((item) => <article key={item.label} className={`panel flex min-h-28 items-center gap-3 p-4 sm:min-h-36 sm:gap-4 sm:p-6 ${['A pagar', 'A receber'].includes(item.label) ? 'col-span-1 sm:col-span-1 lg:col-span-1' : ''}`}>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-paper sm:h-10 sm:w-10" style={{ color: item.color }} aria-hidden="true"><item.Icon className="h-[18px] w-[18px]" strokeWidth={1.8} /></span>
          <div className="min-w-0"><p className="text-xs text-mute sm:text-sm">{item.label}</p><p className="num mt-1 truncate text-base font-semibold tracking-tight sm:text-2xl" style={{ color: item.color }}>{brl(item.value)}</p></div>
        </article>)}
        </div>
      </section>
      <div className="grid items-start gap-5">
        <section className="panel min-w-0 p-4 sm:p-6" aria-label="Lançamentos">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3"><div><p className="eyebrow">Movimentações</p><h2 className="mt-1 font-display text-xl font-semibold tracking-tight">Lançamentos</h2></div><span className="rounded-md bg-paper px-2.5 py-1 text-xs font-medium text-mute">{list.length} {list.length === 1 ? 'item' : 'itens'}</span></div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-1 overflow-x-auto rounded-lg bg-paper p-1">
                {FILTERS.map(([k, l]) => <button key={k} onClick={() => setFilter(k)} className={`whitespace-nowrap rounded-md px-3 py-2 text-xs font-medium transition-colors ${filter === k ? 'bg-white text-ink shadow-sm ring-1 ring-black/[0.04]' : 'text-mute hover:text-ink'}`}>{l}</button>)}
              </div>
              <label className="flex w-full min-w-0 items-center gap-3 rounded-lg border border-line bg-white px-3 py-2.5 transition-colors focus-within:border-violet focus-within:ring-2 focus-within:ring-violet/10 sm:w-64 sm:shrink-0"><span className="sr-only">Buscar lançamentos</span><Search className="h-4 w-4 shrink-0 text-mute" aria-hidden="true" /><input className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm text-ink outline-none placeholder:text-mute/70 focus:outline-none focus:ring-0" placeholder="Buscar lançamento..." value={query} onChange={(e) => setQuery(e.target.value)} /></label>
            </div>
          </div>

          {list.length === 0 ? <div className="mt-5 rounded-lg border border-dashed border-line px-5 py-12 text-center"><span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-paper text-mute"><ListFilter className="h-5 w-5" aria-hidden="true" /></span><p className="mt-3 font-semibold tracking-tight">{monthTxs.length ? 'Nenhum resultado' : 'Comece registrando seu mês'}</p><p className="mt-1 text-sm text-mute">{monthTxs.length ? 'Tente ajustar a busca ou os filtros.' : `Adicione um lançamento para acompanhar ${monthLabel(month)}.`}</p><button onClick={() => setEditing(blank)} className="mt-4 rounded-lg bg-ink px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800">Novo lançamento</button></div> : (
            <ul className="mt-5 divide-y divide-line/80">
              {list.map((t) => <li key={t.id} className="group flex items-center gap-2 py-3.5 first:pt-1 last:pb-1 sm:gap-3">
                <button onClick={() => togglePaid(t.id)} aria-label={t.paid ? 'Marcar como pendente' : 'Marcar como pago'} aria-pressed={t.paid} className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition ${t.paid ? 'border-zinc-700 bg-zinc-700 text-white' : 'border-line text-transparent hover:border-violet'}`}><Check className="h-4 w-4" /></button>
                <button onClick={() => setEditing(t)} aria-label={`Editar ${t.description}`} title="Editar lançamento" className={`flex min-w-0 flex-1 items-center gap-2 text-left sm:gap-3 ${t.type === 'receita' ? 'text-receita' : 'text-despesa'}`}>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-paper">{(() => { const CategoryIcon = CATEGORY_ICONS[t.category] || CircleDollarSign; return <CategoryIcon className="h-[18px] w-[18px]" strokeWidth={1.8} aria-hidden="true" />; })()}</span>
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{t.description || 'Sem descrição'}</span><span className="mt-1 block truncate text-xs text-mute">{shortDate(t.date)} <span className="px-0.5">·</span> {t.category}{t.fixed ? ' · Fixo' : ''}{t.paid ? '' : t.type === 'despesa' ? ' · A pagar' : ' · A receber'}</span></span>
                  <span className={`num whitespace-nowrap text-xs font-semibold sm:text-base ${t.type === 'receita' ? 'text-receita' : 'text-despesa'}`}>{t.type === 'receita' ? '+' : '−'} {brl(t.amount)}</span>
                  <PencilLine className="h-4 w-4 shrink-0 text-mute" aria-hidden="true" />
                </button>
                <button type="button" onClick={() => remove(t.id)} aria-label={`Excluir ${t.description}`} title="Excluir lançamento" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-mute transition-colors hover:bg-rose-50 hover:text-despesa"><Trash2 className="h-4 w-4" /></button>
              </li>)}
            </ul>
          )}
        </section>

        <aside className="space-y-5">
          <div className="space-y-5 lg:grid lg:grid-cols-2 lg:gap-5 lg:space-y-0">
            <CategorySummary title="Despesas" entries={categorySummaries.expenses} total={expenseTotal} chartType={expenseChartType} onChartTypeChange={setExpenseChartType} />
            <CategorySummary title="Receitas" entries={categorySummaries.income} total={incomeTotal} chartType={incomeChartType} onChartTypeChange={setIncomeChartType} />
          </div>

          <section className="panel p-5 sm:p-6" aria-label="Organização">
            <div>
              <p className="eyebrow">Organização</p><h2 className="mt-1 font-display text-lg font-semibold tracking-tight">Exportar e compartilhar</h2>
              <div className="mt-4 space-y-2">
                <button onClick={exportPDF} className="flex min-h-14 w-full items-center gap-3 rounded-lg border border-line bg-white px-3.5 py-2.5 text-left transition-colors hover:bg-paper"><span className="flex h-9 w-9 items-center justify-center rounded-md bg-paper text-ink"><FileDown className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="block text-sm font-medium text-ink">Baixar PDF</span><span className="mt-0.5 block text-xs text-mute">Resumo, gráficos e lançamentos</span></span><ArrowRight className="h-4 w-4 text-mute" /></button>
                <button onClick={shareWhatsApp} className="flex min-h-14 w-full items-center gap-3 rounded-lg border border-line bg-white px-3.5 py-2.5 text-left transition-colors hover:bg-paper"><span className="flex h-9 w-9 items-center justify-center rounded-md bg-paper text-ink"><MessageCircle className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="block text-sm font-medium text-ink">Via WhatsApp</span><span className="mt-0.5 block text-xs text-mute">Compartilhar resumo do mês</span></span><ArrowRight className="h-4 w-4 text-mute" /></button>
                <button onClick={shareEmail} className="flex min-h-14 w-full items-center gap-3 rounded-lg border border-line bg-white px-3.5 py-2.5 text-left transition-colors hover:bg-paper"><span className="flex h-9 w-9 items-center justify-center rounded-md bg-paper text-ink"><Mail className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="block text-sm font-medium text-ink">Via e-mail</span><span className="mt-0.5 block text-xs text-mute">Abrir mensagem com o resumo</span></span><ArrowRight className="h-4 w-4 text-mute" /></button>
              </div>
              <div className="my-4 border-t border-line" />
              <p className="text-xs font-medium text-mute">Outras opções</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button onClick={copyFixed} className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-line px-3 py-2 text-xs font-medium text-ink transition-colors hover:bg-paper"><Repeat2 className="h-4 w-4 text-mute" aria-hidden="true" /> Copiar fixos</button>
                <button onClick={exportCSV} className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-line px-3 py-2 text-xs font-medium text-ink transition-colors hover:bg-paper"><Download className="h-4 w-4 text-mute" aria-hidden="true" /> Exportar CSV</button>
                <button onClick={exportJSON} className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-line px-3 py-2 text-xs font-medium text-ink transition-colors hover:bg-paper"><Download className="h-4 w-4 text-mute" aria-hidden="true" /> Backup</button>
                <button onClick={() => fileRef.current?.click()} className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-line px-3 py-2 text-xs font-medium text-ink transition-colors hover:bg-paper"><Upload className="h-4 w-4 text-mute" aria-hidden="true" /> Importar</button>
                <input ref={fileRef} type="file" accept="application/json" onChange={importJSON} className="hidden" />
              </div>
              {msg && <p className="mt-3 rounded-lg bg-paper px-3 py-2 text-xs font-medium text-mute" role="status">{msg}</p>}
            </div>
          </section>
        </aside>
      </div>
      <div className="fixed bottom-5 right-5 z-20 sm:hidden">
        {addMenuOpen && <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/25 p-4 backdrop-blur-[1px] sm:items-center" onClick={() => setAddMenuOpen(false)}>
          <section role="dialog" aria-modal="true" aria-labelledby="add-transaction-title" onClick={(event) => event.stopPropagation()} className="w-full max-w-sm rounded-2xl border border-line bg-card p-5 shadow-panel">
            <div className="mb-4 flex items-start justify-between"><div><p className="eyebrow">Novo lançamento</p><h2 id="add-transaction-title" className="mt-1 text-lg font-semibold tracking-tight">O que você quer adicionar?</h2></div><button onClick={() => setAddMenuOpen(false)} aria-label="Fechar" className="flex h-9 w-9 items-center justify-center rounded-lg text-mute hover:bg-paper"><X className="h-4 w-4" /></button></div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => { setEditing(blankIncome); setAddMenuOpen(false); }} className="flex min-h-20 flex-col items-start justify-center gap-2 rounded-xl border border-line p-3 text-left transition-colors hover:bg-paper"><span className="flex items-center gap-2 text-sm font-semibold text-ink"><ArrowUpRight className="h-4 w-4 text-receita" /> Receita</span><span className="text-xs text-mute">Dinheiro que entra</span></button>
              <button onClick={() => { setEditing(blank); setAddMenuOpen(false); }} className="flex min-h-20 flex-col items-start justify-center gap-2 rounded-xl border border-line p-3 text-left transition-colors hover:bg-paper"><span className="flex items-center gap-2 text-sm font-semibold text-ink"><ArrowDownRight className="h-4 w-4 text-despesa" /> Despesa</span><span className="text-xs text-mute">Dinheiro que sai</span></button>
            </div>
          </section>
        </div>}
        <button onClick={() => setAddMenuOpen((open) => !open)} aria-label={addMenuOpen ? 'Fechar opções de lançamento' : 'Adicionar lançamento'} aria-expanded={addMenuOpen} aria-haspopup="menu" className="ml-auto flex h-14 w-14 items-center justify-center rounded-xl bg-ink text-white shadow-panel transition-colors hover:bg-zinc-800"><Plus className={`h-6 w-6 transition-transform ${addMenuOpen ? 'rotate-45' : ''}`} /></button>
      </div>
      {editing && <TransactionForm initial={editing} categories={categories} categoryUsage={categoryUsage} onAddCategory={addCategory} onDeleteCategory={deleteCategory} onRenameCategory={renameCategory} onSave={save} onDelete={remove} onClose={() => setEditing(null)} />}
      <section id="print-report" className="hidden" aria-label="Relatório financeiro para impressão">
        <div className="report-page">
          <header className="report-header"><img src="/logo-meus-gastos.png" alt="Meus Gastos" /><div><p>Controle financeiro pessoal</p><strong>{monthLabel(month)}</strong></div></header>
          <h1>Relatório financeiro</h1>
          <div className="report-summary"><div><span>Saldo do mês</span><strong>{brl(saldo)}</strong></div><div><span>Receitas</span><strong>{brl(receitas)}</strong></div><div><span>Despesas</span><strong>{brl(despesas)}</strong></div><div><span>A pagar</span><strong>{brl(aPagar)}</strong></div></div>
          <div className="report-charts"><PrintCategoryChart title="Despesas por categoria" entries={categorySummaries.expenses} total={expenseTotal} /><PrintCategoryChart title="Receitas por categoria" entries={categorySummaries.income} total={incomeTotal} /></div>
          <section className="report-transactions"><h2>Lançamentos do mês <span>({monthTxs.length})</span></h2><table><thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Tipo</th><th>Status</th><th>Valor</th></tr></thead><tbody>{[...monthTxs].sort((a, b) => a.date.localeCompare(b.date)).map((t) => <tr key={t.id}><td>{shortDate(t.date)}</td><td>{t.description}</td><td>{t.category}</td><td>{t.type === 'receita' ? 'Receita' : 'Despesa'}</td><td>{t.paid ? (t.type === 'receita' ? 'Recebido' : 'Pago') : (t.type === 'receita' ? 'A receber' : 'Pendente')}</td><td>{brl(t.amount)}</td></tr>)}</tbody></table></section>
          <footer>Relatório gerado em {new Date().toLocaleDateString('pt-BR')} · Meus Gastos</footer>
        </div>
      </section>
    </main>
  );
}
