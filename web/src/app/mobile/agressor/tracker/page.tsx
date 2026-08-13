"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, MapPin, Radio, Activity, Battery } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function MobileAgressorTrackerPage() {
	const router = useRouter();
	const [nome, setNome] = useState("");
	const [imei, setImei] = useState("");
	const [status, setStatus] = useState<"Buscando GPS..." | "Transmitindo" | "Sem Sinal GPS" | "Erro">("Buscando GPS...");
	const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
	const [batteryLevel, setBatteryLevel] = useState<number>(100);
	
	const coordsRef = useRef<{ lat: number; lng: number } | null>(null);
	const intervalRef = useRef<NodeJS.Timeout | null>(null);
	const watchIdRef = useRef<number | null>(null);

	useEffect(() => {
		// 1. Recupera os dados do Agressor
		const storedImei = localStorage.getItem("agressor_imei");
		const storedNome = localStorage.getItem("agressor_nome");

		if (!storedImei) {
			router.push("/mobile/agressor");
			return;
		}

		setImei(storedImei);
		setNome(storedNome || "Monitorado");

		// 2. Busca a bateria real do celular (Web Battery API)
		if ('getBattery' in navigator) {
			// @ts-ignore
			navigator.getBattery().then((battery: any) => {
				setBatteryLevel(Math.round(battery.level * 100));
				battery.addEventListener('levelchange', () => {
					setBatteryLevel(Math.round(battery.level * 100));
				});
			});
		} else {
			// Fallback mock se o navegador não suportar
			setBatteryLevel(90);
		}

		// 3. Inicia o GPS do Celular
		if ("geolocation" in navigator) {
			watchIdRef.current = navigator.geolocation.watchPosition(
				(position) => {
					coordsRef.current = {
						lat: position.coords.latitude,
						lng: position.coords.longitude,
					};
					if (status === "Buscando GPS...") {
						setStatus("Transmitindo");
					}
				},
				(error) => {
					console.error("Erro de GPS:", error);
					setStatus("Sem Sinal GPS");
				},
				{ enableHighAccuracy: true, maximumAge: 0 }
			);
		} else {
			setStatus("Erro");
		}

		// 4. Loop de transmissão a cada 4 segundos
		intervalRef.current = setInterval(async () => {
			if (coordsRef.current && storedImei) {
				try {
					await fetch("/api/telemetry", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							imei: storedImei,
							lat: coordsRef.current.lat,
							lng: coordsRef.current.lng,
							bateria: batteryLevel, // Usa a bateria capturada (real ou mock)
							offline: false,
						}),
					});
					setLastUpdate(new Date());
					setStatus("Transmitindo");
				} catch (err) {
					console.error("Erro ao enviar telemetria", err);
				}
			}
		}, 4000);

		return () => {
			if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
			if (intervalRef.current) clearInterval(intervalRef.current);
		};
	}, [router, status, batteryLevel]);

	return (
		<div className="min-h-screen bg-slate-950 flex flex-col p-4 relative overflow-hidden">
			{/* Efeitos de radar no fundo (Vermelho para Agressor) */}
			<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-500/5 rounded-full border border-red-500/10 animate-ping" style={{ animationDuration: '4s' }} />
			<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-red-500/10 rounded-full border border-red-500/20 animate-ping" style={{ animationDuration: '4s', animationDelay: '1s' }} />
			
			<div className="flex-1 flex flex-col z-10 space-y-6">
				{/* Cabeçalho */}
				<div className="flex items-center justify-between p-2">
					<div>
						<h1 className="text-xl font-bold text-slate-100 truncate">{nome}</h1>
						<p className="text-sm text-slate-400">Tornozeleira Eletrônica (Simulador)</p>
					</div>
					<Button variant="outline" className="border-slate-800 text-slate-400 bg-slate-900" onClick={() => {
						localStorage.clear();
						router.push("/mobile/agressor");
					}}>
						Sair
					</Button>
				</div>

				{/* Info Bateria Top Bar */}
				<div className="flex items-center justify-between bg-slate-900/50 backdrop-blur-md border border-slate-800 p-3 rounded-xl shadow-lg">
					<div className="flex items-center gap-2">
						<Battery className={`w-5 h-5 ${batteryLevel > 20 ? 'text-emerald-400' : 'text-red-500 animate-pulse'}`} />
						<span className="text-slate-200 font-medium">Bateria do Equipamento</span>
					</div>
					<div className="text-lg font-bold text-slate-100">{batteryLevel}%</div>
				</div>

				{/* Status Card */}
				<Card className="bg-slate-900/80 backdrop-blur-md border-red-500/30 shadow-[0_0_30px_rgba(220,38,38,0.1)]">
					<CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-4">
						<div className="relative">
							{status === "Transmitindo" ? (
								<Activity className="w-16 h-16 text-red-500 animate-pulse" />
							) : (
								<Radio className="w-16 h-16 text-amber-500 animate-pulse" />
							)}
						</div>
						
						<div>
							<h2 className="text-2xl font-bold text-slate-100">
								{status === "Transmitindo" ? "Transmitindo Ativamente" : status}
							</h2>
							<p className="text-slate-400 text-sm mt-1">
								{status === "Transmitindo" 
									? "A sua localização está sendo monitorada pela Justiça." 
									: "Por favor, permita o acesso ao GPS do celular."}
							</p>
						</div>

						{lastUpdate && status === "Transmitindo" && (
							<div className="flex items-center gap-2 text-xs font-medium text-red-400 bg-red-500/10 px-3 py-1.5 rounded-full border border-red-500/20">
								<span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
								Sinal enviado: {lastUpdate.toLocaleTimeString()}
							</div>
						)}
					</CardContent>
				</Card>

				{/* Info GPS */}
				<div className="flex items-center gap-3 bg-slate-900 border border-slate-800 p-4 rounded-xl">
					<MapPin className="w-6 h-6 text-slate-500 shrink-0" />
					<div className="text-sm text-slate-400">
						Ao se aproximar da vítima ou violar uma zona, um alerta será gerado na central.
					</div>
				</div>

				<div className="flex-1" />

				<div className="text-center opacity-50 pb-4">
					<ShieldAlert className="w-8 h-8 mx-auto text-slate-500 mb-2" />
					<p className="text-xs font-medium text-slate-500 uppercase tracking-widest">
						Simulador Operacional
					</p>
				</div>
			</div>
		</div>
	);
}
