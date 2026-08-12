"use client";

import { useEffect, useMemo, useState } from "react";
import MapComponent, { Layer, Marker, Source } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import circle from "@turf/circle";
import {
	Activity,
	WifiOff,
	ShieldAlert,
	Crosshair,
	Users,
	ShieldCheck,
	Eye,
	X,
	MapPin,
	AlertTriangle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AlertModal } from "@/components/map/AlertModal";
import { StatusCards } from "@/components/map/StatusCards";
import { SidebarList } from "@/components/map/SidebarList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Pusher from "pusher-js";

// Estilo 100% gratuito e open-source usando OpenStreetMap Raster Tiles
const MAPLIBRE_STYLE = {
	version: 8,
	sources: {
		osm: {
			type: "raster",
			tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
			tileSize: 256,
			attribution: "&copy; OpenStreetMap Contributors",
		},
	},
	layers: [
		{
			id: "osm-tiles",
			type: "raster",
			source: "osm",
			minzoom: 0,
			maxzoom: 19,
		},
	],
};

interface Localizacao {
	dispositivoId: string;
	imei: string;
	tipoDispositivo: string;
	monitorado: {
		id: string;
		nome: string;
		tipo: string;
	} | null;
	lat: number | null;
	lng: number | null;
	bateria: number;
	timestamp: string;
	isOffline: boolean;
	isLocalizacaoOculta?: boolean;
}

interface Alerta {
	id: string;
	tipo: string;
	nivel: string;
	anotacaoOperador?: string;
}

interface Zona {
	id: string;
	tipo: string;
	formato: string;
	coordenadas: string;
	raioMetros: number | null;
}

interface MedidaAtiva {
	id: string;
	numeroProcesso: string;
	raioProtecaoMetros: number;
	agressor: { id: string; nome: string; dispositivoId: string };
	vitima: { id: string; nome: string; dispositivoId: string };
	zonas: Zona[];
}

export interface MedidaProcessada extends MedidaAtiva {
	locAgressor?: Localizacao;
	locVitima?: Localizacao;
	distancia?: number | null;
	statusRisco: string;
}

