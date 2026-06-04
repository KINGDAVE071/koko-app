import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

export const adminMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Accès refusé. Réservé aux administrateurs.' });
  }
  next();
};
