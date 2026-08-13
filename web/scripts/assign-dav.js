const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    // 1. Acha a vítima mais recente
    const vitima = await prisma.monitorado.findFirst({
        where: { tipo: "VITIMA" },
        orderBy: { criadoEm: "desc" },
        include: { dispositivo: true }
    });

    if (!vitima) {
        console.log("Nenhuma vítima encontrada no banco de dados.");
        return;
    }

    console.log(`Vítima encontrada: ${vitima.nome} (CPF: ${vitima.cpf})`);

    if (vitima.dispositivo) {
        console.log(`Vítima já tem um dispositivo: IMEI ${vitima.dispositivo.imei}`);
        return;
    }

    // 2. Procura um DAV no estoque ou cria um novo
    let dav = await prisma.dispositivo.findFirst({
        where: { tipo: "DAV", status: "ESTOQUE" }
    });

    if (!dav) {
        console.log("Nenhum DAV no estoque. Criando um novo...");
        dav = await prisma.dispositivo.create({
            data: {
                imei: "999888777666555",
                serial: "DAV-MASTER-01",
                tipo: "DAV",
                status: "ESTOQUE",
                bateriaAtual: 100
            }
        });
    }

    // 3. Vincula o DAV à Vítima e muda o status
    await prisma.monitorado.update({
        where: { id: vitima.id },
        data: {
            dispositivoId: dav.id
        }
    });

    await prisma.dispositivo.update({
        where: { id: dav.id },
        data: { status: "ATIVO" }
    });

    console.log(`Sucesso! DAV (IMEI: ${dav.imei}) vinculado à Vítima ${vitima.nome}.`);
    console.log(`Você já pode fazer login no app Mobile usando o CPF: ${vitima.cpf}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
