# Corporate Insights Platform — Guia de Setup

## Pré-requisitos
- Node.js 20+
- PostgreSQL 15+
- npm ou pnpm

---

## Backend

```bash
cd backend
cp .env.example .env
# Edite .env com sua DATABASE_URL e JWT_SECRET

npm install
npx prisma generate
npx prisma migrate dev --name init
npx ts-node prisma/seed.ts
npm run dev
```

API disponível em: http://localhost:3001
Health check: http://localhost:3001/health

---

## Frontend

```bash
cd frontend
cp .env.example .env.local
# Edite NEXT_PUBLIC_API_URL

npm install
npm run dev
```

App disponível em: http://localhost:3000

---

## Credenciais padrão (após seed)

| Perfil     | Email                              | Senha        |
|------------|-------------------------------------|--------------|
| Admin      | admin@corporateinsights.com        | Admin@2024!  |
| Supervisor | supervisor@corporateinsights.com   | Super@2024!  |

---

## Deploy Railway

### Backend
1. Crie um serviço no Railway apontando para `/backend`
2. Adicione um banco PostgreSQL e copie a DATABASE_URL
3. Configure as variáveis de ambiente:
   - `DATABASE_URL`
   - `JWT_SECRET` (gere um valor aleatório seguro)
   - `NODE_ENV=production`
   - `CORS_ORIGIN=https://seu-frontend.railway.app`

### Frontend
1. Crie outro serviço apontando para `/frontend`
2. Configure:
   - `NEXT_PUBLIC_API_URL=https://seu-backend.railway.app/api/v1`

---

## Importação de Dados Kommo

1. Exporte do Kommo: Configurações → Exportar → CSV ou XLSX
2. Acesse: Sistema → Importações
3. Faça upload do arquivo
4. O ETL processa automaticamente em background
5. Os dashboards atualizam em tempo real

### Colunas suportadas no arquivo:
`Nome`, `Email`, `Telefone`, `CPF`, `Status`, `Etapa`, `Pipeline`, `Origem`, `Data Entrada`, `Título`

---

## Perfis de Acesso (RBAC)

| Perfil      | Dashboards | Relatórios | Importações | Usuários | Config |
|-------------|-----------|-----------|-------------|----------|--------|
| ADMIN       | ✅        | ✅        | ✅          | ✅       | ✅     |
| COORDENADOR | ✅        | ✅        | ✅          | ✅       | ❌     |
| SUPERVISOR  | ✅        | ✅        | ✅          | ❌       | ❌     |
| USUARIO     | ✅        | ❌        | ❌          | ❌       | ❌     |

---

## Estrutura de Pastas

```
corporate-insights-platform/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma        ← Schema completo
│   │   └── seed.ts              ← Dados iniciais
│   └── src/
│       ├── controllers/         ← Lógica de negócio
│       ├── middlewares/         ← Auth, Error
│       ├── routes/              ← Rotas da API
│       ├── utils/               ← JWT, Logger
│       └── server.ts            ← Entry point
└── frontend/
    └── src/
        ├── app/
        │   ├── login/           ← Login Premium 3D
        │   └── (dashboard)/     ← Área autenticada
        │       ├── dashboard/   ← Geral, Comercial, Backoffice, etc.
        │       ├── importacoes/
        │       ├── relatorios/
        │       ├── usuarios/
        │       └── configuracoes/
        ├── components/
        │   ├── charts/          ← Funil, Evolução, Ranking
        │   ├── layout/          ← Sidebar, Header
        │   └── ui/              ← StatCard, etc.
        ├── hooks/               ← useDashboard, etc.
        ├── lib/                 ← api.ts, utils.ts
        └── stores/              ← Zustand auth store
```
