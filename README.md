# Minhas finanças

App pessoal (Next.js 14 + Tailwind CSS). Os dados ficam no `localStorage` do navegador — sem servidor, sem login.

## Rodar
```bash
npm install
npm run dev     # http://localhost:3000
```
Para publicar de graça: suba em um repositório e importe na Vercel (cada navegador terá seus próprios dados; use **Backup/Importar** para levar entre dispositivos).

## Recursos
- Navegação por mês, saldo, receitas, despesas e valor a pagar
- Gastos por categoria (barra proporcional)
- Lançamentos com marcar pago/recebido, editar, excluir, filtrar e buscar
- Lançamentos fixos + botão "Copiar fixos do mês anterior"
- Exportar CSV (abre no Excel) e backup/importação em JSON
