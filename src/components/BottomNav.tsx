import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ReceiptText, PieChart, Settings } from 'lucide-react';
import { cn } from '../lib/utils';

const navItems = [
  { icon: LayoutDashboard, label: 'Início', path: '/dashboard' },
  { icon: ReceiptText, label: 'Transações', path: '/transacoes' },
  { icon: PieChart, label: 'Resumo', path: '/resumo' },
  { icon: Settings, label: 'Ajustes', path: '/configuracoes' },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-zinc-900/80 backdrop-blur-lg border-t border-white/5 pb-safe pt-2 px-6 flex justify-between items-center z-50">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex flex-col items-center gap-1 py-2 transition-colors",
              isActive ? "text-emerald-400" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            <item.icon size={24} />
            <span className="text-[10px] font-medium uppercase tracking-wider">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
