import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const {
			numeroProcesso,
			agressorId,
			vitimaId,
			raioProtecaoMetros,
			juizo,
			varaCriminal,
			observacoes,
		} = body;

		if (!numeroProcesso) {
			return NextResponse.json({ error: "Número do Processo é obrigatório." }, { status: 400 });
		}
		if (!agressorId) {
			return NextResponse.json({ error: "Por favor, selecione um Agressor válido." }, { status: 400 });
		}
		if (!vitimaId) {
			return NextResponse.json({ error: "Por favor, selecione uma Vítima válida." }, { status: 400 });
		}
		if (!raioProtecaoMetros) {
			return NextResponse.json({ error: "O Raio de Proteção é obrigatório." }, { status: 400 });
		}

		const medida = await prisma.medidaProtetiva.create({
			data: {
				numeroProcesso,
				agressorId,
				vitimaId,
				raioProtecaoMetros: Number.parseInt(raioProtecaoMetros, 10),
				juizo: juizo || null,
				varaCriminal: varaCriminal || null,
				observacoes: observacoes || null,
				status: "ATIVA",
				dataInicio: new Date(),
			},
		});

		return NextResponse.json(medida, { status: 201 });
	} catch (error: unknown) {
		const msg = error instanceof Error ? error.message : "Erro interno";
		return NextResponse.json(
			{ error: "Erro ao criar medida protetiva", details: msg },
			{ status: 500 },
		);
	}
}
