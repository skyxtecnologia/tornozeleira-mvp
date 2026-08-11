"use client";

import { BatteryWarning, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";

export function StatusDispositivos() {
	// Importamos o mesmo tipo do mapa ou usamos o local
	interface DispositivoCritico {
		isOffline: boolean;
		bateria: number;
		monitorado?: { nome: string };
		imei: string;
		dispositivoId: string;
	}

	const [dispositivos, setDispositivos] = useState<DispositivoCritico[]>([]);

	useEffect(() => {
		const fetchData = async () => {
			const res = await fetch("/api/telemetry");
			if (res.ok) {
				const data = await res.json();
				// Filtra apenas os que estão offline ou bateria baixa
				const criticos = data.filter(
					(d: DispositivoCritico) => d.isOffline || d.bateria <= 30,
				);
				setDispositivos(criticos);
			}
		};
		fetchData();
	}, []);

	if (dispositivos.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-2">
				<div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mb-2">
					<BatteryWarning className="w-6 h-6 text-emerald-500" />
				</div>
				<p>Todos os hardwares estão operando</p>
				<p className="text-xs">Bateria OK e Sinais Estáveis.</p>
			</div>
		);
	}

	return (
		<div className="space-y-4 h-[250px] overflow-y-auto pr-2 custom-scrollbar">
			{dispositivos.map((d) => (
				<div
					key={d.dispositivoId}
					className="flex justify-between items-center p-3 rounded-lg border border-slate-800 bg-slate-900/50"
				>
					<div className="flex items-center gap-3">
						{d.isOffline ? (
							<WifiOff className="w-5 h-5 text-red-500" />
						) : (
							<BatteryWarning className="w-5 h-5 text-amber-500" />
						)}
						<div>
							<p className="text-sm font-semibold text-slate-200">
								{d.monitorado?.nome || "Desconhecido"}
							</p>
							<p className="text-xs text-slate-400">IMEI: {d.imei}</p>
						</div>
					</div>
					<div className="flex flex-col items-end gap-1">
						{d.isOffline && (
							<Badge variant="destructive" className="text-[10px]">
								Sem Sinal GPS
							</Badge>
						)}
						{d.bateria <= 30 && (
							<Badge
								variant="outline"
								className="text-amber-500 border-amber-500/50 text-[10px]"
							>
								Bateria: {d.bateria}%
							</Badge>
						)}
					</div>
				</div>
			))}
		</div>
	);
}
