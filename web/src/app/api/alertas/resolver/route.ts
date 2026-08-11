import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function POST(req: Request) {
	try {
		const { alertaId, anotacaoOperador } = await req.json();

		if (!alertaId) {
			return NextResponse.json(
				{ error: "alertaId é obrigatório" },
				{ status: 400 },
			);
		}

		const alertaAtualizado = await prisma.alerta.update({
			where: { id: alertaId },
			data: {
				reconhecido: true,
				reconhecidoPor: "Operador (Despacho)",
				anotacaoOperador: anotacaoOperador || "Reconhecido sem anotação",
			},
		});

		return NextResponse.json(alertaAtualizado, { status: 200 });
	} catch (error) {
		console.error("Erro ao despachar alerta:", error);
		return NextResponse.json(
			{ error: "Erro interno ao atualizar alerta" },
			{ status: 500 },
		);
	}
}
