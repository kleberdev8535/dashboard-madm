import { Router } from 'express';
import { authMiddleware, requireRole } from '../middlewares/auth.middleware';
import { login, me, changePassword, register } from '../controllers/auth.controller';
import { listUsers, createUser, updateUser, deleteUser } from '../controllers/users.controller';
import { getDashboardGeral, getDashboardComercial, getDashboardBackoffice, getDashboardRibeiraoPreto } from '../controllers/dashboard.controller';
import { uploadImport, getImportStatus, listImports } from '../controllers/import.controller';
import { getRelatorios } from '../controllers/relatorios.controller';
import { getDesempenhoIndividual } from '../controllers/desempenho.controller';
import { getSheetsTabs, getSheetsPerformance } from '../controllers/sheets.controller';
import { getBackofficeList } from '../controllers/backoffice.controller';
import { getUmblerList } from '../controllers/umbler.controller';
import { syncFromSheets, getSyncStatus } from '../controllers/sync.controller';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (_, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({
  storage,
  limits: { fileSize: Number(process.env.MAX_FILE_SIZE) || 52428800 },
  fileFilter: (_, file, cb) => {
    const allowed = ['.csv', '.xlsx', '.xls'];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  },
});

// Auth
router.post('/auth/login', login);
router.post('/auth/register', register);
router.get('/auth/me', authMiddleware, me);
router.put('/auth/change-password', authMiddleware, changePassword);

// Users
router.get('/users', authMiddleware, requireRole('ADMIN', 'COORDENADOR', 'SUPERVISOR'), listUsers);
router.post('/users', authMiddleware, requireRole('ADMIN', 'COORDENADOR'), createUser);
router.put('/users/:id', authMiddleware, requireRole('ADMIN', 'COORDENADOR'), updateUser);
router.delete('/users/:id', authMiddleware, requireRole('ADMIN'), deleteUser);

// Dashboards
router.get('/dashboard/geral', authMiddleware, getDashboardGeral);
router.get('/dashboard/comercial', authMiddleware, getDashboardComercial);
router.get('/dashboard/backoffice', authMiddleware, getDashboardBackoffice);
router.get('/dashboard/ribeirao-preto', authMiddleware, getDashboardRibeiraoPreto);

// Relatórios
router.get('/relatorios', authMiddleware, getRelatorios);

// Desempenho individual
router.get('/dashboard/desempenho', authMiddleware, getDesempenhoIndividual);

// Backoffice (planilha externa)
router.get('/backoffice/list', authMiddleware, getBackofficeList);

// Umbler (planilha externa)
router.get('/umbler/list', authMiddleware, getUmblerList);

// Google Sheets
router.get('/sheets/tabs',        authMiddleware, getSheetsTabs);
router.get('/sheets/performance', authMiddleware, getSheetsPerformance);
router.post('/sync/sheets',       authMiddleware, syncFromSheets);
router.get('/sync/status',        authMiddleware, getSyncStatus);

// Imports
router.post('/imports/upload', authMiddleware, requireRole('ADMIN', 'COORDENADOR', 'SUPERVISOR'), upload.single('file'), uploadImport);
router.get('/imports', authMiddleware, listImports);
router.get('/imports/:id', authMiddleware, getImportStatus);

export default router;
