# Spotify API - Backend

> ⚠ Este repositório contém o backend da aplicação.

A aplicação implementa autenticação e consumo da API do Spotify via OAuth 2.0, expondo endpoints para serem consumidos pelo frontend React.

## Versão para Apresentação

A versão de apresentação está disponível online para testes em: [https://spotify.geison.dev](https://spotify.geison.dev)

Para acessar, é necessário autenticar com uma conta do Spotify. Por favor, envie seu nome e e-mail da conta Spotify para que eu possa adicioná-lo(a) como usuário autorizado.

## Links Úteis

Documentação interativa da API (via Scalar): <https://docs.spotify.geison.dev>

> ⚠ O [Scalar](https://scalar.com) é um visualizador moderno para arquivos OpenAPI, usado aqui para explorar e testar os endpoints gerados pelo backend.

Repositório do backend: <https://github.com/GeisonJr/spotify-api>

Repositório do frontend: <https://github.com/GeisonJr/spotify-app>

## 🚀 Tecnologias utilizadas

* **Node.js** + **TypeScript** – execução e tipagem
* **Express.js** – framework HTTP
* **Jest** – testes unitários
* **ESLint** – padronização de código
* **Docker** – containerização
* **Fly.io** – deploy
* **dotenv** – configuração de variáveis de ambiente

## 📌 Funcionalidades implementadas

* Autenticação com Spotify [OAuth 2.0 Authorization Code Flow com refresh token](https://developer.spotify.com/documentation/web-api/tutorials/code-flow)
* Middleware de autenticação
* Listagem de artistas mais ouvidos
* Listagem de álbuns de um artista específico
* Criação e listagem de playlists do usuário
* Exibição do perfil do usuário
* Paginação de resultados

### Endpoints disponíveis

```dir
<root>
├── auth
│   ├── login           # [GET]  /auth/login               (Generate Spotify login URL)
│   ├── callback        # [GET]  /auth/callback            (Handle Spotify callback)
│   ├── logout          # [GET]  /auth/logout              (Logout user)
│   └── refresh         # [POST] /auth/refresh             (Refresh access token)
├── user
│   └── profile         # [GET]  /user/profile             (Get user profile)
├── artist
│   ├── me
│   │   └── top-artists # [GET]  /artist/me/top-artists    (Get top artists)
│   └── <artistId>
│       └── albums      # [GET]  /artist/<artistId>/albums (Get artist albums)
├── playlist
│   ├── me              # [GET]  /playlist/me              (Get user playlists)
│   └── me              # [POST] /playlist/me              (Create a new playlist)
├── status              # [GET]  /status                   (Check if the API is running)
├── <404>               # [ANY]  /<path>                   (Catch-all for undefined routes)
└── <500>               # [ANY]  /<path>                   (Catch-all for server errors)
```

## 📂 Estrutura de pastas

```dir
src
├── routes
│   ├── auth     # fluxo de autenticação
│   ├── user     # perfil
│   ├── artist   # artistas mais ouvidos e álbuns de um artista
│   └── playlist # criação e listagem de playlists
├── middleware   # autenticação, erros, logging
├── functions    # funções auxiliares
└── tests        # testes unitários
```

## ✅ Checklist de requisitos

### Requisitos obrigatórios

* [x] Segmentação de commits
* [x] Lint
* [x] Autenticação via Spotify
* [x] Listar artistas
* [x] Listar álbuns de um artista
* [x] Utilizar paginação (scroll infinito ou não) - Frontend
* [x] Funcionamento offline - Frontend
* [x] Testes unitários
* [x] Deploy da aplicação

### Bônus

* [ ] Testes E2E
* [ ] CI/CD (CI não implementado, CD implementado via Fly.io)
* [ ] Responsividade
* [ ] Qualidade de código (SonarQube)
* [ ] PWA

### Outros critérios

* [x] Exibir perfil do usuário
* [x] Criar playlists para o usuário
* [x] Listar playlists do usuário
* [x] Documentação da API

## ⚙️ Como executar localmente

### 1. Clonar o repositório

```bash
git clone https://github.com/GeisonJr/spotify-api.git
cd spotify-api
```

### 2. Criar arquivo `.env` com variáveis

> ⚠ As credenciais do Spotify devem ser configuradas no [Spotify Developer Dashboard](https://developer.spotify.com/dashboard), garantindo que a Redirect URI seja exatamente a informada abaixo.

```env
SPOTIFY_CLIENT_ID=seu_client_id
SPOTIFY_CLIENT_SECRET=seu_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:3000/callback
FRONTEND_URL=http://localhost:5555
```

### 3. Instalar dependências

```bash
npm install
```

### 4. Rodar em modo desenvolvimento

```bash
npm run dev
```

### 5. Executar testes

```bash
npm run test
# ou
npm run test:coverage
```

## 📦 Deploy

O deploy está configurado via **Fly.io**.
Para publicar alterações:

```bash
fly deploy
```

## 📄 Decisões de arquitetura

* **Documentação OpenAPI** para fácil entendimento e integração com a API.
* **Estrutura de pastas organizada** para facilitar a navegação e manutenção do código, com separação clara entre rotas, middleware, funções auxiliares e testes.
* **Separação por contexto**: cada módulo (`auth`, `user`, `artist`, `playlist`) mantém rotas, controladores e serviços isolados, favorecendo manutenção e escalabilidade.
* **TypeScript** para tipagem forte e prevenção de erros em tempo de desenvolvimento.
* **Express.js** como framework HTTP, proporcionando simplicidade e flexibilidade.
* **Middlewares reutilizáveis** para autenticação, logs e tratamento de erros.
* **Uso de variáveis de ambiente** para configuração sensível, evitando hardcoding de credenciais.
* **Docker** para containerização, garantindo consistência entre ambientes de desenvolvimento e produção.
