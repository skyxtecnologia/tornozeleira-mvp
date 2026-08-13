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

		// Busca a vítima e seu dispositivo
		const vitima = await prisma.monitorado.findFirst({
			where: { 
				cpf,
				tipo: "VITIMA"
			},
			include: {
				dispositivo: true
			}
		});

		if (!vitima) {
			return NextResponse.json(
				{ error: "Vítima não encontrada no sistema." },
				{ status: 404 },
			);
		}

		if (!vitima.dispositivo) {
			return NextResponse.json(
				{ error: "Você não possui um Dispositivo (DAV) vinculado. A Central precisa cadastrar um dispositivo para você." },
				{ status: 403 },
			);
		}

		return NextResponse.json({
			success: true,
			vitima: {
				id: vitima.id,
				nome: vitima.nome,
			},
			dispositivo: {
				imei: vitima.dispositivo.imei,
			}
		});
	} catch (error) {
		console.error("Erro no login mobile:", error);
		return NextResponse.json(
			{ error: "Erro interno no servidor" },
			{ status: 500 },
		);
	}
}
