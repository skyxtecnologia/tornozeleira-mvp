const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    const medidas = await prisma.medidaProtetiva.findMany({
        include: { agressor: true, vitima: true }
    });
    console.log("MEDIDAS FOUND:", medidas.length);
    console.log(JSON.stringify(medidas, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
