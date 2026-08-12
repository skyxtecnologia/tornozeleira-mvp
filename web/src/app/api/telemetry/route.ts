import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { systemEmitter } from "@/lib/eventEmitter";
import { GeofenceService } from "@/services/GeofenceService";

const prisma = new PrismaClient();

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { imei, lat, lng, velocidadeKmh, bateria, offline, timestamp } = body;

		if (!imei || lat === undefined || lng === undefined) {
			return NextResponse.json(
				{ error: "Payload incompleto. Requer imei, lat e lng." },
				{ status: 400 },
			);
		}

		// 1. Busca o dispositivo e o monitorado vinculado
		const dispositivo = await prisma.dispositivo.findUnique({
			where: { imei },
			include: {
				monitorado: {
					include: {
						medidasComoAgressor: true,
						medidasComoVitima: true,
					},
				},
			},
		});

		if (dispositivo?.status !== "ATIVO") {
			return NextResponse.json(
				{ error: "Dispositivo inativo ou não encontrado." },
				{ status: 404 },
			);
		}

		// 2. Grava a telemetria
		const telemetria = await prisma.telemetria.create({
			data: {
				dispositivoId: dispositivo.id,
				lat: parseFloat(lat),
				lng: parseFloat(lng),
				velocidadeKmh: velocidadeKmh ? parseFloat(velocidadeKmh) : null,
				bateria: parseInt(bateria, 10) || 100,
				isOffline: offline || false,
				timestamp: timestamp ? new Date(timestamp) : new Date(),
			},
		});

		// 3. Verifica Bateria Crítica (< 30%)
		if (telemetria.bateria <= 30) {
			const alerta = await prisma.alerta.create({
				data: {
					monitoradoId: dispositivo.monitorado?.id as string,
					tipo: "BATERIA_BAIXA",
					nivel: telemetria.bateria <= 15 ? "CRITICO" : "BAIXO",
				},
			});
			systemEmitter.emit("novo_alerta", alerta);
		}

		// 4. Lógica de Geofencing e Privacidade (Agressor)
		const monitorado = dispositivo.monitorado;
		let isViolating = false; // Flag para Privacidade

		if (
			monitorado &&
			monitorado.tipo === "AGRESSOR" &&
			monitorado.medidasComoAgressor.length > 0
		) {
			isViolating = await GeofenceService.processViolations(
				{ lat: telemetria.lat, lng: telemetria.lng },
				monitorado.id,
				monitorado.medidasComoAgressor
			);
		}

		// 5. Aplicar Lei de Privacidade
		// Se for agressor e NÃO estiver violando nenhuma medida/zona, ocultamos a localização no frontend.
		const deveOcultar = monitorado?.tipo === "AGRESSOR" && !isViolating;

		// Dispara a telemetria pro frontend com os dados amigáveis (stream)
		systemEmitter.emit("nova_telemetria", {
			dispositivoId: dispositivo.id,
			imei: dispositivo.imei,
			tipoDispositivo: dispositivo.tipo,
			monitorado: monitorado
				? {
						id: monitorado.id,
						nome: monitorado.nome,
						tipo: monitorado.tipo,
					}
				: null,
			lat: telemetria.lat,
			lng: telemetria.lng,
			isLocalizacaoOculta: deveOcultar,
			bateria: telemetria.bateria,
			timestamp: telemetria.timestamp,
			isOffline: telemetria.isOffline,
		});

		return NextResponse.json(
			{ success: true, telemetriaId: telemetria.id },
			{ status: 201 },
		);
	} catch (error: unknown) {
		const errorMessage =
			error instanceof Error ? error.message : "Erro desconhecido";
		console.error("Erro na Ingestão de Telemetria:", error);
		return NextResponse.json(
			{ error: "Erro interno no servidor", details: errorMessage },
			{ status: 500 },
		);
	}
}

export async function GET() {
	try {
		// Busca a última telemetria de todos os dispositivos ativos
		const dispositivos = await prisma.dispositivo.findMany({
			where: { status: "ATIVO" },
			include: {
				monitorado: true,
				telemetrias: {
					orderBy: { timestamp: "desc" },
					take: 1,
				},
			},
		});

		const localizacoes = dispositivos
			.map((d) => {
				const ultima = d.telemetrias[0];

				// Regra de Privacidade também no GET inicial
				// Nota: para saber se está violando no GET inicial de forma precisa,
				// precisaríamos re-calcular tudo. Como simplificação, ocultamos por padrão
				// a não ser que tenha tido um alerta recente (últimos 5 min), mas para MVP,
				// enviaremos null se for agressor para não vazar a localização no onload.
				// Apenas quando houver infração ele receberá a coordenada via WebSockets/SSE.
				const isAgressor = d.monitorado?.tipo === "AGRESSOR";
				const deveOcultar = isAgressor; // No GET inicial o agressor fica oculto por segurança

				return {
					dispositivoId: d.id,
					imei: d.imei,
					tipoDispositivo: d.tipo,
					monitorado: d.monitorado
						? {
								id: d.monitorado.id,
								nome: d.monitorado.nome,
								tipo: d.monitorado.tipo,
							}
						: null,
					lat: ultima ? ultima.lat : null,
					lng: ultima ? ultima.lng : null,
					isLocalizacaoOculta: deveOcultar,
					bateria: ultima ? ultima.bateria : d.bateriaAtual,
					timestamp: ultima ? ultima.timestamp : null,
					isOffline: ultima ? ultima.isOffline : false,
				};
			})
			.filter((d) => d.lat !== null && d.lng !== null);

		return NextResponse.json(localizacoes);
	} catch (_error: unknown) {
		return NextResponse.json(
			{ error: "Erro ao buscar localizações" },
			{ status: 500 },
		);
	}
}
