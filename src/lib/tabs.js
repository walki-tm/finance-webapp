import Dashboard from '../features/dashboard/pages/Dashboard.jsx';
import Transactions from '../features/transactions/pages/Transactions.jsx';
import Categories from '../features/categories/pages/Categories.jsx';
import Budgeting from '../features/budgeting/pages/Budgeting.jsx';
import { BarChart3, TrendingUp, Settings as SettingsIcon, CalendarDays } from 'lucide-react';

export const tabs = [
  { key: 'dashboard', label: 'Dashboard', component: Dashboard, icon: BarChart3 },
  { key: 'transactions', label: 'Transazioni', component: Transactions, icon: TrendingUp },
  { key: 'categories', label: 'Categorie', component: Categories, icon: SettingsIcon },
  { key: 'budgeting', label: 'Budgeting', component: Budgeting, icon: CalendarDays },
];

export default tabs;