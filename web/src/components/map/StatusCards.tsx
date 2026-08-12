import { ShieldAlert, Activity, WifiOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";
import { MedidaProcessada } from "@/app/dashboard/map/page";

interface StatusCardsProps {
	medidasComDistancia: MedidaProcessada[];
	forceVisibility: boolean;
	setForceVisibility: (v: boolean) => void;
}

export function StatusCards({ medidasComDistancia, forceVisibility, setForceVisibility }: StatusCardsProps) {
	return (
		<div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-slate-900/50 p-4 rounded-xl border border-slate-800 backdrop-blur-sm z-10 relative">
			<div>
				<h2 className="text-xl font-bold text-white flex items-center gap-2">
					<ShieldAlert className="w-5 h-5 text-indigo-500" />
					Monitoramento Tático
				</h2>
				<p className="text-sm text-slate-400">
					Acompanhamento em tempo real das áreas de proteção.
				</p>
			</div>
			<div className="flex gap-4 flex-wrap">
				<Badge
					variant="outline"
					className="bg-slate-950 border-slate-800 text-slate-300 py-1.5 px-3"
				>
					<Activity className="w-4 h-4 mr-2 text-emerald-500" />
					Medidas Ativas: {medidasComDistancia.length}
				</Badge>
				<Badge
					variant="outline"
					className="bg-slate-950 border-red-900/50 text-red-400 py-1.5 px-3 animate-pulse"
				>
					<WifiOff className="w-4 h-4 mr-2" />
					Medidas em Risco:{" "}
					{
						medidasComDistancia.filter(
							(m) =>
								m.statusRisco === "CRITICO" || m.statusRisco === "PERIGO",
						).length
					}
				</Badge>
				<button
					type="button"
					onClick={() => setForceVisibility(!forceVisibility)}
					className={`py-2 px-4 text-sm shadow-sm rounded-md transition-colors flex items-center gap-2 ${forceVisibility ? "bg-red-600 hover:bg-red-700 text-white font-bold animate-pulse" : "bg-slate-800 hover:bg-slate-700 text-slate-300"}`}
					title="Burlar Ocultação de Privacidade (Apenas para Testes)"
				>
					<Eye className="w-4 h-4" />
					{forceVisibility ? "MODO TÁTICO ATIVADO" : "Forçar Visibilidade"}
				</button>
			</div>
		</div>
	);
}
