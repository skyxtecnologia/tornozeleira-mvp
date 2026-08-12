import { PrismaClient, Monitorado, MedidaProtetiva, Telemetria } from "@prisma/client";
import { serverPusher } from "@/lib/pusher";

const prisma = new PrismaClient();

export class GeofenceService {
	/**
	 * Haversine formula para calcular a distância em metros entre duas coordenadas
	 */
	static calculateDistanceMeters(
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

	/**
	 * Processa as regras de geofence (distância da vítima e zonas fixas) para um agressor.
	 * Retorna 'true' se alguma regra foi violada (isViolating).
	 */
	static async processViolations(
		telemetria: { lat: number; lng: number },
		monitoradoId: string,
		medidasComoAgressor: MedidaProtetiva[]
	): Promise<boolean> {
		let isViolating = false;

		for (const medida of medidasComoAgressor) {
			if (medida.status !== "ATIVA") continue;

			// 1. Checa aproximação da vítima (Raio dinâmico)
			const vitima = await prisma.monitorado.findUnique({
				where: { id: medida.vitimaId },
				include: {
					dispositivo: {
						include: {
							telemetrias: { orderBy: { timestamp: "desc" }, take: 1 },
						},
					},
				},
			});

			const ultimaPosicaoVitima = vitima?.dispositivo?.telemetrias[0];
			if (ultimaPosicaoVitima) {
				const dist = this.calculateDistanceMeters(
					telemetria.lat,
					telemetria.lng,
					ultimaPosicaoVitima.lat,
					ultimaPosicaoVitima.lng,
				);

				if (dist <= medida.raioProtecaoMetros) {
					isViolating = true;
					const alertaAproximacao = await prisma.alerta.create({
						data: {
							monitoradoId,
							tipo: "APROXIMACAO_VITIMA",
							nivel: "CRITICO",
							anotacaoOperador: `Distância: ${Math.round(dist)}m. Limite: ${medida.raioProtecaoMetros}m`,
						},
					});
					serverPusher.trigger("map-channel", "alerta", alertaAproximacao);
				}
			}

			// 2. Checa Zonas Estáticas (Exclusão)
			const zonas = await prisma.zona.findMany({
				where: {
					medidaProtetivaId: medida.id,
					ativa: true,
					tipo: "EXCLUSAO",
				},
			});

			for (const zona of zonas) {
				if (zona.formato === "CIRCULO" && zona.raioMetros) {
					const coords = JSON.parse(zona.coordenadas);
					const centro = coords[0];
					if (centro) {
						const distZona = this.calculateDistanceMeters(
							telemetria.lat,
							telemetria.lng,
							centro.lat,
							centro.lng,
						);
						if (distZona <= zona.raioMetros) {
							isViolating = true;
							const alertaZona = await prisma.alerta.create({
								data: {
									monitoradoId,
									tipo: "VIOLACAO_ZONA",
									nivel: "ALTO",
									anotacaoOperador: `Invasão de zona. Distância ao centro: ${Math.round(distZona)}m`,
								},
							});
							serverPusher.trigger("map-channel", "alerta", alertaZona);
						}
					}
				}
			}
		}

		return isViolating;
	}
}
