"use client";

import { useEffect, useMemo, useState } from "react";
import MapComponent, { Layer, Marker, Source } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import circle from "@turf/circle";
import {
	AlertTriangle,
	Crosshair,
	Eye,
	MapPin,
	ShieldAlert,
	ShieldCheck,
	X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Token temporário ou carregar do env
const _MAPBOX_TOKEN =
	"pk.eyJ1IjoibW9ja3VzZXIiLCJhIjoiY2xwM2NqZzJtMDV2eDJxcWk5bHg4bW95byJ9.MOCK_TOKEN_HERE";

interface Localizacao {
	dispositivoId: string;
	imei: string;
	tipoDispositivo: string;
	monitorado: {
		id: string;
		nome: string;
		tipo: string;
	} | null;
	lat: number;
	lng: number;
	bateria: number;
	timestamp: string;
	isOffline: boolean;
}

interface Alerta {
	tipo: string;
	nivel: string;
	anotacaoOperador?: string;
}

interface MedidaAtiva {
	id: string;
	raioProtecaoMetros: number;
	agressor: { id: string; nome: string; dispositivoId: string };
	vitima: { id: string; nome: string; dispositivoId: string };
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
	const [medidas, setMedidas] = useState<MedidaAtiva[]>([]);
	const [historicoRastro, setHistoricoRastro] = useState<
		Record<string, { lng: number; lat: number }[]>
	>({});

	// Estado do Mapa Modal
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const [medidaSelecionada, setMedidaSelecionada] = useState<any>(null);

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
						initialHistory[p.dispositivoId] = [{ lng: p.lng, lat: p.lat }];
					});
					setHistoricoRastro(initialHistory);
				}
				if (resMedidas.ok) setMedidas(await resMedidas.json());
			} catch (error) {
				console.error("Erro ao buscar dados do mapa", error);
			}
		};
		fetchData();

		const eventSource = new EventSource("/api/stream");

		eventSource.addEventListener("telemetria", (event) => {
			try {
				const novaLocalizacao = JSON.parse(event.data) as Localizacao;

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
					// Verifica se o ponto realmente mudou para não entupir o array
					const lastPoint = rastroAnterior[rastroAnterior.length - 1];
					if (
						lastPoint &&
						lastPoint.lat === novaLocalizacao.lat &&
						lastPoint.lng === novaLocalizacao.lng
					) {
						return prev;
					}
					return {
						...prev,
						[novaLocalizacao.dispositivoId]: [
							...rastroAnterior,
							{ lng: novaLocalizacao.lng, lat: novaLocalizacao.lat },
						].slice(-500), // Mantém max 500 pontos no frontend para evitar lentidão
					};
				});
			} catch (err) {
				console.error("Erro ao parsear SSE telemetria", err);
			}
		});

		eventSource.addEventListener("alerta", (event) => {
			const alerta = JSON.parse(event.data);
			setAlertaAtivo(alerta);
		});

		return () => {
			eventSource.close();
		};
	}, []);

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

			if (locAgressor && locVitima) {
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
		if (!medidaSelecionada?.locVitima) return null;
		return circle(
			[medidaSelecionada.locVitima.lng, medidaSelecionada.locVitima.lat],
			medidaSelecionada.raioProtecaoMetros,
			{ steps: 64, units: "meters" },
		);
	}, [medidaSelecionada]);

	const rastroAgressorGeoJSON = useMemo(() => {
		if (!medidaSelecionada?.locAgressor) return null;
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

	return (
		<div className="min-h-screen bg-slate-950 p-8 max-w-screen-2xl mx-auto space-y-8 animate-in fade-in duration-500">
			{/* Cabeçalho da Tela Base */}
			<div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
				<div>
					<h1 className="text-3xl font-bold tracking-tight text-slate-50 flex items-center gap-3">
						<Crosshair className="w-8 h-8 text-indigo-500" />
						Monitoramento Tático
					</h1>
					<p className="text-muted-foreground mt-2 max-w-2xl">
						Visão operacional de todas as Medidas Protetivas rastreadas no
						perímetro. Os alertas são classificados pela gravidade da
						aproximação.
					</p>
				</div>
				<div className="flex gap-2">
					<Badge
						variant="outline"
						className="bg-slate-900 border-slate-800 text-slate-300 py-2 px-4 text-sm shadow-sm"
					>
						Dispositivos Online: {pontos.length}
					</Badge>
					<Badge
						variant="default"
						className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 text-sm shadow-[0_0_15px_rgba(79,70,229,0.3)]"
					>
						Medidas em Risco:{" "}
						{
							medidasComDistancia.filter(
								(m) =>
									m.statusRisco === "CRITICO" || m.statusRisco === "PERIGO",
							).length
						}
					</Badge>
				</div>
			</div>

			{/* Grid de Cards de KPIs */}
			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				{medidasComDistancia.length === 0 ? (
					<div className="col-span-full py-20 flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-xl">
						<ShieldCheck className="w-12 h-12 text-slate-700 mb-4" />
						<p className="text-slate-500 text-lg">
							Nenhuma medida ativa sendo rastreada no momento.
						</p>
					</div>
				) : (
					medidasComDistancia.map((m) => {
						const theme = getStatusTheme(m.statusRisco);

						return (
							<Card
								key={m.id}
								onClick={() => setMedidaSelecionada(m)}
								className={`bg-gradient-to-br ${theme.gradient} border ${theme.border} shadow-lg hover:scale-[1.02] hover:shadow-2xl transition-all duration-300 relative overflow-hidden group cursor-pointer`}
							>
								{/* Efeito glow de fundo no card */}
								<div
									className={`absolute top-0 right-0 w-32 h-32 ${theme.glow}/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:${theme.glow}/20 transition-colors`}
								/>

								<CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
									<div className="flex items-center gap-2">
										{theme.icon}
										<CardTitle
											className={`text-sm font-bold uppercase tracking-widest ${theme.text}`}
										>
											{m.statusRisco}
										</CardTitle>
									</div>
									{m.statusRisco === "CRITICO" && (
										<span className="relative flex h-3 w-3">
											<span
												className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75`}
											></span>
											<span
												className={`relative inline-flex rounded-full h-3 w-3 bg-red-500`}
											></span>
										</span>
									)}
								</CardHeader>
								<CardContent className="relative z-10 pt-4">
									<div className="grid grid-cols-2 gap-4 mb-4">
										<div>
											<p className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">
												Agressor
											</p>
											<p
												className="text-sm font-medium text-slate-100 truncate"
												title={m.agressor.nome}
											>
												{m.agressor.nome}
											</p>
										</div>
										<div className="text-right">
											<p className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">
												Vítima
											</p>
											<p
												className="text-sm font-medium text-slate-100 truncate"
												title={m.vitima.nome}
											>
												{m.vitima.nome}
											</p>
										</div>
									</div>

									<div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-800/60">
										<div>
											<p className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">
												Distância Atual
											</p>
											<p
												className={`text-2xl font-mono font-bold drop-shadow-md ${theme.text}`}
											>
												{m.distancia !== null
													? `${Math.round(m.distancia)}m`
													: "S/ Sinal"}
											</p>
										</div>
										<div className="text-right flex flex-col justify-end h-full pb-1">
											<Badge
												variant="outline"
												className="bg-slate-950/50 text-slate-400 border-slate-700/50"
											>
												Limite: {m.raioProtecaoMetros}m
											</Badge>
										</div>
									</div>
								</CardContent>
							</Card>
						);
					})
				)}
			</div>

			{/* Mapa Modal Tático */}
			{medidaSelecionada && (
				<div className="fixed inset-0 z-40 bg-black/90 backdrop-blur-md flex flex-col animate-in fade-in duration-300">
					{/* Header do Modal */}
					<div className="h-20 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-8 shadow-2xl z-50">
						<div className="flex items-center gap-4">
							{getStatusTheme(medidaSelecionada.statusRisco).icon}
							<div>
								<h2 className="text-xl font-bold text-slate-50 uppercase tracking-widest">
									Visão Tática
								</h2>
								<p className="text-sm text-slate-400">
									Agressor:{" "}
									<span className="text-slate-200">
										{medidaSelecionada.agressor.nome}
									</span>{" "}
									| Vítima:{" "}
									<span className="text-slate-200">
										{medidaSelecionada.vitima.nome}
									</span>
								</p>
							</div>
						</div>

						<div className="flex items-center gap-6">
							<div className="text-right hidden md:block">
								<p className="text-xs text-slate-500 uppercase font-semibold tracking-widest">
									Distância Atual
								</p>
								<p
									className={`text-xl font-mono font-bold ${getStatusTheme(medidaSelecionada.statusRisco).text}`}
								>
									{medidaSelecionada.distancia !== null
										? `${Math.round(medidaSelecionada.distancia)}m`
										: "S/ Sinal"}
								</p>
							</div>
							<div className="h-8 w-px bg-slate-800 hidden md:block"></div>
							<button
								type="button"
								onClick={() => setMedidaSelecionada(null)}
								className="bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-lg p-2.5 transition-colors flex items-center gap-2 group"
							>
								<span className="text-sm font-semibold uppercase tracking-wider hidden sm:inline-block group-hover:text-white">
									Fechar Mapa
								</span>
								<X className="w-5 h-5 group-hover:text-white" />
							</button>
						</div>
					</div>

					{/* Corpo do Mapa */}
					<div className="flex-1 relative bg-slate-900">
						<MapComponent
							mapboxAccessToken={
								process.env.NEXT_PUBLIC_MAPBOX_TOKEN || _MAPBOX_TOKEN
							}
							initialViewState={{
								longitude:
									medidaSelecionada.locAgressor && medidaSelecionada.locVitima
										? (medidaSelecionada.locAgressor.lng +
												medidaSelecionada.locVitima.lng) /
											2
										: medidaSelecionada.locAgressor?.lng || -51.23,
								latitude:
									medidaSelecionada.locAgressor && medidaSelecionada.locVitima
										? (medidaSelecionada.locAgressor.lat +
												medidaSelecionada.locVitima.lat) /
											2
										: medidaSelecionada.locAgressor?.lat || -30.033,
								zoom: 14.5,
							}}
							style={{ width: "100%", height: "100%" }}
							mapStyle="mapbox://styles/mapbox/dark-v11"
						>
							{/* Renderiza Zona de Exclusão e Rastro Histórico */}
							{zonaExclusaoGeoJSON && (
								<Source
									id="zona-source"
									type="geojson"
									data={zonaExclusaoGeoJSON as any}
								>
									<Layer
										id="zona-fill"
										type="fill"
										paint={{ "fill-color": "#ef4444", "fill-opacity": 0.15 }}
									/>
									<Layer
										id="zona-line"
										type="line"
										paint={{
											"line-color": "#ef4444",
											"line-width": 2,
											"line-opacity": 0.5,
										}}
									/>
								</Source>
							)}

							{rastroAgressorGeoJSON && (
								<Source
									id="rastro-source"
									type="geojson"
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

							{/* Renderiza todos os pontos no mapa para contexto geral */}
							{pontos.map((ponto) => {
								const isVitima = ponto.tipoDispositivo === "DAV";
								// Destaca os pinos que fazem parte dessa medida específica
								const isEnvolvido =
									ponto.dispositivoId ===
										medidaSelecionada.agressor.dispositivoId ||
									ponto.dispositivoId ===
										medidaSelecionada.vitima.dispositivoId;

								return (
									<Marker
										key={ponto.dispositivoId}
										longitude={ponto.lng}
										latitude={ponto.lat}
										anchor="bottom"
									>
										<div
											className={`relative flex items-center justify-center cursor-pointer group ${isEnvolvido ? "scale-125 z-50" : "opacity-40 hover:opacity-100 z-10"}`}
										>
											{isVitima && isEnvolvido && (
												<div className="absolute w-12 h-12 bg-blue-500/30 rounded-full animate-ping" />
											)}
											{!isVitima &&
												isEnvolvido &&
												medidaSelecionada.statusRisco === "CRITICO" && (
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
											{isEnvolvido && (
												<div className="absolute top-10 bg-slate-900 border border-slate-700 text-white text-xs px-3 py-1.5 rounded-md shadow-xl whitespace-nowrap font-semibold tracking-wider uppercase">
													{ponto.monitorado?.nome || "Desconhecido"}
												</div>
											)}
										</div>
									</Marker>
								);
							})}
						</MapComponent>

						{/* HUD Sobreposto no Mapa (Targeting Reticle Style) */}
						<div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-30">
							<div className="w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] rounded-full border border-slate-500/30"></div>
							<div className="w-[25vw] h-[25vw] max-w-[300px] max-h-[300px] absolute rounded-full border border-slate-500/20"></div>
							<div className="absolute w-px h-full bg-slate-500/10"></div>
							<div className="absolute w-full h-px bg-slate-500/10"></div>
						</div>
					</div>
				</div>
			)}

			{/* Modal de Alerta Crítico Global (Sobrepõe tudo se houver evento do banco) */}
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

						<div className="w-full bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
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

						<button
							type="button"
							onClick={() => setAlertaAtivo(null)}
							className="mt-8 w-full bg-red-600 hover:bg-red-500 text-white font-black text-lg py-5 rounded-xl uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(220,38,38,0.4)] hover:shadow-[0_0_50px_rgba(220,38,38,0.6)]"
						>
							<ShieldAlert className="w-6 h-6" />
							Reconhecer e Intervir
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
