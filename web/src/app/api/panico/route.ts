import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { serverPusher } from "@/lib/pusher";

const prisma = new PrismaClient();

export async function POST(request: Request) {
	try {
		const { imei } = await request.json();

		if (!imei) {
			return NextResponse.json(
				{ error: "Payload incompleto. Requer imei." },
				{ status: 400 },
			);
		}

		// Busca a Vítima usando o imei do DAV
		const dispositivo = await prisma.dispositivo.findUnique({
			where: { imei },
			include: { monitorado: true },
		});

		if (dispositivo?.tipo !== "DAV") {
			return NextResponse.json(
				{ error: "DAV não encontrado ou tipo incorreto." },
				{ status: 404 },
			);
		}

		if (!dispositivo.monitorado) {
			return NextResponse.json(
				{ error: "DAV não possui vítima vinculada." },
				{ status: 400 },
			);
		}

		// Grava o Alerta Crítico de Pânico
		const alerta = await prisma.alerta.create({
			data: {
				monitoradoId: dispositivo.monitorado.id,
				tipo: "BOTAO_PANICO",
				nivel: "CRITICO",
				anotacaoOperador: "ACIONAMENTO MANUAL PELO DAV (APP VÍTIMA)",
			},
		});

		// Emite para o mapa tático via Pusher
		serverPusher.trigger("map-channel", "alerta", alerta);

		return NextResponse.json(
			{ success: true, alertaId: alerta.id },
			{ status: 201 },
		);
	} catch (error: unknown) {
		const errorMessage =
			error instanceof Error ? error.message : "Erro desconhecido";
		console.error("Erro no Botão de Pânico:", error);
		return NextResponse.json(
			{ error: "Erro interno no servidor", details: errorMessage },
			{ status: 500 },
		);
	}
}
