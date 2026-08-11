import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

// Criar uma nova zona estática
export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { medidaProtetivaId, tipo, formato, coordenadas, raioMetros } = body;

		if (!medidaProtetivaId || !tipo || !coordenadas) {
			return NextResponse.json(
				{ error: "Campos obrigatórios ausentes" },
				{ status: 400 },
			);
		}

		const zona = await prisma.zona.create({
			data: {
				medidaProtetivaId,
				tipo, // EXCLUSAO, INCLUSAO
				formato: formato || "CIRCULO",
				coordenadas, // String JSON [{lat, lng}]
				raioMetros: Number(raioMetros) || null,
			},
		});

		return NextResponse.json(zona, { status: 201 });
	} catch (error: unknown) {
		const msg = error instanceof Error ? error.message : "Erro interno";
		return NextResponse.json(
			{ error: "Erro ao criar zona de proteção", details: msg },
			{ status: 500 },
		);
	}
}

// Deletar uma zona
export async function DELETE(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const id = searchParams.get("id");

		if (!id) {
			return NextResponse.json({ error: "ID não fornecido" }, { status: 400 });
		}

		await prisma.zona.delete({
			where: { id },
		});

		return NextResponse.json({ success: true }, { status: 200 });
	} catch (error: unknown) {
		const msg = error instanceof Error ? error.message : "Erro interno";
		return NextResponse.json(
			{ error: "Erro ao deletar zona de proteção", details: msg },
			{ status: 500 },
		);
	}
}
