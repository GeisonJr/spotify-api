# Spotify API Backend

Este projeto é uma API backend para integração com a API do Spotify, permitindo autenticação de usuários, consulta de perfis, playlists, artistas e criação de playlists.
Desenvolvido com foco em **segurança**, **boas práticas de arquitetura** e **testes automatizados**.

## Sumário

* [Versão para Apresentação](#versão-para-apresentação)
* [Visão Geral da Arquitetura](#visão-geral-da-arquitetura)
* [Tecnologias Utilizadas](#tecnologias-utilizadas)
* [Padrões de Arquitetura](#padrões-de-arquitetura)
* [Pré-requisitos](#pré-requisitos)
* [Configuração do Ambiente](#configuração-do-ambiente)
* [Como Executar Localmente](#como-executar-localmente)
* [Testes](#testes)
* [Deploy (Fly.io)](#deploy-flyio)
* [Observações sobre as escolhas técnicas](#observações-sobre-as-escolhas-técnicas)

## Versão para Apresentação

A versão de apresentação está disponível online para testes em: [https://spotify.geison.dev](https://spotify.geison.dev)

Para acessar, é necessário autenticar com uma conta do Spotify. Por favor, envie seu nome e e-mail da conta Spotify para que eu possa adicioná-lo(a) como usuário autorizado.

## Visão Geral da Arquitetura

```text
[Client/Frontend] <---> [Express API] <---> [Spotify API]
```

**Fluxo resumido**:

1. O cliente inicia a autenticação via OAuth no Spotify.
2. A API recebe o código de autenticação, solicita o token de acesso e armazena as informações do usuário em cookies seguros.
3. Usuários autenticados podem consultar o perfil, playlists, artistas, álbuns e criar playlists.

## Tecnologias Utilizadas

* **Node.js** (v22+)
* **TypeScript**
* **Express 5**
* **Jest** (testes automatizados)
* **ESLint** (padronização de código)
* **dotenv** (variáveis de ambiente)
* **Docker** (containerização)
* **Fly.io** (deploy cloud)

## Padrões de Arquitetura

* **Separação por camadas**: rotas, middlewares, testes, utilitários e tipos.
* **Middlewares dedicados**:
  * Autenticação
  * Tratamento centralizado de erros
  * Logging de requisições
* **Módulos independentes**: `auth`, `user`, `artist` e `playlist`, cada um com rotas e controladores próprios.
* **Testes automatizados**: Cobertura para partes críticas e fluxos de autenticação.
* **Configuração via `.env`**: URLs e chaves sensíveis centralizadas.

## Pré-requisitos

* Node.js 22+
* npm 10+
* Conta no Spotify Developer (para obter `CLIENT_ID` e `CLIENT_SECRET`)

## Configuração do Ambiente

1. Copie o arquivo `.env.example` para `.env`:

   ```sh
   cp .env.example .env
   ```

2. Preencha as variáveis do Spotify no `.env`:

   ```env
   SPOTIFY_CLIENT_ID=seu_client_id
   SPOTIFY_CLIENT_SECRET=seu_client_secret
   SPOTIFY_REDIRECT_URI=http://127.0.0.1:3000/auth/callback
   FRONTEND_URL=http://127.0.0.1:5555
   ```

## Como Executar Localmente

Siga os passos abaixo para instalar as dependências, configurar as variáveis de ambiente e iniciar o servidor localmente do zero:

1. Instale as dependências:

   ```sh
   npm install
   ```

2. Compile o projeto:

   ```sh
   npm run build
   ```

3. Inicie o servidor:

   ```sh
   npm start
   ```

   O servidor estará disponível em [http://127.0.0.1:3000](http://127.0.0.1:3000)

**Modo desenvolvimento:**

```sh
npm run dev
```

## Testes

Executar todos os testes automatizados:

```sh
npm test
```

Gerar relatório de cobertura:

```sh
npm run test:coverage
```

## Deploy (Fly.io)

O projeto já possui configuração pronta para deploy no Fly.io (`fly.toml`).

1. Instale o [Fly CLI](https://fly.io/docs/flyctl/install/)

2. Faça login:

   ```sh
   fly auth login
   ```

3. Crie a aplicação (caso não exista):

   ```sh
   fly launch
   ```

4. Faça o deploy:

   ```sh
   fly deploy
   ```

5. Configure as variáveis de ambiente no Fly:

   ```sh
   fly secrets set SPOTIFY_CLIENT_ID=your_client_id
   fly secrets set SPOTIFY_CLIENT_SECRET=your_client_secret
   fly secrets set SPOTIFY_REDIRECT_URI=http://your_fly_app_url/auth/callback
   fly secrets set FRONTEND_URL=http://your_frontend_url
   ```

## Observações sobre as escolhas técnicas

* **Express 5**: Praticidade, robustez, comunidade ativa e suporte a middlewares.
* **TypeScript**: Tipagem estática para segurança e manutenção.
* **Arquitetura modular**: Facilita manutenção, testes e escalabilidade.
* **Testes automatizados**: Foco em rotas críticas e autenticação.
* **Docker**: Uniformiza execução em diferentes ambientes.
* **Fly.io**: Plataforma moderna para deploy de aplicações Node.js.
