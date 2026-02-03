
import { PrismaClient, PartnerType } from '@prisma/client';

const prisma = new PrismaClient();

async function migratePartners() {
    console.log('Starting partner code migration...');

    // Get all partners sorted by their current ID or creation date
    const partners = await prisma.partner.findMany({
        orderBy: { createdAt: 'asc' }
    });

    let khIndex = 1;
    let nccIndex = 1;
    let dtIndex = 1;

    for (const partner of partners) {
        let prefix = 'DT';
        let index = 0;

        if (partner.partnerType === 'CUSTOMER') {
            prefix = 'KH';
            index = khIndex++;
        } else if (partner.partnerType === 'SUPPLIER') {
            prefix = 'NCC';
            index = nccIndex++;
        } else if (partner.partnerType === 'BOTH') {
            prefix = 'DT';
            index = dtIndex++;
        }

        const newPartnerId = `${prefix}${String(index).padStart(3, '0')}`;

        console.log(`Updating partner: ${partner.partnerName} (${partner.partnerId}) -> ${newPartnerId}`);

        try {
            await prisma.partner.update({
                where: { id: partner.id },
                data: { partnerId: newPartnerId }
            });
        } catch (error) {
            console.error(`Error updating partner ${partner.partnerId}:`, error);
        }
    }

    console.log('Migration completed.');
}

migratePartners()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
