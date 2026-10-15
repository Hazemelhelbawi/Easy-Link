import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../..');
const dataRoot = process.env.EASYLINK_DATA_DIR ? path.resolve(process.env.EASYLINK_DATA_DIR) : rootDir;

export const paths = {
  root: rootDir,
  data: path.join(dataRoot, 'data'),
  people: path.join(dataRoot, 'data', 'people.json'),
  users: path.join(dataRoot, 'data', 'users.json'),
  config: path.join(dataRoot, 'data', 'config.json'),
  metadata: path.join(dataRoot, 'data', 'metadata.json'),
  currentXlsx: path.join(dataRoot, 'data', 'current.xlsx'),
  jwtSecret: path.join(dataRoot, 'data', '.jwt-secret'),
  frontDist: path.join(rootDir, 'front', 'dist'),
  uploadsTmp: path.join(dataRoot, 'data', 'tmp'),
};

export const serverConfig = {
  port: Number(process.env.PORT || 8501),
  host: process.env.HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',
  cookieSecure: process.env.COOKIE_SECURE === 'true',
  jwtExpiresIn: '8h',
  loginRateWindowMs: 15 * 60 * 1000,
  loginRateMax: 20,
  maxUploadBytes: 50 * 1024 * 1024,
};

export const defaultConfig = {
  applicationName: 'EasyLink',
  companyName: 'EasyLink',
  reportingYear: new Date().getFullYear(),
  currencyCode: 'SAR',
  currencyLabel: { ar: 'ر.س', en: 'SAR' },
  leaderboardShowRevenue: true,
  ictTypes: [
    'bent',
    'dia',
    'dia - mw',
    'dia - fiber',
    'dia - relocation',
    'sip trunk',
    'ip-vpn',
    'bnet-open access',
  ],
  kamAliases: {
    'ehab hassan 2': 'ehab hassan',
  },
  bootstrapCompleted: false,
};
