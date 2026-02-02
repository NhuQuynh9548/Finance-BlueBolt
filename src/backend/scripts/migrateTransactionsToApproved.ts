import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting migration: Updaing PENDING and DRAFT transactions to APPROVED...');

    const result = await prisma.transaction.updateMany({
        where: {
            approvalStatus: {
                in: ['PENDING', 'DRAFT']
            }
        },
        data: {
            approvalStatus: 'APPROVED'
        }
    });

    console.log(`Successfully updated ${result.count} transactions to APPROVED.`);
}

main()
    .catch((e) => {
        console.error('Migration failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
