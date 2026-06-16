import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  AppState,
  Asset,
  Liability,
  Income,
  Expense,
  Budget,
  BillingCycle,
  DeferredExpense,
  PaymentResolution,
} from './types';
import { CARD_CONFIGS, isoDate, currentMonth } from './calculations';

function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function seedCards() {
  const now = new Date();
  return (Object.entries(CARD_CONFIGS) as [string, typeof CARD_CONFIGS[keyof typeof CARD_CONFIGS]][]).map(
    ([name, cfg]) => ({
      id: uid(),
      name: name as any,
      network: cfg.network,
      cutDate: cfg.cutDate,
      billDate: cfg.billDate,
      color: cfg.color,
    })
  );
}

function seedBillingCycles(cards: ReturnType<typeof seedCards>): BillingCycle[] {
  const cycles: BillingCycle[] = [];
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  for (const card of cards) {
    // Current cycle
    const cutDateThisMonth = new Date(year, month, card.cutDate);
    const billDateThisMonth = new Date(
      year,
      card.billDate < card.cutDate ? month + 1 : month,
      card.billDate
    );
    const prevMonth = new Date(year, month - 1, card.cutDate);

    cycles.push({
      id: uid(),
      cardId: card.id,
      startDate: isoDate(prevMonth),
      endDate: isoDate(cutDateThisMonth),
      billDueDate: isoDate(billDateThisMonth),
      totalSpend: 0,
      status: now > cutDateThisMonth ? 'locked' : 'open',
      paymentResolution: 'pending',
    });

    // Next cycle
    const nextCutDate = new Date(year, month + 1, card.cutDate);
    const nextBillDate = new Date(
      year,
      card.billDate < card.cutDate ? month + 2 : month + 1,
      card.billDate
    );
    cycles.push({
      id: uid(),
      cardId: card.id,
      startDate: isoDate(cutDateThisMonth),
      endDate: isoDate(nextCutDate),
      billDueDate: isoDate(nextBillDate),
      totalSpend: 0,
      status: 'open',
      paymentResolution: 'pending',
    });
  }
  return cycles;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      assets: [],
      liabilities: [],
      incomes: [],
      expenses: [],
      cards: [],
      billingCycles: [],
      budgets: [],
      deferredExpenses: [],

      // ── Assets ──────────────────────────────────────────────────────────────
      addAsset: (asset) =>
        set(s => ({ assets: [...s.assets, { ...asset, id: uid() }] })),
      updateAsset: (id, updates) =>
        set(s => ({ assets: s.assets.map(a => (a.id === id ? { ...a, ...updates } : a)) })),
      deleteAsset: (id) =>
        set(s => ({ assets: s.assets.filter(a => a.id !== id) })),

      // ── Liabilities ─────────────────────────────────────────────────────────
      addLiability: (liability) =>
        set(s => ({ liabilities: [...s.liabilities, { ...liability, id: uid() }] })),
      updateLiability: (id, updates) =>
        set(s => ({
          liabilities: s.liabilities.map(l => (l.id === id ? { ...l, ...updates } : l)),
        })),
      deleteLiability: (id) =>
        set(s => ({ liabilities: s.liabilities.filter(l => l.id !== id) })),

      // ── Income ───────────────────────────────────────────────────────────────
      addIncome: (income) =>
        set(s => ({ incomes: [...s.incomes, { ...income, id: uid() }] })),
      updateIncome: (id, updates) =>
        set(s => ({ incomes: s.incomes.map(i => (i.id === id ? { ...i, ...updates } : i)) })),

      // ── Expenses ─────────────────────────────────────────────────────────────
      addExpense: (expense) => {
        const newExpense: Expense = { ...expense, id: uid() };
        set(s => {
          // Update billing cycle total if card expense
          const card = s.cards.find(c => c.name === expense.cardId);
          let updatedCycles = s.billingCycles;
          if (card) {
            const day = new Date(expense.date).getDate();
            const targetCycle = day < card.cutDate
              ? s.billingCycles.find(c => c.cardId === card.id && c.status === 'open')
              : s.billingCycles.filter(c => c.cardId === card.id && c.status === 'open')[1]
                ?? s.billingCycles.find(c => c.cardId === card.id && c.status === 'open');
            if (targetCycle) {
              newExpense.cycleId = targetCycle.id;
              updatedCycles = s.billingCycles.map(c =>
                c.id === targetCycle.id
                  ? { ...c, totalSpend: c.totalSpend + expense.amount }
                  : c
              );
            }
          }
          return { expenses: [...s.expenses, newExpense], billingCycles: updatedCycles };
        });
      },
      updateExpense: (id, updates) =>
        set(s => ({
          expenses: s.expenses.map(e => (e.id === id ? { ...e, ...updates } : e)),
        })),
      deleteExpense: (id) =>
        set(s => ({ expenses: s.expenses.filter(e => e.id !== id) })),

      // ── Budgets ──────────────────────────────────────────────────────────────
      addBudget: (budget) =>
        set(s => ({ budgets: [...s.budgets, { ...budget, id: uid() }] })),
      updateBudget: (id, updates) =>
        set(s => ({
          budgets: s.budgets.map(b => (b.id === id ? { ...b, ...updates } : b)),
        })),

      // ── Billing Cycles ───────────────────────────────────────────────────────
      updateBillingCycle: (id, updates) =>
        set(s => ({
          billingCycles: s.billingCycles.map(c => (c.id === id ? { ...c, ...updates } : c)),
        })),
      resolveCyclePayment: (cycleId, resolution, amountPaid, paidFromCardId) =>
        set(s => ({
          billingCycles: s.billingCycles.map(c =>
            c.id === cycleId
              ? {
                  ...c,
                  paymentResolution: resolution,
                  status: resolution === 'paid-full' ? 'paid' : resolution === 'rolled' || resolution === 'card-to-card' ? 'rolled' : 'locked',
                  amountPaid,
                  paidFromCardId,
                }
              : c
          ),
        })),

      // ── Deferred Expenses ────────────────────────────────────────────────────
      addDeferredExpense: (deferred) =>
        set(s => ({
          deferredExpenses: [...s.deferredExpenses, { ...deferred, id: uid() }],
        })),
      removeDeferredExpense: (id) =>
        set(s => ({
          deferredExpenses: s.deferredExpenses.filter(d => d.id !== id),
        })),

      // ── Seed Data ────────────────────────────────────────────────────────────
      seedInitialData: () => {
        const cards = seedCards();
        const cycles = seedBillingCycles(cards);
        const month = currentMonth();

        const assets: Asset[] = [
          { id: uid(), name: 'Mutual Funds', platform: 'Groww MF', value: 450000, assetClass: 'market-linked', updatedAt: isoDate() },
          { id: uid(), name: 'Stocks & Equities', platform: 'Groww Stocks', value: 180000, assetClass: 'market-linked', updatedAt: isoDate() },
          { id: uid(), name: 'Digital Gold', platform: 'Paytm Gold', value: 35000, assetClass: 'commodity', updatedAt: isoDate() },
          { id: uid(), name: 'Fixed Deposits', platform: 'HDFC Bank', value: 200000, assetClass: 'fixed-income', updatedAt: isoDate() },
          { id: uid(), name: 'Savings Balance', platform: 'Bank Accounts', value: 85000, assetClass: 'liquid', updatedAt: isoDate() },
        ];

        const liabilities: Liability[] = [
          { id: uid(), name: 'Home Loan', type: 'long-term', principalRemaining: 3200000, emiAmount: 33000, tenureMonths: 240, startDate: '2020-04-01' },
          { id: uid(), name: 'Personal Loan', type: 'short-term', principalRemaining: 120000, emiAmount: 8500, tenureMonths: 14, startDate: '2023-04-01' },
          { id: uid(), name: 'Papa Expense', type: 'short-term', principalRemaining: 0, emiAmount: 15000, tenureMonths: 0, startDate: isoDate() },
        ];

        const incomes: Income[] = [
          { id: uid(), earner: 'Abhinav', month, amount: 120000, type: 'salary' },
          { id: uid(), earner: 'Manasvi', month, amount: 65000, type: 'salary' },
        ];

        const budgets: Budget[] = [
          { id: uid(), category: 'groceries', month, budgetAmount: 15000 },
          { id: uid(), category: 'dining', month, budgetAmount: 8000 },
          { id: uid(), category: 'shopping', month, budgetAmount: 12000 },
          { id: uid(), category: 'entertainment', month, budgetAmount: 5000 },
          { id: uid(), category: 'travel', month, budgetAmount: 10000 },
          { id: uid(), category: 'medical', month, budgetAmount: 3000 },
          { id: uid(), category: 'other', month, budgetAmount: 5000 },
        ];

        set({ assets, liabilities, incomes, expenses: [], cards, billingCycles: cycles, budgets, deferredExpenses: [] });
      },
    }),
    {
      name: 'wealth-expense-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        // After hydration: seed sample data if this is a fresh install
        if (state && state.assets.length === 0) {
          state.seedInitialData();
        }
      },
    }
  )
);
