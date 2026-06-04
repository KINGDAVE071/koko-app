import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import medicationRoutes from './routes/medications';
import converterRoutes from './routes/converter';
import receiptRoutes from './routes/receipts';
import productRoutes from './routes/products';
import clientRoutes from './routes/clients';
import transactionRoutes from './routes/transactions';
import businessRoutes from './routes/business';
import adminRoutes from './routes/admin';
import promoteRoutes from './routes/promote';
import pharmaciesRoutes from './routes/pharmacies';
import authCheckRoutes from './routes/auth-check';

dotenv.config();

const app = express();
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3000', 'http://10.10.11.53:3000', 'https://koko-app-seven.vercel.app'],
  credentials: true,
}));
app.use(express.json({ limit: '10kb' }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Trop de requêtes, réessayez plus tard.',
});
app.use('/api/', limiter);

app.use('/api/auth', authRoutes);
app.use('/api/medications', medicationRoutes);
app.use('/api/converter', converterRoutes);
app.use('/api/receipts', receiptRoutes);
app.use('/api/products', productRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/business', businessRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/promote', promoteRoutes);
app.use('/api/pharmacies', pharmaciesRoutes);
app.use('/api/auth-check', authCheckRoutes);

app.get('/', (_req, res) => res.json({ status: 'ok', app: 'KOKO API' }));

const PORT = parseInt(process.env.PORT || '5000', 10);
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 KOKO API démarrée sur http://localhost:${PORT}`));
