import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // 1. Create Business Units
    const bu1 = await prisma.businessUnit.upsert({
        where: { name: 'Công ty Mẹ' },
        update: {},
        create: {
            name: 'Công ty Mẹ',
            code: 'HQ',
            leaderName: 'CEO Admin',
            status: 'active',
        },
    });

    const bu2 = await prisma.businessUnit.upsert({
        where: { name: 'Trung tâm Phần mềm' },
        update: {},
        create: {
            name: 'Trung tâm Phần mềm',
            code: 'SWC',
            leaderName: 'Manager A',
            status: 'active',
        },
    });

    // 2. Create Roles
    const rolesData = [
        { name: 'Admin', description: 'Quản trị viên hệ thống - Full quyền', isSystemRole: true },
        { name: 'CEO', description: 'Giám đốc điều hành - Xem tất cả', isSystemRole: true },
        { name: 'CFO', description: 'Giám đốc tài chính', isSystemRole: false },
        { name: 'Accountant', description: 'Kế toán - Quản lý thu chi', isSystemRole: false },
        { name: 'HR', description: 'Quản lý nhân sự', isSystemRole: false },
        { name: 'BU Manager', description: 'Quản lý đơn vị + công việc', isSystemRole: false },
        { name: 'Staff', description: 'Nhân viên - Quyền cơ bản', isSystemRole: false },
    ];

    const roles: any = {};
    for (const roleData of rolesData) {
        roles[roleData.name] = await prisma.role.upsert({
            where: { name: roleData.name },
            update: {},
            create: {
                ...roleData,
                permissions: [],
            },
        });
    }

    // 3. Create Users
    await prisma.user.upsert({
        where: { email: 'admin@bluebolt.com' },
        update: { password: hashedPassword, roleId: roles['Admin'].id },
        create: {
            email: 'admin@bluebolt.com',
            password: hashedPassword,
            name: 'Hệ thống Admin',
            fullName: 'Hệ thống Admin',
            roleId: roles['Admin'].id,
            buId: bu1.id,
            dataScope: 'global',
            status: 'active',
        },
    });

    await prisma.user.upsert({
        where: { email: 'ceo@bluebolt.com' },
        update: { password: hashedPassword, roleId: roles['CEO'].id },
        create: {
            email: 'ceo@bluebolt.com',
            password: hashedPassword,
            name: 'Lãnh đạo CEO',
            fullName: 'Lãnh đạo CEO',
            roleId: roles['CEO'].id,
            buId: bu1.id,
            dataScope: 'global',
            status: 'active',
        },
    });

    // 4. Create System Settings
    const settings = [
        { key: 'twoFactorEnabled', value: 'false', description: 'Bật/Tắt xác thực 2 yếu tố', category: 'security' },
        { key: 'sessionTimeout', value: '30', description: 'Thời gian phiên làm việc (phút)', category: 'security' },
        { key: 'passwordExpiry', value: '90', description: 'Thời hạn mật khẩu (ngày)', category: 'security' },
        { key: 'loginAttempts', value: '5', description: 'Số lần đăng nhập sai tối đa', category: 'security' },
    ];

    for (const setting of settings) {
        await prisma.systemSetting.upsert({
            where: { key: setting.key },
            update: {},
            create: setting,
        });
    }

    // 5. Create Categories
    const categories = [
        { name: 'Doanh thu dự án', code: 'DT_DA', type: 'THU' as any, description: 'Thu từ khách hàng dự án' },
        { name: 'Thu hồi nợ', code: 'TH_NO', type: 'THU' as any, description: 'Thu hồi các khoản nợ' },
        { name: 'Lương nhân viên', code: 'CP_LUONG', type: 'CHI' as any, description: 'Chi trả lương tháng' },
        { name: 'Chi phí văn phòng', code: 'CP_VP', type: 'CHI' as any, description: 'Tiền điện, nước, internet' },
        { name: 'Vay ngân hàng', code: 'VAY_NH', type: 'VAY' as any, description: 'Vay từ các tổ chức tín dụng' },
        { name: 'Tạm ứng công tác', code: 'TU_CT', type: 'HOAN_UNG' as any, description: 'Chi tạm ứng đi công tác' },
    ];

    for (const cat of categories) {
        await prisma.category.upsert({
            where: { code: cat.code },
            update: {},
            create: {
                ...cat,
                status: 'ACTIVE'
            }
        });
    }

    // 6. Create Payment Methods
    const pms = ['Tiền mặt', 'Chuyển khoản', 'Thẻ tín dụng'];
    for (const pmName of pms) {
        await prisma.paymentMethod.upsert({
            where: { name: pmName },
            update: {},
            create: { name: pmName }
        });
    }

    // 7. Create Specializations
    const specializations = [
        { code: 'BA', name: 'BA', description: 'Business Analyst' },
        { code: 'DEV', name: 'Developer', description: 'Software Developer' },
        { code: 'DEVOPS', name: 'DevOps', description: 'DevOps Engineer' },
        { code: 'DA', name: 'Data Analyst', description: 'Data Analyst' },
        { code: 'AI', name: 'AI Engineer', description: 'AI Engineer' },
        { code: 'PM', name: 'PM', description: 'Project Manager' },
        { code: 'QA', name: 'QA/QC', description: 'Quality Assurance' },
        { code: 'DESIGN', name: 'Designer', description: 'UI/UX Designer' },
        { code: 'SALES', name: 'Sales', description: 'Sales' },
        { code: 'MARK', name: 'Marketing', description: 'Marketing' },
        { code: 'STACK', name: 'Fullstack', description: 'Fullstack Developer' },
        { code: 'ACC', name: 'Kế toán', description: 'Accountant' },
        { code: 'TRAIN', name: 'Đào tạo (Trainer)', description: 'Trainer' },
    ];

    for (const spec of specializations) {
        await prisma.specialization.upsert({
            where: { code: spec.code },
            update: {},
            create: spec
        });
    }

    // 8. Create Employee Levels
    const levels = [
        { code: 'LV1', name: 'Nhân viên', order: 1 },
        { code: 'LV2', name: 'Trưởng nhóm', order: 2 },
        { code: 'LV3', name: 'Trưởng phòng', order: 3 },
        { code: 'LV4', name: 'Quản lý (Manager)', order: 4 },
        { code: 'LV5', name: 'Giám đốc', order: 5 },
    ];

    for (const lvl of levels) {
        await prisma.employeeLevel.upsert({
            where: { code: lvl.code },
            update: {},
            create: lvl
        });
    }

    // 9. Create Sample Projects
    await prisma.project.upsert({
        where: { code: 'PROJ_001' },
        update: {},
        create: {
            code: 'PROJ_001',
            name: 'Hệ thống Quản lý Tài chính',
            description: 'Dự án nội bộ BlueBolt',
            startDate: new Date(),
            status: 'ACTIVE'
        }
    });

    // 8. Create Sample Activity Logs
    const adminUser = await prisma.user.findUnique({ where: { email: 'admin@bluebolt.com' } });
    if (adminUser) {
        const logs = [
            {
                userId: adminUser.id,
                action: 'LOGIN',
                module: 'Authentication',
                description: 'Hệ thống Admin đăng nhập',
                status: 'success',
                ip: '127.0.0.1'
            },
            {
                userId: adminUser.id,
                action: 'UPDATE',
                module: 'Hệ thống',
                description: 'Cập nhật cấu hình bảo mật',
                status: 'success',
                ip: '127.0.0.1'
            },
        ];

        for (const log of logs) {
            await prisma.activityLog.create({
                data: log,
            });
        }
    }

    console.log('Seed completed successfully');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
