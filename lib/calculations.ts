import type {
  Asset,
  Liability,
  Income,
  Expense,
  Budget,
  BillingCycle,
  DeferredExpense,
  Card,
  BalanceSheet,
  MonthlySnapshot,
  BudgetDeviation,
  GuidanceNudge,
  ExpenseCategory,
  CardName,
} from './types';

// ─── Currency Formatting ──────────────────────────────────────────────────────

export function formatINR(amount: number): string {
  const abs = Math.abs(amount);
  let formatted: string;
  if (abs >= 10_00_000) {
    formatted = (abs / 10_00_000).toFixed(2) + 'L';
  } else if (abs >= 1_000) {
    formatted = (abs / 1_000).toFixed(1) + 'K';
  } else {
    formatted = abs.toFixed(0);
  }
  return (amount < 0 ? '-' : '') + '₹' + formatted;
}

export function formatINRFull(amount: number): string {
  return '₹' + Math.abs(amount).toLocaleString('en-IN');
}

// ─── Date Helpers ─────────────────────────────────────────────────────────────

export function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function monthLabel(ym: string): string {
  const [y, m] = ym.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[parseInt(m) - 1]} ${y}`;
}

export function isoDate(date: Date = new Date()): string {
  return date.toISOString().split('T')[0];
}

export function dayOfMonth(isoDate: string): number {
  return new Date(isoDate).getDate();
}

// ─── Billing Cycle Assignment ─────────────────────────────────────────────────

export function assignExpenseToCycle(
  expenseDate: string,
  card: Card,
  cycles: BillingCycle[]
): string | undefined {
  const day = new Date(expenseDate).getDate();
  // If before cut date → current cycle; on/after cut date → next cycle
  const isCurrentCycle = day < card.cutDate;

  const openCycles = cycles
    .filter(c => c.cardId === card.id && c.status === 'open')
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  if (isCurrentCycle) {
    return openCycles[0]?.id;
  } else {
    return openCycles[1]?.id ?? openCycles[0]?.id;
  }
}

// ─── Balance Sheet ────────────────────────────────────────────────────────────

export function calculateBalanceSheet(
  assets: Asset[],
  liabilities: Liability[]
): BalanceSheet {
  const totalAssets = assets.reduce((sum, a) => sum + a.value, 0);
  const shortTermLiabilities = liabilities
    .filter(l => l.type === 'short-term')
    .reduce((sum, l) => sum + l.principalRemaining, 0);
  const longTermLiabilities = liabilities
    .filter(l => l.type === 'long-term')
    .reduce((sum, l) => sum + l.principalRemaining, 0);

  return {
    totalAssets,
    shortTermLiabilities,
    longTermLiabilities,
    netWorth: totalAssets - shortTermLiabilities - longTermLiabilities,
    liquidPosition: totalAssets - shortTermLiabilities,
  };
}

// ─── Monthly Snapshot ─────────────────────────────────────────────────────────

export function calculateMonthlySnapshot(
  month: string,
  incomes: Income[],
  expenses: Expense[],
  liabilities: Liability[],
  billingCycles: BillingCycle[],
  deferredExpenses: DeferredExpense[]
): MonthlySnapshot {
  const monthIncomes = incomes.filter(i => i.month === month);
  const totalIncome = monthIncomes.reduce((sum, i) => sum + i.amount, 0);

  const fixedObligations = liabilities.reduce((sum, l) => sum + l.emiAmount, 0);

  const monthExpenses = expenses.filter(
    e => e.month === month && e.expenseType !== 'deferred-bonus'
  );
  const variableSpend = monthExpenses
    .filter(e => e.category !== 'fixed')
    .reduce((sum, e) => sum + e.amount, 0);

  const surplus = totalIncome - fixedObligations - variableSpend;
  const savingsRate = totalIncome > 0 ? (surplus / totalIncome) * 100 : 0;

  // Rolled-over card balances
  const rolledCycles = billingCycles.filter(
    c => c.status === 'rolled' || c.paymentResolution === 'rolled'
  );
  const debtPosition = rolledCycles.reduce((sum, c) => {
    const paid = c.amountPaid ?? 0;
    return sum + (c.totalSpend - paid);
  }, 0);

  const deferredAmount = deferredExpenses
    .filter(d => d.targetBonusMonth === month)
    .reduce((sum, d) => sum + d.amount, 0);

  return {
    month,
    totalIncome,
    fixedObligations,
    variableSpend,
    surplus,
    savingsRate,
    debtPosition,
    deferredAmount,
  };
}

// ─── Paying Capacity ──────────────────────────────────────────────────────────

export function calculatePayingCapacity(
  totalIncome: number,
  liabilities: Liability[],
  variableExpenses: Expense[]
) {
  const fixedObligations = liabilities.reduce((sum, l) => sum + l.emiAmount, 0);
  const availableForVariable = totalIncome - fixedObligations;
  const currentVariableCommitted = variableExpenses
    .filter(e => e.expenseType !== 'deferred-bonus' && e.category !== 'fixed')
    .reduce((sum, e) => sum + e.amount, 0);
  const buffer = availableForVariable - currentVariableCommitted;

  return {
    totalIncome,
    fixedObligations,
    availableForVariable,
    currentVariableCommitted,
    buffer,
    isBreached: currentVariableCommitted > availableForVariable,
  };
}

// ─── Budget Deviations ────────────────────────────────────────────────────────

export function calculateBudgetDeviations(
  month: string,
  expenses: Expense[],
  budgets: Budget[]
): BudgetDeviation[] {
  const monthBudgets = budgets.filter(b => b.month === month);
  const monthExpenses = expenses.filter(
    e => e.month === month && e.expenseType !== 'deferred-bonus'
  );

  return monthBudgets.map(b => {
    const actual = monthExpenses
      .filter(e => e.category === b.category)
      .reduce((sum, e) => sum + e.amount, 0);
    const pct = b.budgetAmount > 0 ? (actual / b.budgetAmount) * 100 : 0;

    return {
      category: b.category,
      budget: b.budgetAmount,
      actual,
      percentage: pct,
      status: pct >= 100 ? 'exceeded' : pct >= 75 ? 'warning' : 'ok',
    };
  });
}

// ─── Guidance Nudges ──────────────────────────────────────────────────────────

export function generateGuidanceNudges(
  snapshot: MonthlySnapshot,
  deviations: BudgetDeviation[],
  billingCycles: BillingCycle[],
  deferredExpenses: DeferredExpense[],
  bonusIncome?: number
): GuidanceNudge[] {
  const nudges: GuidanceNudge[] = [];

  // Budget exceeded
  for (const d of deviations) {
    if (d.status === 'exceeded') {
      nudges.push({
        type: 'budget-exceeded',
        message: `You are ${formatINR(d.actual - d.budget)} over budget in ${categoryLabel(d.category)}. Consider shifting expenses to next cycle.`,
        severity: 'danger',
      });
    } else if (d.status === 'warning') {
      nudges.push({
        type: 'budget-exceeded',
        message: `${categoryLabel(d.category)} is at ${d.percentage.toFixed(0)}% of budget. Pace yourself.`,
        severity: 'warning',
      });
    }
  }

  // Paying capacity breach
  if (snapshot.surplus < 0) {
    nudges.push({
      type: 'capacity-breach',
      message: `Your committed spend exceeds available income by ${formatINR(Math.abs(snapshot.surplus))}. Flag which expenses can shift to bonus month.`,
      severity: 'danger',
    });
  }

  // Card-to-card payments
  const cardToCard = billingCycles.filter(
    c => c.paymentResolution === 'card-to-card'
  );
  if (cardToCard.length > 0) {
    nudges.push({
      type: 'card-to-card',
      message: `Paying one credit card from another does not clear your debt — it shifts it. Total outstanding remains.`,
      severity: 'danger',
    });
  }

  // Deferred obligations
  if (snapshot.deferredAmount > 0 && bonusIncome !== undefined) {
    const diff = bonusIncome - snapshot.deferredAmount;
    nudges.push({
      type: 'deferred-high',
      message:
        diff < 0
          ? `You have ${formatINR(snapshot.deferredAmount)} deferred to bonus month. You are ${formatINR(Math.abs(diff))} over expected bonus.`
          : `You have ${formatINR(snapshot.deferredAmount)} deferred to bonus month. Expected bonus covers this with ${formatINR(diff)} to spare.`,
      severity: diff < 0 ? 'danger' : 'info',
    });
  }

  // Surplus
  if (snapshot.surplus > 5000) {
    nudges.push({
      type: 'surplus',
      message: `You have ${formatINR(snapshot.surplus)} surplus this month. Consider allocating to savings, home loan prepayment, or investments.`,
      severity: 'info',
    });
  }

  // Rolling debt
  const rolledCount = billingCycles.filter(
    c => c.paymentResolution === 'rolled'
  ).length;
  if (rolledCount > 0) {
    nudges.push({
      type: 'debt-accumulating',
      message: `You have rolled over ${rolledCount} billing cycle(s). Running debt is accumulating — prioritise clearing it.`,
      severity: 'warning',
    });
  }

  return nudges;
}

// ─── Category Helpers ─────────────────────────────────────────────────────────

export function categoryLabel(cat: ExpenseCategory): string {
  const labels: Record<ExpenseCategory, string> = {
    groceries: 'Groceries',
    dining: 'Dining Out',
    shopping: 'Shopping',
    entertainment: 'Entertainment',
    travel: 'Travel',
    medical: 'Medical',
    fixed: 'Fixed',
    'one-time': 'One-time',
    other: 'Other',
  };
  return labels[cat] ?? cat;
}

export const CARD_CONFIGS: Record<CardName, { cutDate: number; billDate: number; network: string; color: string }> = {
  ICICI:  { cutDate: 11, billDate: 29, network: 'Visa/MC',  color: '#F7941D' },
  HDFC:   { cutDate: 24, billDate: 12, network: 'Visa/MC',  color: '#004C8F' },
  Scapia: { cutDate: 14, billDate: 2,  network: 'Rupay',    color: '#7C4DFF' },
  SBI:    { cutDate: 3,  billDate: 23, network: 'Visa/MC',  color: '#1565C0' },
  IDFC:   { cutDate: 18, billDate: 4,  network: 'Visa/MC',  color: '#00897B' },
};
