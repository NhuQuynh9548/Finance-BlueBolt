import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger';
import authRoutes from './routes/auth';
import businessUnitRoutes from './routes/businessUnits';
import employeeRoutes from './routes/employees';
import partnerRoutes from './routes/partners';
import transactionRoutes from './routes/transactions';
import categoryRoutes from './routes/categories';
import dashboardRoutes from './routes/dashboard';
import projectRoutes from './routes/projects';
import specializationRoutes from './routes/specializations';
import employeeLevelRoutes from './routes/employeeLevels';
import paymentMethodRoutes from './routes/paymentMethods';
import allocationRuleRoutes from './routes/allocationRules';
import uploadRoutes from './routes/upload';
import userRoutes from './routes/users';
import roleRoutes from './routes/roles';
import logRoutes from './routes/logs';
import settingRoutes from './routes/settings';
import notificationRoutes from './routes/notifications';
import auditLogRoutes from './routes/auditLogs';
import path from 'path';

// Load environment variables
dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/api/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/business-units', businessUnitRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/partners', partnerRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/specializations', specializationRoutes);
app.use('/api/employee-levels', employeeLevelRoutes);
app.use('/api/payment-methods', paymentMethodRoutes);
app.use('/api/allocation-rules', allocationRuleRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/audit-logs', auditLogRoutes);

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'BlueBolt API Documentation'
}));

// Health check
app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'OK', message: 'BlueBolt API is running' });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
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

export default app;
