#  Planner de Estudos Inteligente com IA

Uma plataforma moderna e inteligente para gestão de estudos. Este projeto resolve a dor de se organizar sem muito padrão (especialmente na area de TI é interessante ter um rodmap) fatiando o conteúdo programático automaticamente em disciplinas, blocos temáticos, tópicos e subtópicos através de Inteligência Artificial ou manualmente

##  Principais Funcionalidades

* **Importação Mágica de tópucos:** Cole o texto bruto do seu roadmap e deixe a IA fatiar, organizar e criar a árvore de estudos estruturada.
* **Mapeamento de Ecossistema:** Ferramenta integrada de IA para detalhar tópicos vagos (ex: expandir "Java" para listar os frameworks e conceitos).
* **Gestão Hierárquica:** Organização inteligente em Níveis: Disciplina > Bloco/Grupo > Tópico > Subtópicos (Anotações).
* **Controle de Progresso:** Checklists dinâmicos e barra de progresso visual para acompanhar quanto evoluiu
* **Controle Híbrido:** Liberdade total para mesclar a automação da IA com a edição, adição e exclusão manual de disciplinas e tópicos.

##  Tecnologias Utilizadas


### Frontend
* **React 18:** Biblioteca principal para construção da interface de usuário.
* **TypeScript:** Tipagem estática para maior segurança, previsibilidade e autocompletar no código.
* **Vite:** Bundler super rápido e otimizado para o ambiente de desenvolvimento e build de produção.
* **Tailwind CSS:** Framework de CSS utilitário para estilização rápida, responsiva e moderna.
* **Lucide React:** Biblioteca de ícones limpos e consistentes.

### Backend & Serviços Integrados
* **Supabase:** Backend as a Service (BaaS) open-source, utilizando PostgreSQL para o banco de dados estruturado e autenticação de usuários (Auth).
* **Google Gemini API:** Integração direta com os modelos de linguagem generativa do Google (Gemini 3.7 Flash, 3.6 Flash e 3.5 Flash) para o processamento de linguagem natural e estruturação de dados em formato JSON.

## Como executar o projeto localmente

### Pré-requisitos
Certifique-se de ter instalado em sua máquina:
* Node.js (versão 18 ou superior)
* Git

Além disso, você precisará criar contas gratuitas para obter as chaves de API:
* [Supabase](https://supabase.com/) (Para o Banco de Dados)
* [Google AI Studio](https://aistudio.google.com/) (Para a chave da API do Gemini)

### Instalação

1. Clone o repositório:
```bash
git clone [https://github.com/SEU-USUARIO/nome-do-repositorio.git](https://github.com/SEU-USUARIO/nome-do-repositorio.git)

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
