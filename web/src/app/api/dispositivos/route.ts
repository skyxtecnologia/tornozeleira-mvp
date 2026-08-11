import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET() {
	try {
		const dispositivos = await prisma.dispositivo.findMany({
			orderBy: {
				criadoEm: "desc",
			},
		});
		return NextResponse.json(dispositivos);
	} catch (_error: unknown) {
		return NextResponse.json(
			{ error: "Erro ao buscar dispositivos" },
			{ status: 500 },
		);
	}
}

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { imei, serial, tipo } = body;

		if (!imei || !serial || !tipo) {
			return NextResponse.json(
				{ error: "Campos obrigatórios ausentes" },
				{ status: 400 },
			);
		}

		const dispositivo = await prisma.dispositivo.create({
			data: {
				imei,
				serial,
				tipo,
				status: "ESTOQUE",
				bateriaAtual: 100,
			},
		});

		return NextResponse.json(dispositivo, { status: 201 });
	} catch (error: unknown) {
		const msg = error instanceof Error ? error.message : "Erro interno";
		return NextResponse.json(
			{ error: "Erro ao criar dispositivo", details: msg },
			{ status: 500 },
		);
	}
}
