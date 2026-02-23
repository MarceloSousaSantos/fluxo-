// Importa o modo estrito do React — ajuda a encontrar erros no desenvolvimento
import { StrictMode } from 'react';

// Importa a função que cria a raiz da aplicação React no DOM
import { createRoot } from 'react-dom/client';

// Importa o componente principal da aplicação
import App from './App.tsx';

// Importa os estilos globais da aplicação (CSS)
import './index.css';

// Encontra o elemento <div id="root"> no index.html e monta a aplicação dentro dele
// O "!" diz ao TypeScript que temos certeza que o elemento existe
createRoot(document.getElementById('root')!).render(
  // StrictMode ativa verificações extras durante o desenvolvimento (não afeta produção)
  <StrictMode>
    <App /> {/* Renderiza o componente raiz da aplicação */}
  </StrictMode>,
);
