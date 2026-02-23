// Importa os componentes de navegação do React Router
// Link: cria links de navegação (como <a href>, mas sem recarregar a página)
// useLocation: hook que informa qual URL está ativa no momento
import { Link, useLocation } from 'react-router-dom';

// Importa os ícones da barra de navegação da biblioteca lucide-react
import { LayoutDashboard, ReceiptText, PieChart, Settings } from 'lucide-react';

// Importa a função utilitária para combinar classes CSS condicionalmente
import { cn } from '../lib/utils';

// Lista de itens da barra de navegação
// Cada item tem: ícone, texto e caminho (URL) de destino
const navItems = [
  { icon: LayoutDashboard, label: 'Início', path: '/dashboard' },     // Página inicial com saldo
  { icon: ReceiptText, label: 'Transações', path: '/transacoes' },    // Lista de transações
  { icon: PieChart, label: 'Resumo', path: '/resumo' },        // Gráficos e análise
  { icon: Settings, label: 'Ajustes', path: '/configuracoes' }, // Configurações
];

// Componente da barra de navegação inferior (fica fixo no fundo da tela)
export function BottomNav() {
  // useLocation retorna o objeto com a URL atual
  // location.pathname = '/dashboard', '/transacoes', etc.
  const location = useLocation();

  return (
    // nav fixo no fundo: fundo semitransparente + desfoque (backdrop-blur-lg)
    // z-50 = fica na frente de todos os outros elementos da página
    <nav className="fixed bottom-0 left-0 right-0 bg-zinc-900/80 backdrop-blur-lg border-t border-white/5 pb-safe pt-2 px-6 flex justify-between items-center z-50">

      {/* Percorre cada item da lista e renderiza um botão de navegação */}
      {navItems.map((item) => {
        // Verifica se o item está ativo comparando o caminho com a URL atual
        const isActive = location.pathname === item.path;

        return (
          <Link
            key={item.path}  // Chave única para o React gerenciar a lista
            to={item.path}   // URL de destino ao clicar
            className={cn(
              "flex flex-col items-center gap-1 py-2 transition-colors",
              // Item ativo = verde (emerald), inativo = cinza
              isActive ? "text-emerald-400" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            {/* Renderiza o ícone dinamicamente — item.icon é o componente do ícone */}
            <item.icon size={24} />

            {/* Texto do item em maiúsculas e bem pequeno */}
            <span className="text-[10px] font-medium uppercase tracking-wider">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
