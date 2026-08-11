import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { systemEmitter } from "@/lib/eventEmitter";

const prisma = new PrismaClient();

// Haversine formula para calcular a distância em metros entre duas coordenadas
function calculateDistanceMeters(
	lat1: number,
	lon1: number,
	lat2: number,
	lon2: number,
) {
	const R = 6371e3; // Raio da Terra em metros
	const φ1 = (lat1 * Math.PI) / 180;
	const φ2 = (lat2 * Math.PI) / 180;
	const Δφ = ((lat2 - lat1) * Math.PI) / 180;
	const Δλ = ((lon2 - lon1) * Math.PI) / 180;

	const a =
		Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
		Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

	return R * c;
}

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

		// 4. Lógica de Geofencing (Exemplo simplificado para MVP: Agressor se aproxima da Vítima)
		// Se o dispositivo for de um AGRESSOR, vamos checar a distância com a última posição da sua VÍTIMA.
		const monitorado = dispositivo.monitorado;
		if (
			monitorado &&
			monitorado.tipo === "AGRESSOR" &&
			monitorado.medidasComoAgressor.length > 0
		) {
			for (const medida of monitorado.medidasComoAgressor) {
				if (medida.status !== "ATIVA") continue;

				// Busca o dispositivo da vítima para pegar a última telemetria dela
				const vitima = await prisma.monitorado.findUnique({
					where: { id: medida.vitimaId },
					include: {
						dispositivo: {
							include: {
								telemetrias: {
									orderBy: { timestamp: "desc" },
									take: 1,
								},
							},
						},
					},
				});

				const ultimaPosicaoVitima = vitima?.dispositivo?.telemetrias[0];

				if (ultimaPosicaoVitima) {
					const dist = calculateDistanceMeters(
						telemetria.lat,
						telemetria.lng,
						ultimaPosicaoVitima.lat,
						ultimaPosicaoVitima.lng,
					);

					if (dist <= medida.raioProtecaoMetros) {
						// Violação! Agressor entrou no raio da vítima
						const alertaAproximacao = await prisma.alerta.create({
							data: {
								monitoradoId: monitorado.id,
								tipo: "APROXIMACAO_VITIMA",
								nivel: "CRITICO",
								anotacaoOperador: `Distância: ${Math.round(dist)}m. Limite: ${medida.raioProtecaoMetros}m`,
							},
						});

						systemEmitter.emit("novo_alerta", alertaAproximacao);
					}
				}
			}
		}

		// Dispara a telemetria pro frontend com os dados amigáveis
		systemEmitter.emit("nova_telemetria", {
			dispositivoId: dispositivo.id,
			imei: dispositivo.imei,
			tipoDispositivo: dispositivo.tipo,
			monitorado: dispositivo.monitorado
				? {
						id: dispositivo.monitorado.id,
						nome: dispositivo.monitorado.nome,
						tipo: dispositivo.monitorado.tipo,
					}
				: null,
			lat: telemetria.lat,
			lng: telemetria.lng,
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
