"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_1 = __importDefault(require("./routes/auth"));
const medications_1 = __importDefault(require("./routes/medications"));
const converter_1 = __importDefault(require("./routes/converter"));
const receipts_1 = __importDefault(require("./routes/receipts"));
const products_1 = __importDefault(require("./routes/products"));
const clients_1 = __importDefault(require("./routes/clients"));
const transactions_1 = __importDefault(require("./routes/transactions"));
const business_1 = __importDefault(require("./routes/business"));
const admin_1 = __importDefault(require("./routes/admin"));
const promote_1 = __importDefault(require("./routes/promote"));
const auth_check_1 = __importDefault(require("./routes/auth-check"));
const pharmacies_1 = __importDefault(require("./routes/pharmacies"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: ['http://localhost:3000', 'http://10.10.11.53:3000', 'https://koko-app-seven.vercel.app'],
    credentials: true,
}));
app.use(express_1.default.json({ limit: '10kb' }));
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Trop de requêtes, réessayez plus tard.',
});
app.use('/api/', limiter);
app.use('/api/auth', auth_1.default);
app.use('/api/medications', medications_1.default);
app.use('/api/converter', converter_1.default);
app.use('/api/receipts', receipts_1.default);
app.use('/api/products', products_1.default);
app.use('/api/clients', clients_1.default);
app.use('/api/transactions', transactions_1.default);
app.use('/api/business', business_1.default);
app.use('/api/admin', admin_1.default);
app.use('/api/promote', promote_1.default);
app.use('/api/auth-check', auth_check_1.default);
app.use('/api/auth-check', auth_check_1.default);
app.use('/api/pharmacies', pharmacies_1.default);
app.get('/', (_req, res) => res.json({ status: 'ok', app: 'KOKO API' }));
const PORT = parseInt(process.env.PORT || '5000', 10);
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 KOKO API démarrée sur http://localhost:${PORT}`));
//# sourceMappingURL=index.js.map