// Importa a função clsx — combina classes CSS condicionalmente
// Exemplo: clsx('btn', isActive && 'btn-active') → 'btn btn-active' ou 'btn'
import { clsx, type ClassValue } from 'clsx';

// Importa o twMerge — resolve conflitos entre classes Tailwind
// Exemplo: twMerge('px-4 px-8') → 'px-8' (a última vence, sem duplicatas)
import { twMerge } from 'tailwind-merge';

// Função utilitária para combinar classes CSS de forma segura com Tailwind
// Usada em todo o projeto para classes condicionais (cn = className)
// Exemplo: cn('base-class', isActive && 'active-class', className)
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs)); // Primeiro combina condicionalmente, depois resolve conflitos do Tailwind
}

// Função para formatar valores monetários no padrão brasileiro
// Exemplo: formatCurrency(1500) → 'R$ 1.500,00'
export function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { // Usa o formato numérico do Brasil
    style: 'currency',   // Formato: moeda
    currency: 'BRL',     // Real Brasileiro
  }).format(value);
}

// Função para formatar datas no padrão brasileiro
// Exemplo: formatDate('2024-02-15') → '15/02/2024'
export function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('pt-BR'); // Converte para formato br: dd/mm/aaaa
}
