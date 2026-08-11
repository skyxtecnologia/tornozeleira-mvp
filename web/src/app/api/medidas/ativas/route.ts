import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET() {
	try {
		const medidasAtivas = await prisma.medidaProtetiva.findMany({
			where: { status: "ATIVA" },
			include: {
				agressor: {
					select: {
						id: true,
						nome: true,
						dispositivoId: true,
					},
				},
				vitima: {
					select: {
						id: true,
						nome: true,
						dispositivoId: true,
					},
				},
				zonas: true,
			},
		});

		// Filtramos para garantir que ambos possuem dispositivo vinculado
		const filtradas = medidasAtivas.filter(
			(m) => m.agressor.dispositivoId && m.vitima.dispositivoId,
		);

		return NextResponse.json(filtradas, { status: 200 });
	} catch (error) {
		console.error("Erro ao buscar medidas ativas:", error);
		return NextResponse.json(
			{ error: "Erro interno ao buscar medidas ativas" },
			{ status: 500 },
		);
	}
}
