// Importa a função que cria o cliente do Supabase (banco de dados em nuvem)
import { createClient } from '@supabase/supabase-js';

// Lê a URL do projeto Supabase do arquivo .env (variáveis de ambiente)
// Exemplo: https://seuprojeto.supabase.co
// import.meta.env é a forma do Vite de acessar variáveis do .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;

// Lê a chave pública (anon key) do Supabase do arquivo .env
// Esta chave permite acesso público respeitando as regras de segurança (RLS)
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Verifica se as variáveis de ambiente foram definidas corretamente
// Se faltar alguma, lança um erro imediatamente para avisar o desenvolvedor
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check your .env file.');
}

// Cria e exporta o cliente do Supabase para ser usado em toda a aplicação
// Este objeto é o "ponto de entrada" para todas as operações de banco de dados:
// queries, autenticação, storage, realtime, etc.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
