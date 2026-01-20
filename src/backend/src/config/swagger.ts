import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'BlueBolt Management System API',
            version: '1.0.0',
            description: 'API documentation for BlueBolt Financial Management System',
            contact: {
                name: 'BlueBolt Team',
                email: 'support@bluebolt.vn'
            }
        },
        servers: [
            {
                url: 'http://localhost:5000',
                description: 'Development server'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Enter JWT token from /api/auth/login'
                }
            },
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        email: { type: 'string', format: 'email' },
                        name: { type: 'string' },
                        role: { type: 'string', enum: ['CEO', 'ADMIN', 'TRUONG_BU', 'NHAN_VIEN'] },
                        buId: { type: 'string', nullable: true },
                        buName: { type: 'string', nullable: true }
                    }
                },
                LoginRequest: {
                    type: 'object',
                    required: ['email', 'password'],
                    properties: {
                        email: { type: 'string', format: 'email', example: 'ceo@bluebolt.vn' },
                        password: { type: 'string', format: 'password', example: 'ceo123' }
                    }
                },
                LoginResponse: {
                    type: 'object',
                    properties: {
                        token: { type: 'string' },
                        user: { $ref: '#/components/schemas/User' }
                    }
                },
                Category: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        code: { type: 'string', example: 'C01' },
                        name: { type: 'string', example: 'Dịch vụ thuê ngoài' },
                        type: { type: 'string', enum: ['THU', 'CHI', 'VAY', 'HOAN_UNG'] },
                        description: { type: 'string' },
                        status: { type: 'string', enum: ['ACTIVE', 'INACTIVE'] }
                    }
                },
                Employee: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        employeeId: { type: 'string' },
                        fullName: { type: 'string' },
                        email: { type: 'string' },
                        phone: { type: 'string' },
                        businessUnitId: { type: 'string' },
                        specializationId: { type: 'string' },
                        levelId: { type: 'string' },
                        joinDate: { type: 'string', format: 'date' },
                        workStatus: { type: 'string', enum: ['WORKING', 'PROBATION', 'RESIGNED'] },
                        birthDate: { type: 'string', format: 'date' },
                        idCard: { type: 'string' },
                        address: { type: 'string' }
                    }
                },
                Partner: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        partnerId: { type: 'string' },
                        partnerName: { type: 'string' },
                        partnerType: { type: 'string', enum: ['CUSTOMER', 'SUPPLIER', 'BOTH'] },
                        taxCode: { type: 'string' },
                        phone: { type: 'string' },
                        email: { type: 'string' },
                        address: { type: 'string' },
                        status: { type: 'string', enum: ['ACTIVE', 'INACTIVE'] }
                    }
                },
                Transaction: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        transactionCode: { type: 'string' },
                        transactionDate: { type: 'string', format: 'date-time' },
                        transactionType: { type: 'string', enum: ['INCOME', 'EXPENSE', 'LOAN'] },
                        amount: { type: 'number' },
                        approvalStatus: { type: 'string', enum: ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'] },
                        description: { type: 'string' }
                    }
                },
                Error: {
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                        message: { type: 'string' }
                    }
                }
            }
        },
        security: [
            {
                bearerAuth: []
            }
        ]
    },
    apis: ['./src/routes/*.ts']
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
