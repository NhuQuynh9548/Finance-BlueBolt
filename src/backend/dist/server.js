"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_1 = __importDefault(require("./config/swagger"));
const auth_1 = __importDefault(require("./routes/auth"));
const businessUnits_1 = __importDefault(require("./routes/businessUnits"));
const employees_1 = __importDefault(require("./routes/employees"));
const partners_1 = __importDefault(require("./routes/partners"));
const transactions_1 = __importDefault(require("./routes/transactions"));
const categories_1 = __importDefault(require("./routes/categories"));
const dashboard_1 = __importDefault(require("./routes/dashboard"));
const projects_1 = __importDefault(require("./routes/projects"));
const specializations_1 = __importDefault(require("./routes/specializations"));
const employeeLevels_1 = __importDefault(require("./routes/employeeLevels"));
const paymentMethods_1 = __importDefault(require("./routes/paymentMethods"));
const allocationRules_1 = __importDefault(require("./routes/allocationRules"));
const upload_1 = __importDefault(require("./routes/upload"));
const users_1 = __importDefault(require("./routes/users"));
const roles_1 = __importDefault(require("./routes/roles"));
const logs_1 = __importDefault(require("./routes/logs"));
const settings_1 = __importDefault(require("./routes/settings"));
const path_1 = __importDefault(require("path"));
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
// Routes
app.use('/api/auth', auth_1.default);
app.use('/api/business-units', businessUnits_1.default);
app.use('/api/employees', employees_1.default);
app.use('/api/partners', partners_1.default);
app.use('/api/transactions', transactions_1.default);
app.use('/api/categories', categories_1.default);
app.use('/api/dashboard', dashboard_1.default);
app.use('/api/projects', projects_1.default);
app.use('/api/specializations', specializations_1.default);
app.use('/api/employee-levels', employeeLevels_1.default);
app.use('/api/payment-methods', paymentMethods_1.default);
app.use('/api/allocation-rules', allocationRules_1.default);
app.use('/api/upload', upload_1.default);
app.use('/api/users', users_1.default);
app.use('/api/roles', roles_1.default);
app.use('/api/logs', logs_1.default);
app.use('/api/settings', settings_1.default);
// Swagger API Documentation
app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.default, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'BlueBolt API Documentation'
}));
// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'BlueBolt API is running' });
});
// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message
    });
});
// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📍 API endpoint: http://localhost:${PORT}/api`);
    console.log(`💚 Health check: http://localhost:${PORT}/health`);
});
exports.default = app;
