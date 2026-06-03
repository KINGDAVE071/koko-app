"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminMiddleware = void 0;
const adminMiddleware = (req, res, next) => {
    if (req.userRole !== 'admin') {
        return res.status(403).json({ error: 'Accès refusé. Réservé aux administrateurs.' });
    }
    next();
};
exports.adminMiddleware = adminMiddleware;
//# sourceMappingURL=admin.js.map