'use client';
import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function AuthForm() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    const result = mode === 'login'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });
    setBusy(false);
    if (result.error) setMessage(result.error.message);
    else if (mode === 'signup' && !result.data.session) setMessage('Cadastro realizado. Confirme seu e-mail pelo link enviado para entrar.');
  };

  return <main className="flex min-h-screen items-center justify-center bg-paper px-4 py-10">
    <section className="panel w-full max-w-md p-6 sm:p-8">
      <img src="/logo-meus-gastos.png" alt="Meus gastos" className="mx-auto h-16 w-40 object-contain" />
      <h1 className="mt-5 text-center font-display text-2xl font-semibold">{mode === 'login' ? 'Entre na sua conta' : 'Crie sua conta'}</h1>
      <p className="mt-2 text-center text-sm text-mute">Seus dados financeiros ficam associados à sua conta.</p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <label className="block text-sm font-medium">E-mail<input className="field mt-1.5" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <label className="block text-sm font-medium">Senha<input className="field mt-1.5" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={6} required value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        {message && <p role="status" className="rounded-lg bg-paper p-3 text-sm text-mute">{message}</p>}
        <button disabled={busy} className="w-full rounded-lg bg-ink px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">{busy ? 'Aguarde…' : mode === 'login' ? 'Entrar' : 'Criar conta'}</button>
      </form>
      <button type="button" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setMessage(''); }} className="mt-4 w-full py-2 text-sm font-medium text-mute hover:text-ink">{mode === 'login' ? 'Ainda não tem conta? Cadastre-se' : 'Já tem uma conta? Entrar'}</button>
    </section>
  </main>;
}
