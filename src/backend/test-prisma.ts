import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Models:', Object.keys(prisma).filter(k => !k.startsWith('_')));
    // Try to access the models
    try {
        const partner = await prisma.partner.findFirst({
            include: { businessUnit: true } as any
        });
        console.log('Partner businessUnit include works or at least doesn\'t crash on call (dynamic)');
    } catch (e) {
        console.error('Error in businessUnit include:', e);
    }
}

main();
