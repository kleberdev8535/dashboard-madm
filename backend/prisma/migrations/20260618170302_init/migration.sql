-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USUARIO',
    "avatar" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "equipeId" TEXT,
    "unidadeId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "users_equipeId_fkey" FOREIGN KEY ("equipeId") REFERENCES "equipes" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "users_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "unidades" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "unidades" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "cidade" TEXT,
    "estado" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "equipes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "tipo" TEXT,
    "unidadeId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "equipes_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "unidades" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "advogados" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "oab" TEXT,
    "email" TEXT,
    "telefone" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kommoId" TEXT,
    "nome" TEXT NOT NULL,
    "email" TEXT,
    "telefone" TEXT,
    "cpf" TEXT,
    "rg" TEXT,
    "dataNasc" DATETIME,
    "endereco" TEXT,
    "cidade" TEXT,
    "estado" TEXT,
    "cep" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "negocios" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kommoId" TEXT,
    "titulo" TEXT,
    "status" TEXT NOT NULL DEFAULT 'LEAD',
    "valor" REAL,
    "clienteId" TEXT NOT NULL,
    "consultorId" TEXT,
    "advogadoId" TEXT,
    "equipeId" TEXT,
    "unidadeId" TEXT,
    "dataEntrada" DATETIME,
    "dataPrimeiroContato" DATETIME,
    "dataEmissao" DATETIME,
    "dataAssinatura" DATETIME,
    "dataFinalizado" DATETIME,
    "observacoes" TEXT,
    "tags" TEXT,
    "pipeline" TEXT,
    "etapa" TEXT,
    "origem" TEXT,
    "importId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "negocios_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "negocios_consultorId_fkey" FOREIGN KEY ("consultorId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "negocios_advogadoId_fkey" FOREIGN KEY ("advogadoId") REFERENCES "advogados" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "negocios_equipeId_fkey" FOREIGN KEY ("equipeId") REFERENCES "equipes" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "negocios_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "unidades" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "negocios_importId_fkey" FOREIGN KEY ("importId") REFERENCES "imports" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "historico_etapas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "negocioId" TEXT NOT NULL,
    "statusAntes" TEXT,
    "statusDepois" TEXT NOT NULL,
    "userId" TEXT,
    "observacao" TEXT,
    "dataEtapa" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tempoNaEtapa" INTEGER,
    CONSTRAINT "historico_etapas_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "negocios" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "imports" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "totalLinhas" INTEGER NOT NULL DEFAULT 0,
    "processadas" INTEGER NOT NULL DEFAULT 0,
    "erros" INTEGER NOT NULL DEFAULT 0,
    "userId" TEXT NOT NULL,
    "errorLog" TEXT,
    "mapeamento" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "imports_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "dashboards_cache" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "chave" TEXT NOT NULL,
    "dados" TEXT NOT NULL,
    "expiraEm" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "acao" TEXT NOT NULL,
    "recurso" TEXT,
    "detalhes" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "unidades_nome_key" ON "unidades"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_kommoId_key" ON "clientes"("kommoId");

-- CreateIndex
CREATE INDEX "clientes_nome_idx" ON "clientes"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "negocios_kommoId_key" ON "negocios"("kommoId");

-- CreateIndex
CREATE INDEX "negocios_status_idx" ON "negocios"("status");

-- CreateIndex
CREATE INDEX "negocios_consultorId_idx" ON "negocios"("consultorId");

-- CreateIndex
CREATE INDEX "negocios_equipeId_idx" ON "negocios"("equipeId");

-- CreateIndex
CREATE INDEX "negocios_unidadeId_idx" ON "negocios"("unidadeId");

-- CreateIndex
CREATE INDEX "historico_etapas_negocioId_idx" ON "historico_etapas"("negocioId");

-- CreateIndex
CREATE UNIQUE INDEX "dashboards_cache_chave_key" ON "dashboards_cache"("chave");

-- CreateIndex
CREATE INDEX "logs_userId_idx" ON "logs"("userId");
