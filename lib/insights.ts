import type {
  Income,
  Expense,
  Liability,
  BillingCycle,
  Card,
  Budget,
  AppSettings,
  ExpenseCategory,
} from './types';
import { formatINR, categoryLabel, monthLabel } from './calculations';

// ─── On-device intelligent engine ─────────────────────────────────────────────
// No API key, no network. Studies spending trends, category patterns, savings
// rate and bonus position, then emits personalised, evolving guidance.

export interface Insight {
  id: string;
  title: string;
  detail: string;
  severity: 'good' | 'info' | 'warning' | 'danger';
}

const QUARTER_END_MONTHS = [2, 5, 8, 11]; // 0-indexed Mar, Jun, Sep, Dec

function ym(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return ym(d);
}

function recentMonths(from: string, count: number): string[] {
  const out: string[] = [];
  for (let i = 1; i <= count; i++) out.push(shiftMonth(from, -i));
  return out;
}

// Upcoming bonus payout month given the configurable cycle offset.
export function nextBonusMonth(settings: AppSettings, ref: Date = new Date()): string {
  const offset = settings.bonusPayoutOffsetMonths;
  // Find the next quarter-end month on/after the reference month, then add offset.
  for (let i = 0; i < 16; i++) {
    const cand = new Date(ref.getFullYear(), ref.getMonth() + i, 1);
    if (QUARTER_END_MONTHS.includes(cand.getMonth())) {
      const payout = new Date(cand.getFullYear(), cand.getMonth() + offset, 1);
      if (payout >= new Date(ref.getFullYear(), ref.getMonth(), 1)) {
        return ym(payout);
      }
    }
  }
  return ym(ref);
}

function sumByCategory(expenses: Expense[], month: string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const e of expenses) {
    if (e.month !== month || e.expenseType === 'deferred-bonus' || e.category === 'fixed') continue;
    out[e.category] = (out[e.category] ?? 0) + e.amount;
  }
  return out;
}

function totalVariable(expenses: Expense[], month: string): number {
  return expenses
    .filter(e => e.month === month && e.expenseType !== 'deferred-bonus' && e.category !== 'fixed')
    .reduce((sum, e) => sum + e.amount, 0);
}

function monthIncome(incomes: Income[], month: string): number {
  return incomes.filter(i => i.month === month).reduce((sum, i) => sum + i.amount, 0);
}

function savingsRate(
  incomes: Income[],
  expenses: Expense[],
  liabilities: Liability[],
  month: string
): number | null {
  const income = monthIncome(incomes, month);
  if (income <= 0) return null;
  const fixed = liabilities.reduce((sum, l) => sum + l.emiAmount, 0);
  const variable = totalVariable(expenses, month);
  return ((income - fixed - variable) / income) * 100;
}

