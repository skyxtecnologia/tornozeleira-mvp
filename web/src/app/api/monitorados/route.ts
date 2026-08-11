import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET() {
	try {
		const monitorados = await prisma.monitorado.findMany({
			include: {
				dispositivo: true,
			},
			orderBy: {
				criadoEm: "desc",
			},
		});
		return NextResponse.json(monitorados);
	} catch (_error: unknown) {
		return NextResponse.json(
			{ error: "Erro ao buscar monitorados" },
			{ status: 500 },
		);
	}
}

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { nome, cpf, tipo, dispositivoId, telefone, endereco } = body;

		if (!nome || !cpf || !tipo) {
			return NextResponse.json(
				{ error: "Campos obrigatórios ausentes" },
				{ status: 400 },
			);
		}

		const monitorado = await prisma.monitorado.create({
			data: {
				nome,
				cpf,
				tipo,
				telefone,
				endereco,
				dispositivoId: dispositivoId || null,
			},
		});

		return NextResponse.json(monitorado, { status: 201 });
	} catch (error: unknown) {
		const msg = error instanceof Error ? error.message : "Erro interno";
		return NextResponse.json(
			{ error: "Erro ao criar monitorado", details: msg },
			{ status: 500 },
		);
	}
}
