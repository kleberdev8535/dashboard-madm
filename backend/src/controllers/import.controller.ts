import { Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AppError } from '../middlewares/error.middleware';
import { AuthRequest } from '../middlewares/auth.middleware';
import * as XLSX from 'xlsx';
import { parse } from 'csv-parse/sync';
import path from 'path';
import fs from 'fs';
import { logger } from '../utils/logger';

type TipoImport = 'CSV' | 'XLSX';

const STATUS_MAP: Record<string, string> = {
  'lead': 'LEAD',
  'primeiro contato': 'PRIMEIRO_CONTATO',
  'em contato': 'EM_CONTATO',
  'sem retorno': 'SEM_RETORNO',
  'coleta': 'COLETA_DOCUMENTACAO',
  'documentação': 'COLETA_DOCUMENTACAO',
  'pendências': 'PENDENCIAS',
  'pendencias': 'PENDENCIAS',
  'aguardando emissão': 'AGUARDANDO_EMISSAO',
  'aguardando emissao': 'AGUARDANDO_EMISSAO',
  'emitido': 'EMITIDO',
  'assinado': 'ASSINADO',
  'auditoria': 'AUDITORIA',
  'finalizado': 'FINALIZADO',
  'cancelado': 'CANCELADO',
  'pro': 'PRO',
  'sanada': 'SANADA',
  'reset': 'RESET',
};

function parseStatus(value: string): string {
  const normalized = value?.toLowerCase().trim();
  return STATUS_MAP[normalized] || 'LEAD';
}

export async function uploadImport(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.file) throw new AppError('Arquivo não enviado', 400);

    const ext = path.extname(req.file.originalname).toLowerCase();
    const tipo: TipoImport = ext === '.csv' ? 'CSV' : 'XLSX';

    const importRecord = await prisma.import.create({
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        tipo,
        status: 'PENDENTE',
        userId: req.user!.id,
      },
    });

    processImport(importRecord.id, req.file.path, tipo).catch((err) =>
      logger.error('Import processing error', { importId: importRecord.id, error: err.message })
    );

    res.status(201).json({ id: importRecord.id, message: 'Upload recebido. Processamento iniciado.' });
  } catch (err) { next(err); }
}

export async function getImportStatus(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const imp = await prisma.import.findUnique({ where: { id }, include: { user: { select: { name: true } } } });
    if (!imp) throw new AppError('Importação não encontrada', 404);
    res.json(imp);
  } catch (err) { next(err); }
}

export async function listImports(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const [imports, total] = await Promise.all([
      prisma.import.findMany({
        skip, take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true } } },
      }),
      prisma.import.count(),
    ]);
    res.json({ imports, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
  } catch (err) { next(err); }
}

async function processImport(importId: string, filePath: string, tipo: TipoImport) {
  await prisma.import.update({ where: { id: importId }, data: { status: 'PROCESSANDO' } });

  let rows: any[] = [];
  try {
    if (tipo === 'XLSX') {
      const workbook = XLSX.readFile(filePath);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    } else {
      const content = fs.readFileSync(filePath, 'utf-8');
      rows = parse(content, { columns: true, skip_empty_lines: true, trim: true });
    }
  } catch (err: any) {
    await prisma.import.update({
      where: { id: importId },
      data: { status: 'ERRO', errorLog: JSON.stringify({ message: 'Erro ao ler arquivo: ' + err.message }) },
    });
    return;
  }

  let processadas = 0;
  let erros = 0;
  const errorLog: any[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      const nome = row['Nome'] || row['nome'] || row['NOME'] || row['Cliente'] || '';
      if (!nome) { erros++; errorLog.push({ linha: i + 2, erro: 'Nome obrigatório' }); continue; }

      let cliente = await prisma.cliente.findFirst({
        where: { nome: { equals: nome } },
      });
      if (!cliente) {
        cliente = await prisma.cliente.create({
          data: {
            nome,
            email: row['Email'] || row['email'] || null,
            telefone: row['Telefone'] || row['telefone'] || null,
            cpf: row['CPF'] || row['cpf'] || null,
          },
        });
      }

      const statusRaw = row['Status'] || row['status'] || row['Etapa'] || row['etapa'] || 'Lead';
      await prisma.negocio.create({
        data: {
          clienteId: cliente.id,
          status: parseStatus(statusRaw),
          titulo: row['Título'] || row['titulo'] || row['Negócio'] || nome,
          pipeline: row['Pipeline'] || row['pipeline'] || null,
          origem: row['Origem'] || row['origem'] || null,
          importId: importId,
          dataEntrada: row['Data Entrada'] ? new Date(row['Data Entrada']) : undefined,
        },
      });

      processadas++;
    } catch (err: any) {
      erros++;
      errorLog.push({ linha: i + 2, erro: err.message });
    }
  }

  await prisma.import.update({
    where: { id: importId },
    data: {
      status: erros > 0 && processadas === 0 ? 'ERRO' : 'CONCLUIDO',
      totalLinhas: rows.length,
      processadas,
      erros,
      errorLog: errorLog.length > 0 ? JSON.stringify(errorLog) : null,
    },
  });

  fs.unlink(filePath, () => {});
}
