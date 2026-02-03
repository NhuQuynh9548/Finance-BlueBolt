
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const partners = await prisma.partner.findMany({
        select: {
            id: true,
            partnerId: true,
            partnerType: true,
            partnerName: true
        }
    });
    console.log(JSON.stringify(partners, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