function calcDist(lat1: number, lon1: number, lat2: number, lon2: number) {
	const R = 6371e3;
	const φ1 = (lat1 * Math.PI) / 180;
	const φ2 = (lat2 * Math.PI) / 180;
	const Δφ = ((lat2 - lat1) * Math.PI) / 180;
	const Δλ = ((lon2 - lon1) * Math.PI) / 180;
	const a =
		Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
		Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
	return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export default function TacticalMonitorPage() {
	const [pontos, setPontos] = useState<Localizacao[]>([]);
	const [alertaAtivo, setAlertaAtivo] = useState<Alerta | null>(null);
	const [anotacaoDespacho, setAnotacaoDespacho] = useState("");
	const [isDespachando, setIsDespachando] = useState(false);
	const [medidas, setMedidas] = useState<MedidaAtiva[]>([]);
	const [historicoRastro, setHistoricoRastro] = useState<
		Record<string, { lng: number; lat: number }[]>
	>({});

	// Estado do Mapa Modal
	const [medidaSelecionada, setMedidaSelecionada] =
		useState<MedidaProcessada | null>(null);
	
	// Estado de Override de Privacidade (Modo Teste)
	const [forceVisibility, setForceVisibility] = useState(false);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const [resPontos, resMedidas] = await Promise.all([
					fetch("/api/telemetry"),
					fetch("/api/medidas/ativas"),
				]);
				if (resPontos.ok) {
					const data = await resPontos.json();
					setPontos(data);
					// Inicializa o histórico com as posições atuais
					const initialHistory: Record<string, { lng: number; lat: number }[]> =
						{};
					data.forEach((p: Localizacao) => {
						if (p.lng !== null && p.lat !== null) {
							initialHistory[p.dispositivoId] = [{ lng: p.lng, lat: p.lat }];
						} else {
							initialHistory[p.dispositivoId] = [];
						}
					});
					setHistoricoRastro(initialHistory);
				}
				if (resMedidas.ok) setMedidas(await resMedidas.json());
			} catch (error) {
				console.error("Erro ao buscar dados do mapa", error);
			}
		};
		fetchData();

		// Inicializar Pusher
		const pusher = new Pusher("b4c167b75eb392ad4548", {
			cluster: "sa1",
		});

		const channel = pusher.subscribe("map-channel");

		channel.bind("telemetria", (novaLocalizacao: Localizacao) => {
			try {
				setPontos((prevPontos) => {
					const index = prevPontos.findIndex(
						(p) => p.dispositivoId === novaLocalizacao.dispositivoId,
					);
					if (index !== -1) {
						const novosPontos = [...prevPontos];
						novosPontos[index] = novaLocalizacao;
						return novosPontos;
					}
					return [...prevPontos, novaLocalizacao];
				});

				setHistoricoRastro((prev) => {
					const rastroAnterior = prev[novaLocalizacao.dispositivoId] || [];
					const lastPoint = rastroAnterior[rastroAnterior.length - 1];
					if (
						lastPoint &&
						lastPoint.lat === novaLocalizacao.lat &&
						lastPoint.lng === novaLocalizacao.lng
					) {
						return prev;
					}

					if (novaLocalizacao.lng === null || novaLocalizacao.lat === null) {
						return prev;
					}

					return {
						...prev,
						[novaLocalizacao.dispositivoId]: [
							...rastroAnterior,
							{ lng: novaLocalizacao.lng, lat: novaLocalizacao.lat },
						].slice(-500),
					};
				});
			} catch (err) {
				console.error("Erro ao processar telemetria do Pusher", err);
			}
		});

		channel.bind("alerta", (alerta: Alerta) => {
			setAlertaAtivo((prev) => {
				if (prev && prev.id === alerta.id) return prev;
				return alerta;
			});
		});

		return () => {
			channel.unbind_all();
			channel.unsubscribe();
		};
	}, []);

	const handleDespacharViatura = async () => {
		if (!alertaAtivo?.id) return;
		setIsDespachando(true);
		try {
			await fetch("/api/alertas/resolver", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					alertaId: alertaAtivo.id,
					anotacaoOperador: anotacaoDespacho,
				}),
			});
			setAlertaAtivo(null);
			setAnotacaoDespacho("");
		} catch (e) {
			console.error(e);
		} finally {
			setIsDespachando(false);
		}
	};

	// Atualiza as distâncias e classifica risco continuamente
	const medidasComDistancia = useMemo(() => {
		const result = medidas.map((m) => {
			const locAgressor = pontos.find(
				(p) => p.dispositivoId === m.agressor.dispositivoId,
			);
			const locVitima = pontos.find(
				(p) => p.dispositivoId === m.vitima.dispositivoId,
			);

			let distancia = null;
			let statusRisco = "DESCONHECIDO";

			if (
				locAgressor &&
				locVitima &&
				locAgressor.lat !== null &&
				locAgressor.lng !== null &&
				locVitima.lat !== null &&
				locVitima.lng !== null
			) {
				distancia = calcDist(
					locAgressor.lat,
					locAgressor.lng,
					locVitima.lat,
					locVitima.lng,
				);

				if (distancia <= m.raioProtecaoMetros) {
					statusRisco = "CRITICO";
				} else if (distancia <= m.raioProtecaoMetros * 1.2) {
					statusRisco = "PERIGO";
				} else if (distancia <= m.raioProtecaoMetros * 2) {
					statusRisco = "ATENCAO";
				} else {
					statusRisco = "SEGURO";
				}
			}

			return {
				...m,
				locAgressor,
				locVitima,
				distancia,
				statusRisco,
			};
		});

		const orderMap: Record<string, number> = {
			CRITICO: 1,
			PERIGO: 2,
			ATENCAO: 3,
			SEGURO: 4,
			DESCONHECIDO: 5,
		};

		return result.sort((a, b) => {
			const statusDiff = orderMap[a.statusRisco] - orderMap[b.statusRisco];
			if (statusDiff !== 0) return statusDiff;

			if (a.distancia !== null && b.distancia !== null) {
				return a.distancia - b.distancia;
			}
			return 0;
		});
	}, [medidas, pontos]);

	// Cores e Icones Táticos
	const getStatusTheme = (status: string) => {
		switch (status) {
			case "CRITICO":
				return {
					border: "border-red-500/50",
					gradient: "from-red-950/40 to-slate-950",
					text: "text-red-500",
					glow: "bg-red-500",
					icon: <AlertTriangle className="w-5 h-5 text-red-500" />,
				};
			case "PERIGO":
				return {
					border: "border-orange-500/50",
					gradient: "from-orange-950/40 to-slate-950",
					text: "text-orange-500",
					glow: "bg-orange-500",
					icon: <AlertTriangle className="w-5 h-5 text-orange-500" />,
				};
			case "ATENCAO":
				return {
					border: "border-amber-500/50",
					gradient: "from-amber-950/30 to-slate-950",
					text: "text-amber-500",
					glow: "bg-amber-500",
					icon: <Eye className="w-5 h-5 text-amber-500" />,
				};
			case "SEGURO":
				return {
					border: "border-emerald-500/30",
					gradient: "from-emerald-950/20 to-slate-950",
					text: "text-emerald-500",
					glow: "bg-emerald-500",
					icon: <ShieldCheck className="w-5 h-5 text-emerald-500" />,
				};
			default:
				return {
					border: "border-slate-800",
					gradient: "from-slate-900 to-slate-950",
					text: "text-slate-500",
					glow: "bg-slate-500",
					icon: <Crosshair className="w-5 h-5 text-slate-500" />,
				};
		}
	};

	// GeoJSONs da Vítima e do Agressor para o Mapa Modal
	const zonaExclusaoGeoJSON = useMemo(() => {
		if (
			!medidaSelecionada?.locVitima ||
			medidaSelecionada.locVitima.lat === null ||
			medidaSelecionada.locVitima.lng === null
		)
			return null;
		return circle(
			[medidaSelecionada.locVitima.lng, medidaSelecionada.locVitima.lat],
			medidaSelecionada.raioProtecaoMetros,
			{ steps: 64, units: "meters" },
		);
	}, [medidaSelecionada]);

	const rastroAgressorGeoJSON = useMemo(() => {
		if (!medidaSelecionada?.locAgressor) return null;
		
		// Respeita a privacidade: oculta o rastro a menos que esteja no override ou quebrando a regra
		if (medidaSelecionada.locAgressor.isLocalizacaoOculta && !forceVisibility) {
			return null;
		}

		const rastro =
			historicoRastro[medidaSelecionada.agressor.dispositivoId] || [];
		if (rastro.length < 2) return null; // Linha precisa de 2 pontos

		return {
			type: "Feature",
			geometry: {
				type: "LineString",
				coordinates: rastro.map((p) => [p.lng, p.lat]),
			},
		};
	}, [medidaSelecionada, historicoRastro]);

	const zonasFixasGeoJSON = useMemo(() => {
		if (!medidaSelecionada?.zonas || medidaSelecionada.zonas.length === 0)
			return null;

		const features = medidaSelecionada.zonas
			.map((z: Zona) => {
				try {
					const coords = JSON.parse(z.coordenadas);
					if (z.formato === "CIRCULO" && coords[0]) {
						return circle([coords[0].lng, coords[0].lat], z.raioMetros || 100, {
							steps: 64,
							units: "meters",
						});
					}
				} catch (e) {
					console.error("Erro ao parsear coordenadas da zona", e);
				}
				return null;
			})
			// biome-ignore lint/suspicious/noExplicitAny: GeoJSON type needs to be inferred
			.filter((f: any) => f !== null);

		if (features.length === 0) return null;

		return {
			type: "FeatureCollection",
			features: features,
		};
	}, [medidaSelecionada]);

	return (
		<div className="flex h-[calc(100vh-4rem)] bg-slate-950 overflow-hidden">
			{/* Main Map Area */}
			<div className="flex-1 relative">
				{/* Top Left Status Cards */}
				<div className="absolute top-4 left-4 z-10">
					<StatusCards
						medidasComDistancia={medidasComDistancia}
						forceVisibility={forceVisibility}
						setForceVisibility={setForceVisibility}
					/>
				</div>

				{/* Alert Modal Overlay (When a target is selected) */}
				{medidaSelecionada && (
					<AlertModal
						medidaSelecionada={medidaSelecionada}
						setMedidaSelecionada={setMedidaSelecionada}
						forceVisibility={forceVisibility}
						setForceVisibility={setForceVisibility}
					/>
				)}

				{/* The Actual Map */}
				<MapComponent
					initialViewState={
						medidaSelecionada
							? {
									longitude:
										medidaSelecionada.locAgressor &&
										medidaSelecionada.locAgressor.lng !== null &&
										medidaSelecionada.locVitima &&
										medidaSelecionada.locVitima.lng !== null
											? (medidaSelecionada.locAgressor.lng +
													medidaSelecionada.locVitima.lng) /
												2
											: medidaSelecionada.locAgressor?.lng || -41.776,
									latitude:
										medidaSelecionada.locAgressor &&
										medidaSelecionada.locAgressor.lat !== null &&
										medidaSelecionada.locVitima &&
										medidaSelecionada.locVitima.lat !== null
											? (medidaSelecionada.locAgressor.lat +
													medidaSelecionada.locVitima.lat) /
												2
											: medidaSelecionada.locAgressor?.lat || -22.378,
									zoom: 14.5,
								}
							: {
									longitude: -41.776, // Centro de Macaé
									latitude: -22.378,
									zoom: 12,
								}
					}
					style={{ width: "100%", height: "100%" }}
					// biome-ignore lint/suspicious/noExplicitAny: MAPLIBRE Style Format
					mapStyle={MAPLIBRE_STYLE as any}
				>
					{/* Zonas and Tracks - Only render if selected */}
					{medidaSelecionada && zonaExclusaoGeoJSON && (
						<Source
							id="zona-movel-source"
							type="geojson"
							// biome-ignore lint/suspicious/noExplicitAny: GeoJSON compatibility
							data={zonaExclusaoGeoJSON as any}
						>
							<Layer
								id="zona-movel-fill"
								type="fill"
								paint={{ "fill-color": "#3b82f6", "fill-opacity": 0.1 }}
							/>
							<Layer
								id="zona-movel-line"
								type="line"
								paint={{
									"line-color": "#3b82f6",
									"line-width": 2,
									"line-opacity": 0.6,
								}}
							/>
						</Source>
					)}

					{medidaSelecionada && zonasFixasGeoJSON && (
						<Source
							id="zonas-fixas-source"
							type="geojson"
							// biome-ignore lint/suspicious/noExplicitAny: GeoJSON compatibility
							data={zonasFixasGeoJSON as any}
						>
							<Layer
								id="zonas-fixas-fill"
								type="fill"
								paint={{ "fill-color": "#ef4444", "fill-opacity": 0.15 }}
							/>
							<Layer
								id="zonas-fixas-line"
								type="line"
								paint={{
									"line-color": "#ef4444",
									"line-width": 2,
									"line-dasharray": [2, 2],
								}}
							/>
						</Source>
					)}

					{medidaSelecionada && rastroAgressorGeoJSON && (
						<Source
							id="rastro-source"
							type="geojson"
							// biome-ignore lint/suspicious/noExplicitAny: GeoJSON compatibility
							data={rastroAgressorGeoJSON as any}
						>
							<Layer
								id="rastro-layer"
								type="line"
								paint={{
									"line-color": "#ef4444",
									"line-width": 4,
									"line-opacity": 0.8,
									"line-dasharray": [2, 1],
								}}
							/>
						</Source>
					)}

					{/* Global Points (Rendered for ALL targets) */}
					{pontos
						.filter((p) => p.lat !== null && p.lng !== null)
						.filter((p) => forceVisibility || !p.isLocalizacaoOculta)
						.map((ponto) => {
							const isVitima = ponto.tipoDispositivo === "DAV";
							
							let isEnvolvido = false;
							let isCritico = false;
							
							if (medidaSelecionada) {
								isEnvolvido =
									ponto.dispositivoId ===
										medidaSelecionada.agressor.dispositivoId ||
									ponto.dispositivoId ===
										medidaSelecionada.vitima.dispositivoId;
								isCritico = medidaSelecionada.statusRisco === "CRITICO";
							} else {
								// Se não há medida selecionada, destaque todos que estão em risco Crítico
								const medidaDoPonto = medidasComDistancia.find(
									m => m.agressor.dispositivoId === ponto.dispositivoId || m.vitima.dispositivoId === ponto.dispositivoId
								);
								if (medidaDoPonto && medidaDoPonto.statusRisco === "CRITICO") {
									isEnvolvido = true;
									isCritico = true;
								}
							}

							return (
								<Marker
									key={ponto.dispositivoId}
									longitude={ponto.lng as number}
									latitude={ponto.lat as number}
									anchor="bottom"
								>
									<div
										className={`relative flex items-center justify-center cursor-pointer group ${isEnvolvido ? "scale-125 z-50" : "opacity-70 hover:opacity-100 z-10"}`}
									>
										{isVitima && isEnvolvido && (
											<div className="absolute w-12 h-12 bg-blue-500/30 rounded-full animate-ping" />
										)}
										{!isVitima && isEnvolvido && isCritico && (
											<div className="absolute w-12 h-12 bg-red-500/30 rounded-full animate-ping" />
										)}
										<MapPin
											className={`drop-shadow-2xl transition-transform ${
												isEnvolvido ? "w-10 h-10" : "w-6 h-6"
											} ${
												isVitima
													? "text-blue-500 fill-blue-500/20"
													: "text-red-500 fill-red-500/20"
											}`}
										/>
										<div className="absolute top-10 bg-slate-900 border border-slate-700 text-white text-xs px-3 py-1.5 rounded-md shadow-xl whitespace-nowrap font-semibold tracking-wider uppercase hidden group-hover:block z-50">
											{ponto.monitorado?.nome || "Desconhecido"}
										</div>
									</div>
								</Marker>
							);
						})}
				</MapComponent>

				{/* HUD Overlay */}
				{medidaSelecionada && (
					<div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-30">
						<div className="w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] rounded-full border border-slate-500/30"></div>
						<div className="w-[25vw] h-[25vw] max-w-[300px] max-h-[300px] absolute rounded-full border border-slate-500/20"></div>
						<div className="absolute w-px h-full bg-slate-500/10"></div>
						<div className="absolute w-full h-px bg-slate-500/10"></div>
					</div>
				)}
			</div>

			{/* Sidebar List (Right) */}
			<SidebarList
				medidasComDistancia={medidasComDistancia}
				medidaSelecionada={medidaSelecionada}
				setMedidaSelecionada={setMedidaSelecionada}
				forceVisibility={forceVisibility}
			/>

			{/* Global Critical Alert Modal */}
			{alertaAtivo && (
				<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-lg">
					<div className="bg-slate-950 border border-red-900 rounded-2xl p-10 max-w-xl w-full shadow-[0_0_100px_rgba(239,68,68,0.2)] flex flex-col items-center animate-in zoom-in-95 duration-200">
						<div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mb-6 ring-1 ring-red-500/50">
							<div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center animate-ping absolute"></div>
							<AlertTriangle className="w-12 h-12 text-red-500 relative z-10" />
						</div>
						<h2 className="text-4xl font-black text-slate-50 uppercase tracking-widest text-center mb-2">
							Violação Crítica
						</h2>
						<p className="text-red-500 font-bold text-xl text-center mb-8">
							{alertaAtivo.tipo === "APROXIMACAO_VITIMA"
								? "AGRESSOR ENTROU NA ZONA DE PROTEÇÃO"
								: alertaAtivo.tipo === "BOTAO_PANICO"
									? "ACIONAMENTO MANUAL DE EMERGÊNCIA (DAV)"
									: "BATERIA EM NÍVEL CRÍTICO"}
						</p>

						<div className="w-full bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 mb-6">
							<div className="flex justify-between items-center border-b border-slate-800/50 pb-3">
								<span className="text-slate-400 font-semibold tracking-wider uppercase text-xs">
									Tipo do Evento
								</span>
								<span className="text-slate-100 font-mono font-bold">
									{alertaAtivo.tipo}
								</span>
							</div>
							<div className="flex justify-between items-center border-b border-slate-800/50 pb-3">
								<span className="text-slate-400 font-semibold tracking-wider uppercase text-xs">
									Nível de Ameaça
								</span>
								<span className="text-red-500 font-mono font-black text-lg">
									{alertaAtivo.nivel}
								</span>
							</div>
							{alertaAtivo.anotacaoOperador && (
								<div className="flex flex-col gap-1 pt-1">
									<span className="text-slate-400 font-semibold tracking-wider uppercase text-xs">
										Detalhes do Sistema
									</span>
									<span className="text-amber-400 font-mono text-sm leading-relaxed bg-amber-950/20 p-3 rounded-lg border border-amber-900/30">
										{alertaAtivo.anotacaoOperador}
									</span>
								</div>
							)}
						</div>

						<div className="w-full space-y-2 mb-8">
							<label
								htmlFor="despacho"
								className="text-sm font-semibold text-slate-300 uppercase tracking-widest"
							>
								Ação do Operador (Despacho)
							</label>
							<textarea
								id="despacho"
								placeholder="Ex: Viatura 45 enviada para o local. Agressor interceptado..."
								className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-red-500 transition-colors"
								rows={3}
								value={anotacaoDespacho}
								onChange={(e) => setAnotacaoDespacho(e.target.value)}
							/>
						</div>

						<button
							type="button"
							disabled={isDespachando}
							onClick={handleDespacharViatura}
							className="w-full bg-red-600 hover:bg-red-500 text-white font-black text-lg py-5 rounded-xl uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(220,38,38,0.4)] hover:shadow-[0_0_50px_rgba(220,38,38,0.6)] disabled:opacity-50"
						>
							<ShieldAlert className="w-6 h-6" />
							{isDespachando
								? "Despachando..."
								: "Registrar Intervenção Tática"}
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
