const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- Current Sequences ---');
    const sequences = await prisma.systemSequence.findMany();
    console.log(JSON.stringify(sequences, null, 2));

    const keysToReset = ['TXN_T_0126', 'TXN_C_0126', 'TXN_V_0126'];

    console.log('--- Resetting Sequences ---');
    for (const key of keysToReset) {
        try {
            await prisma.systemSequence.upsert({
                where: { key },
                update: { value: 0 }, // It will be incremented to 1 on next transaction
                create: { key, value: 0 }
            });
            console.log(`Reset ${key} to 0`);
        } catch (err) {
            console.error(`Error resetting ${key}:`, err.message);
        }
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
