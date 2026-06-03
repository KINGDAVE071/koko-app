import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
export declare const adminMiddleware: (req: AuthRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=admin.d.ts.map