export function generateInsights(args: {
  month: string;
  incomes: Income[];
  expenses: Expense[];
  liabilities: Liability[];
  billingCycles: BillingCycle[];
  cards: Card[];
  budgets: Budget[];
  settings: AppSettings;
}): Insight[] {
  const { month, incomes, expenses, liabilities, billingCycles, cards, budgets, settings } = args;
  const insights: Insight[] = [];
  const prevMonths = recentMonths(month, 3);

  // ── Fixed commitments coverage ──────────────────────────────────────────────
  const income = monthIncome(incomes, month);
  const fixedBudgets = budgets.filter(b => b.month === month && b.kind === 'fixed');
  // Prefer planned fixed commitments; fall back to liability EMIs if none planned.
  const totalFixed = fixedBudgets.length > 0
    ? fixedBudgets.reduce((s, b) => s + b.budgetAmount, 0)
    : liabilities.reduce((s, l) => s + l.emiAmount, 0);
  if (income > 0 && totalFixed > 0) {
    const afterFixed = income - totalFixed;
    const variableSpent = totalVariable(expenses, month);
    if (afterFixed < 0) {
      insights.push({
        id: 'fixed-over',
        title: 'Fixed commitments exceed income',
        detail: `EMI/SIP/rent total ${formatINR(totalFixed)} vs ${formatINR(income)} income. Restructure a commitment — there's nothing left for variable spend.`,
        severity: 'danger',
      });
    } else {
      const usedPct = afterFixed > 0 ? (variableSpent / afterFixed) * 100 : 0;
      if (usedPct >= 90) {
        insights.push({
          id: 'fixed-tight',
          title: 'Variable spend eating into buffer',
          detail: `Fixed commitments (${formatINR(totalFixed)}) are covered, but you've used ${usedPct.toFixed(0)}% of the ${formatINR(afterFixed)} left. Ease off discretionary categories.`,
          severity: usedPct >= 100 ? 'danger' : 'warning',
        });
      } else {
        insights.push({
          id: 'fixed-covered',
          title: 'Fixed commitments fully covered',
          detail: `${formatINR(totalFixed)} of EMI/SIP/rent met from income — ${formatINR(afterFixed - variableSpent)} of your ${formatINR(afterFixed)} variable headroom still free. Keep discretionary spend lean to bank it.`,
          severity: 'good',
        });
      }
    }
  }

  // ── Category trend vs trailing 3-month average ──────────────────────────────
  const current = sumByCategory(expenses, month);
  const categories = Object.keys(current) as ExpenseCategory[];
  for (const cat of categories) {
    const history = prevMonths
      .map(m => sumByCategory(expenses, m)[cat] ?? 0)
      .filter(v => v > 0);
    if (history.length === 0) continue;
    const avg = history.reduce((a, b) => a + b, 0) / history.length;
    if (avg <= 0) continue;
    const pct = (current[cat] / avg) * 100;
    if (pct >= 130) {
      const trim = current[cat] - avg;
      insights.push({
        id: `cat-${cat}`,
        title: `${categoryLabel(cat)} is ${pct.toFixed(0)}% of 3-mo avg`,
        detail: `Running hot vs your usual ${formatINR(avg)}. Trim ~${formatINR(trim)} to get back on pace.`,
        severity: pct >= 160 ? 'danger' : 'warning',
      });
    } else if (pct <= 60) {
      insights.push({
        id: `cat-${cat}`,
        title: `${categoryLabel(cat)} down to ${pct.toFixed(0)}% of avg`,
        detail: `You're spending ${formatINR(avg - current[cat])} less than usual here. Nice restraint.`,
        severity: 'good',
      });
    }
  }

  // ── Savings rate trend ──────────────────────────────────────────────────────
  const srNow = savingsRate(incomes, expenses, liabilities, month);
  const srPrev = savingsRate(incomes, expenses, liabilities, shiftMonth(month, -1));
  if (srNow !== null && srPrev !== null) {
    const delta = srNow - srPrev;
    if (delta <= -5) {
      const income = monthIncome(incomes, month);
      const surplus = (srNow / 100) * income;
      insights.push({
        id: 'savings-drop',
        title: `Savings rate slipped ${srPrev.toFixed(0)}% → ${srNow.toFixed(0)}%`,
        detail:
          surplus > 0
            ? `Still ${formatINR(surplus)} surplus — sweep it into an MF SIP before it leaks into spending.`
            : `You're now spending more than you earn this month. Pause discretionary spend.`,
        severity: srNow < 0 ? 'danger' : 'warning',
      });
    } else if (delta >= 5) {
      insights.push({
        id: 'savings-up',
        title: `Savings rate up ${srPrev.toFixed(0)}% → ${srNow.toFixed(0)}%`,
        detail: `Momentum is good. Lock the extra in — automate a transfer so it doesn't get spent.`,
        severity: 'good',
      });
    }
  } else if (srNow !== null && srNow < 0) {
    insights.push({
      id: 'savings-negative',
      title: `Spending exceeds income`,
      detail: `Variable + EMIs are above your income this month. Defer non-essential buys.`,
      severity: 'danger',
    });
  }

  // ── Rolling card debt vs bonus position ─────────────────────────────────────
  const rolled = billingCycles.filter(
    c => c.status === 'rolled' || c.paymentResolution === 'rolled'
  );
  const byCard: Record<string, { count: number; amount: number }> = {};
  for (const c of rolled) {
    const outstanding = c.totalSpend - (c.amountPaid ?? 0);
    if (!byCard[c.cardId]) byCard[c.cardId] = { count: 0, amount: 0 };
    byCard[c.cardId].count += 1;
    byCard[c.cardId].amount += outstanding;
  }
  const bonusMonth = nextBonusMonth(settings);
  for (const [cardId, info] of Object.entries(byCard)) {
    const card = cards.find(c => c.id === cardId);
    const name = card?.name ?? 'A card';
    insights.push({
      id: `debt-${cardId}`,
      title: `${name} debt rolling ${info.count} cycle${info.count > 1 ? 's' : ''}`,
      detail: `${formatINR(info.amount)} outstanding. Clear it before your next bonus (${monthLabel(bonusMonth)}) so it doesn't compound.`,
      severity: info.count >= 2 ? 'danger' : 'warning',
    });
  }

  // ── Surplus deployment ──────────────────────────────────────────────────────
  if (srNow !== null && srNow > 20 && insights.filter(i => i.severity === 'danger').length === 0) {
    const income = monthIncome(incomes, month);
    const surplus = (srNow / 100) * income;
    insights.push({
      id: 'surplus-deploy',
      title: `Strong ${srNow.toFixed(0)}% savings rate`,
      detail: `${formatINR(surplus)} free this month. Split it: prepay home loan + top up equity SIP.`,
      severity: 'good',
    });
  }

  if (insights.length === 0) {
    insights.push({
      id: 'building',
      title: 'Learning your patterns',
      detail: 'Log a few weeks of expenses and the engine will surface trends, savings nudges and bonus-timing advice tailored to you.',
      severity: 'info',
    });
  }

  // Order: danger → warning → info → good
  const rank = { danger: 0, warning: 1, info: 2, good: 3 } as const;
  return insights.sort((a, b) => rank[a.severity] - rank[b.severity]);
}
