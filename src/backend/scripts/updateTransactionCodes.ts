import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting transaction code migration...');

    const transactions = await prisma.transaction.findMany({
        where: {
            OR: [
                { transactionCode: { contains: '_PT' } },
                { transactionCode: { contains: '_PC' } },
                { transactionCode: { contains: '_PV' } }
            ]
        }
    });

    console.log(`Found ${transactions.length} transactions to update.`);

    let updatedCount = 0;

    for (const txn of transactions) {
        let newCode = txn.transactionCode;

        // Replace prefixes
        newCode = newCode.replace('_PT', '_T');
        newCode = newCode.replace('_PC', '_C');
        newCode = newCode.replace('_PV', '_V');

        if (newCode !== txn.transactionCode) {
            await prisma.transaction.update({
                where: { id: txn.id },
                data: { transactionCode: newCode }
            });
            console.log(`Updated: ${txn.transactionCode} -> ${newCode}`);
            updatedCount++;
        }
    }

    console.log(`Migration completed. Total updated: ${updatedCount}`);
}

main()
    .catch((e) => {
        console.error('Migration error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
