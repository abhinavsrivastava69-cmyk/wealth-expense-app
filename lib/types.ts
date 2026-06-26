// ─── Core Entities ───────────────────────────────────────────────────────────

export type AssetClass =
  | 'market-linked'
  | 'commodity'
  | 'fixed-income'
  | 'liquid'
  | 'custom';

export interface Asset {
  id: string;
  name: string;
  platform: string;
  value: number;
  assetClass: AssetClass;
  updatedAt: string; // ISO date
}

export type LiabilityType = 'short-term' | 'long-term';

export interface Liability {
  id: string;
  name: string;
  type: LiabilityType;
  principalRemaining: number;
  emiAmount: number;
  tenureMonths: number; // remaining tenure
  startDate: string; // ISO date
}

export type Earner = 'Abhinav' | 'Manasvi';
export type IncomeType = 'salary' | 'bonus' | 'credit';

export interface Income {
  id: string;
  earner: Earner;
  month: string; // "YYYY-MM"
  amount: number;
  type: IncomeType;
  isBonusMonth?: boolean;
  label?: string; // for credits e.g. "Gift money", "Freelance"
}

export type CardName = string;
export type PaymentMethod = CardName | 'UPI' | 'Cash';

export interface Card {
  id: string;
  name: CardName;
  network: string;
  cutDate: number;   // day of month
  billDate: number;  // day of month
  color: string;
}

// Configurable bonus payout cycle. The quarterly bonus for a quarter is paid
// `payoutOffsetMonths` after the quarter ends (e.g. AMJ quarter → Jul = offset 1).
export interface AppSettings {
  bonusPayoutOffsetMonths: number;
}

export type CycleStatus = 'open' | 'locked' | 'paid' | 'rolled';
export type PaymentResolution =
  | 'paid-full'
  | 'paid-partial'
  | 'rolled'
  | 'card-to-card'
  | 'pending';

export interface BillingCycle {
  id: string;
  cardId: string;
  startDate: string;  // ISO date
  endDate: string;    // ISO date (cut date)
  billDueDate: string; // ISO date
  totalSpend: number;
  status: CycleStatus;
  paymentResolution: PaymentResolution;
  amountPaid?: number;
  paidFromCardId?: string; // for card-to-card
}

export type ExpenseCategory =
  | 'groceries'
  | 'dining'
  | 'shopping'
  | 'entertainment'
  | 'travel'
  | 'medical'
  | 'fixed'
  | 'one-time'
  | 'other';

export type ExpenseType = 'regular' | 'surprise' | 'deferred-bonus';

export interface Expense {
  id: string;
  amount: number;
  category: ExpenseCategory;
  cardId: PaymentMethod;
  paidBy: Earner;
  date: string; // ISO date
  cycleId?: string;
  expenseType: ExpenseType;
  note?: string;
  month: string; // "YYYY-MM"
}

export interface Budget {
  id: string;
  category: ExpenseCategory;
  month: string; // "YYYY-MM"
  budgetAmount: number;
}

export interface DeferredExpense {
  id: string;
  expenseId: string;
  targetBonusMonth: string; // "YYYY-MM"
  amount: number;
}

// ─── Computed / View Types ────────────────────────────────────────────────────

export interface BalanceSheet {
  totalAssets: number;
  shortTermLiabilities: number;
  longTermLiabilities: number;
  netWorth: number;
  liquidPosition: number;
}

export interface MonthlySnapshot {
  month: string;
  totalIncome: number;
  fixedObligations: number;
  variableSpend: number;
  surplus: number;
  savingsRate: number;
  debtPosition: number;
  deferredAmount: number;
}

export interface BudgetDeviation {
  category: ExpenseCategory;
  budget: number;
  actual: number;
  percentage: number;
  status: 'ok' | 'warning' | 'exceeded';
}

export type GuidanceType =
  | 'budget-exceeded'
  | 'capacity-breach'
  | 'card-to-card'
  | 'deferred-high'
  | 'surplus'
  | 'debt-accumulating';

export interface GuidanceNudge {
  type: GuidanceType;
  message: string;
  severity: 'info' | 'warning' | 'danger';
}

// ─── App State ────────────────────────────────────────────────────────────────

export interface AppState {
  assets: Asset[];
  liabilities: Liability[];
  incomes: Income[];
  expenses: Expense[];
  cards: Card[];
  billingCycles: BillingCycle[];
  budgets: Budget[];
  deferredExpenses: DeferredExpense[];
  settings: AppSettings;

  // PIN security
  pin: string | null;
  setPin: (pin: string | null) => void;

  // Settings
  updateSettings: (updates: Partial<AppSettings>) => void;

  // Cards
  addCard: (card: Omit<Card, 'id'>) => void;
  updateCard: (id: string, updates: Partial<Card>) => void;
  deleteCard: (id: string) => void;

  // Actions
  addAsset: (asset: Omit<Asset, 'id'>) => void;
  updateAsset: (id: string, updates: Partial<Asset>) => void;
  deleteAsset: (id: string) => void;

  addLiability: (liability: Omit<Liability, 'id'>) => void;
  updateLiability: (id: string, updates: Partial<Liability>) => void;
  deleteLiability: (id: string) => void;

  addIncome: (income: Omit<Income, 'id'>) => void;
  updateIncome: (id: string, updates: Partial<Income>) => void;
  deleteIncome: (id: string) => void;

  addExpense: (expense: Omit<Expense, 'id'>) => void;
  updateExpense: (id: string, updates: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;

  addBudget: (budget: Omit<Budget, 'id'>) => void;
  updateBudget: (id: string, updates: Partial<Budget>) => void;

  updateBillingCycle: (id: string, updates: Partial<BillingCycle>) => void;
  resolveCyclePayment: (
    cycleId: string,
    resolution: PaymentResolution,
    amountPaid?: number,
    paidFromCardId?: string
  ) => void;

  addDeferredExpense: (deferred: Omit<DeferredExpense, 'id'>) => void;
  removeDeferredExpense: (id: string) => void;

  seedInitialData: () => void;
}
