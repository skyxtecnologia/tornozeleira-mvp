"use client";

import { useEffect, useState, use } from "react";
import MapComponent, { Layer, Marker, Source } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import circle from "@turf/circle";
import {
	MapPin,
	Plus,
	Save,
	Trash2,
	ArrowLeft,
	ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";

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

interface Zona {
	id: string;
	tipo: string;
	formato: string;
	coordenadas: string;
	raioMetros: number | null;
}

interface Medida {
	id: string;
	numeroProcesso: string;
	zonas: Zona[];
}

export default function ZonasPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const resolvedParams = use(params);
	const [medida, setMedida] = useState<Medida | null>(null);
	const [loading, setLoading] = useState(true);
	const router = useRouter();

	// Estado do Modo de Desenho
	const [isDrawing, setIsDrawing] = useState(false);
	const [novoCentro, setNovoCentro] = useState<{ lat: number; lng: number } | null>(null);
	const [novoRaio, setNovoRaio] = useState(200);

	useEffect(() => {
		const fetchMedida = async () => {
			const res = await fetch("/api/medidas/ativas"); // Busca todas (MVP)
			if (res.ok) {
				const medidas: Medida[] = await res.json();
				const m = medidas.find((x) => x.id === resolvedParams.id);
				setMedida(m || null);
			}
			setLoading(false);
		};
		fetchMedida();
	}, [resolvedParams.id]);

	const handleMapClick = (e: any) => {
		if (!isDrawing) return;
		setNovoCentro({ lat: e.lngLat.lat, lng: e.lngLat.lng });
	};

	const handleSaveZona = async () => {
		if (!novoCentro) return;

		setLoading(true);
		try {
			const res = await fetch("/api/zonas", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					medidaProtetivaId: medida?.id,
					tipo: "EXCLUSAO",
					formato: "CIRCULO",
					coordenadas: JSON.stringify([novoCentro]),
					raioMetros: novoRaio,
				}),
			});

			if (res.ok) {
				// Atualizar local
				const novaZona = await res.json();
				setMedida((prev) =>
					prev ? { ...prev, zonas: [...prev.zonas, novaZona] } : prev,
				);
				setIsDrawing(false);
				setNovoCentro(null);
			}
		} catch (error) {
			console.error(error);
		}
		setLoading(false);
	};

	const handleDeleteZona = async (id: string) => {
		try {
			const res = await fetch(`/api/zonas?id=${id}`, { method: "DELETE" });
			if (res.ok) {
				setMedida((prev) =>
					prev
						? { ...prev, zonas: prev.zonas.filter((z) => z.id !== id) }
						: prev,
				);
			}
		} catch (error) {
			console.error(error);
		}
	};

	if (loading && !medida) {
		return <div className="text-white p-8">Carregando mapa tático...</div>;
	}

	if (!medida) {
		return <div className="text-white p-8">Medida não encontrada.</div>;
	}

	// Calcula GeoJSON das Zonas Fixas existentes
	const zonasGeoJSON =
		medida.zonas.length > 0
			? {
					type: "FeatureCollection",
					features: medida.zonas.map((z) => {
						try {
							const coords = JSON.parse(z.coordenadas);
							return circle([coords[0].lng, coords[0].lat], z.raioMetros || 100, {
								steps: 64,
								units: "meters",
							});
						} catch {
							return null;
						}
					}).filter(Boolean),
				}
			: null;

	// Calcula GeoJSON da zona sendo desenhada
	const previewGeoJSON =
		isDrawing && novoCentro
			? circle([novoCentro.lng, novoCentro.lat], novoRaio, {
					steps: 64,
					units: "meters",
				})
			: null;

	return (
		<div className="min-h-screen bg-slate-950 p-8 max-w-screen-2xl mx-auto space-y-6">
			<div className="flex items-center gap-4 mb-4">
				<Link href="/dashboard/medidas">
					<Button variant="outline" size="icon" className="bg-slate-900 border-slate-800 text-slate-300">
						<ArrowLeft className="w-4 h-4" />
					</Button>
				</Link>
				<div>
					<h1 className="text-3xl font-bold tracking-tight text-slate-50 flex items-center gap-3">
						Gestor de Zonas Geográficas
					</h1>
					<p className="text-slate-400">Medida Protetiva: {medida.numeroProcesso}</p>
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[70vh]">
				{/* Painel Esquerdo: Ferramentas */}
				<div className="col-span-1 space-y-6">
					<Card className="bg-slate-900 border-slate-800">
						<CardContent className="pt-6 space-y-4">
							<h2 className="text-lg font-bold text-white mb-2 border-b border-slate-800 pb-2">
								Nova Zona
							</h2>
							
							{!isDrawing ? (
								<Button 
									onClick={() => setIsDrawing(true)}
									className="w-full bg-indigo-600 hover:bg-indigo-700"
								>
									<Plus className="w-4 h-4 mr-2" /> Adicionar Zona
								</Button>
							) : (
								<div className="space-y-4 bg-slate-950 p-4 rounded-lg border border-indigo-500/50">
									<div className="space-y-2">
										<Label className="text-slate-300">Raio de Proteção (m)</Label>
										<Input
											type="number"
											value={novoRaio}
											onChange={(e) => setNovoRaio(Number(e.target.value))}
											className="bg-slate-900 border-slate-700"
											min={50}
											max={5000}
										/>
									</div>
									<p className="text-xs text-slate-400">
										{novoCentro ? "Ponto selecionado." : "Clique no mapa para definir o centro."}
									</p>
									<div className="flex gap-2">
										<Button 
											variant="outline" 
											onClick={() => { setIsDrawing(false); setNovoCentro(null); }}
											className="flex-1 bg-transparent border-slate-700 text-slate-300"
										>
											Cancelar
										</Button>
										<Button 
											onClick={handleSaveZona}
											disabled={!novoCentro || loading}
											className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
										>
											<Save className="w-4 h-4 mr-2" /> Salvar
										</Button>
									</div>
								</div>
							)}
						</CardContent>
					</Card>

					<Card className="bg-slate-900 border-slate-800 h-[35vh] overflow-y-auto custom-scrollbar">
						<CardContent className="pt-6">
							<h2 className="text-lg font-bold text-white mb-4 border-b border-slate-800 pb-2">
								Zonas Ativas
							</h2>
							<div className="space-y-3">
								{medida.zonas.length === 0 ? (
									<p className="text-sm text-slate-500">Nenhuma zona cadastrada.</p>
								) : (
									medida.zonas.map((zona) => (
										<div key={zona.id} className="flex items-center justify-between bg-slate-950 p-3 rounded-lg border border-slate-800">
											<div className="flex items-center gap-2">
												<ShieldAlert className="w-4 h-4 text-red-500" />
												<div className="flex flex-col">
													<span className="text-sm font-bold text-slate-200">Exclusão</span>
													<span className="text-xs text-slate-500">Raio: {zona.raioMetros}m</span>
												</div>
											</div>
											<Button
												variant="ghost"
												size="icon"
												onClick={() => handleDeleteZona(zona.id)}
												className="text-slate-400 hover:text-red-500 hover:bg-red-500/10"
											>
												<Trash2 className="w-4 h-4" />
											</Button>
										</div>
									))
								)}
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Mapa Tático */}
				<div className="col-span-1 lg:col-span-3 rounded-xl overflow-hidden border border-slate-800 shadow-2xl relative">
					<MapComponent
						initialViewState={{
							longitude: -41.776, // Centro de Macaé
							latitude: -22.378,
							zoom: 12,
						}}
						style={{ width: "100%", height: "100%" }}
						// biome-ignore lint/suspicious/noExplicitAny: MAPLIBRE Style Format
						mapStyle={MAPLIBRE_STYLE as any}
						onClick={handleMapClick}
						cursor={isDrawing ? "crosshair" : "grab"}
					>
						{/* Zonas já salvas */}
						{zonasGeoJSON && (
							<Source id="zonas-fixas" type="geojson" data={zonasGeoJSON as any}>
								<Layer
									id="zonas-fixas-fill"
									type="fill"
									paint={{ "fill-color": "#ef4444", "fill-opacity": 0.2 }}
								/>
								<Layer
									id="zonas-fixas-line"
									type="line"
									paint={{ "line-color": "#ef4444", "line-width": 2, "line-dasharray": [2, 2] }}
								/>
							</Source>
						)}

						{/* Preview da Zona sendo desenhada */}
						{previewGeoJSON && (
							<Source id="preview-zona" type="geojson" data={previewGeoJSON as any}>
								<Layer
									id="preview-zona-fill"
									type="fill"
									paint={{ "fill-color": "#3b82f6", "fill-opacity": 0.3 }}
								/>
								<Layer
									id="preview-zona-line"
									type="line"
									paint={{ "line-color": "#3b82f6", "line-width": 2 }}
								/>
							</Source>
						)}
					</MapComponent>

					{isDrawing && (
						<div className="absolute top-4 right-4 bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-xl font-bold animate-pulse text-sm">
							Modo de Desenho Ativo: Clique no mapa
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
