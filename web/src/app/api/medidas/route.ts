import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { numeroProcesso, agressorId, vitimaId, raioProtecaoMetros, juizo } =
			body;

		if (!numeroProcesso || !agressorId || !vitimaId || !raioProtecaoMetros) {
			return NextResponse.json(
				{ error: "Campos obrigatórios ausentes" },
				{ status: 400 },
			);
		}

		const medida = await prisma.medidaProtetiva.create({
			data: {
				numeroProcesso,
				agressorId,
				vitimaId,
				raioProtecaoMetros: Number.parseInt(raioProtecaoMetros, 10),
				juizo: juizo || null,
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
