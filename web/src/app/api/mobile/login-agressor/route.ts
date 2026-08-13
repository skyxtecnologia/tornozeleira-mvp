import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function POST(request: Request) {
	try {
		const { cpf } = await request.json();

		if (!cpf) {
			return NextResponse.json(
				{ error: "CPF é obrigatório" },
				{ status: 400 },
			);
		}

		// Busca o agressor e seu dispositivo
		const agressor = await prisma.monitorado.findFirst({
			where: { 
				cpf,
				tipo: "AGRESSOR"
			},
			include: {
				dispositivo: true
			}
		});

		if (!agressor) {
			return NextResponse.json(
				{ error: "Agressor não encontrado no sistema." },
				{ status: 404 },
			);
		}

		if (!agressor.dispositivo) {
			return NextResponse.json(
				{ error: "Você não possui uma Tornozeleira vinculada. A Central precisa cadastrar um dispositivo para você." },
				{ status: 403 },
			);
		}

		return NextResponse.json({
			success: true,
			agressor: {
				id: agressor.id,
				nome: agressor.nome,
			},
			dispositivo: {
				imei: agressor.dispositivo.imei,
			}
		});
	} catch (error) {
		console.error("Erro no login mobile (agressor):", error);
		return NextResponse.json(
			{ error: "Erro interno no servidor" },
			{ status: 500 },
		);
	}
}
