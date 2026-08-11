import { createClient } from "@libsql/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "@prisma/client";

const libsql = createClient({ url: "file:dev.db" });
const adapter = new PrismaLibSql(libsql);
const prisma = new PrismaClient({ adapter });

async function main() {
	// Limpa o banco atual
	await prisma.telemetria.deleteMany();
	await prisma.alerta.deleteMany();
	await prisma.zona.deleteMany();
	await prisma.medidaProtetiva.deleteMany();
	await prisma.monitorado.deleteMany();
	await prisma.dispositivo.deleteMany();

	// Cria Dispositivos
	const tornozeleira = await prisma.dispositivo.create({
		data: {
			imei: "888888888888",
			serial: "TRNZ-001",
			tipo: "TORNOZELEIRA",
			status: "ATIVO",
			bateriaAtual: 85,
		},
	});

	const dav = await prisma.dispositivo.create({
		data: {
			imei: "999999999999",
			serial: "DAV-001",
			tipo: "DAV",
			status: "ATIVO",
			bateriaAtual: 90,
		},
	});

	// Cria Pessoas
	const agressor = await prisma.monitorado.create({
		data: {
			nome: "João Pedro Silva (Mock)",
			cpf: "111.111.111-11",
			tipo: "AGRESSOR",
			dispositivoId: tornozeleira.id,
		},
	});

	const vitima = await prisma.monitorado.create({
		data: {
			nome: "Maria Souza (Mock)",
			cpf: "222.222.222-22",
			tipo: "VITIMA",
			dispositivoId: dav.id,
		},
	});

	// Cria Medida Protetiva (Raio de 500 metros)
	await prisma.medidaProtetiva.create({
		data: {
			numeroProcesso: "001/2026",
			agressorId: agressor.id,
			vitimaId: vitima.id,
			raioProtecaoMetros: 500,
			dataInicio: new Date(),
		},
	});

	console.log(
		"✅ Seed executado com sucesso! Agressor e Vítima de teste criados.",
	);
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
