import Dashboard from '../features/dashboard/pages/Dashboard.jsx';
import Transactions from '../features/transactions/pages/Transactions.jsx';
import { AccountsPage } from '../features/accounts';
import Categories from '../features/categories/pages/Categories.jsx';
import Budgeting from '../features/budgeting/pages/Budgeting.jsx';
import LoansPage from '../features/loans/pages/LoansPage.jsx';
import SavingsGoals from '../features/savings-goals/pages/SavingsGoals.jsx';
import { BarChart3, TrendingUp, Wallet, Settings as SettingsIcon, CalendarDays, CreditCard, Target } from 'lucide-react';

export const tabs = [
  { key: 'dashboard', label: 'Dashboard', component: Dashboard, icon: BarChart3 },
  { key: 'transactions', label: 'Transazioni', component: Transactions, icon: TrendingUp },
  { key: 'accounts', label: 'Conti', component: AccountsPage, icon: Wallet },
  { key: 'categories', label: 'Categorie', component: Categories, icon: SettingsIcon },
  { key: 'budgeting', label: 'Budgeting', component: Budgeting, icon: CalendarDays },
  { key: 'loans', label: 'Prestiti', component: LoansPage, icon: CreditCard },
  // { key: 'savings-goals', label: 'Obiettivi', component: SavingsGoals, icon: Target }, // HIDDEN: Temporarily disabled
];

export default tabs;