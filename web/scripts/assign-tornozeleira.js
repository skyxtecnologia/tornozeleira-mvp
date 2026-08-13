const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    const agressor = await prisma.monitorado.findFirst({
        where: { tipo: "AGRESSOR" },
        orderBy: { criadoEm: "desc" },
        include: { dispositivo: true }
    });

    if (!agressor) {
        console.log("Nenhum agressor encontrado.");
        return;
    }

    console.log(`Agressor encontrado: ${agressor.nome}`);

    if (agressor.dispositivoId) {
        console.log("Agressor já tem tornozeleira:", agressor.dispositivoId);
        return;
    }

    let tornozeleira = await prisma.dispositivo.findFirst({
        where: { tipo: "TORNOZELEIRA", status: "ESTOQUE" }
    });

    if (!tornozeleira) {
        console.log("Nenhuma tornozeleira no estoque, criando uma...");
        tornozeleira = await prisma.dispositivo.create({
            data: {
                imei: "111222333444555",
                serial: "TRNZ-TEST-01",
                tipo: "TORNOZELEIRA",
                status: "ESTOQUE",
                bateriaAtual: 100
            }
        });
    }

    await prisma.monitorado.update({
        where: { id: agressor.id },
        data: { dispositivoId: tornozeleira.id }
    });

    await prisma.dispositivo.update({
        where: { id: tornozeleira.id },
        data: { status: "ATIVO" }
    });

    console.log("Sucesso! Tornozeleira vinculada ao Agressor.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
