import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const roles = await prisma.role.findMany();
    const users = await prisma.user.findMany({
        include: { role: true }
    });
    console.log('--- ROLES ---');
    console.log(JSON.stringify(roles, null, 2));
    console.log('--- USERS ---');
    console.log(JSON.stringify(users.map(u => ({ id: u.id, email: u.email, role: u.role?.name })), null, 2));
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
