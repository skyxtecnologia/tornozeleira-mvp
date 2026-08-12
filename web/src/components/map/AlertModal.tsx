import { MedidaProcessada } from "@/app/dashboard/map/page"; // We'll move the interface if needed later
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Crosshair, Users, Activity, Eye, WifiOff, MapPin, X } from "lucide-react";

export function getStatusTheme(status: string) {
	switch (status) {
		case "CRITICO":
			return {
				bg: "bg-red-500/10",
				border: "border-red-500/30",
				text: "text-red-500",
			};
		case "PERIGO":
			return {
				bg: "bg-orange-500/10",
				border: "border-orange-500/30",
				text: "text-orange-500",
			};
		default:
			return {
				bg: "bg-emerald-500/10",
				border: "border-emerald-500/30",
				text: "text-emerald-500",
			};
	}
}

interface AlertModalProps {
	medidaSelecionada: MedidaProcessada;
	setMedidaSelecionada: (m: MedidaProcessada | null) => void;
	forceVisibility: boolean;
	setForceVisibility: (v: boolean) => void;
}

export function AlertModal({ medidaSelecionada, setMedidaSelecionada, forceVisibility, setForceVisibility }: AlertModalProps) {
	const theme = getStatusTheme(medidaSelecionada.statusRisco);

	return (
		<div className="absolute top-6 left-6 right-6 md:left-1/2 md:-translate-x-1/2 md:right-auto md:w-full max-w-3xl z-10">
			<div
				className={`bg-slate-950/90 backdrop-blur-md border-2 ${theme.border} rounded-2xl p-4 md:p-6 shadow-2xl animate-in slide-in-from-top-4 duration-300`}
			>
				<div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
					<div className="flex-1 flex flex-col md:flex-row items-start md:items-center gap-6 w-full">
						<div className="flex items-center gap-4">
							<div
								className={`p-3 rounded-full ${theme.bg} ${theme.text} shrink-0`}
							>
								<Activity
									className={`w-8 h-8 ${medidaSelecionada.statusRisco === "CRITICO" ? "animate-pulse" : ""}`}
								/>
							</div>
							<div>
								<p className="text-xs text-slate-500 uppercase font-semibold tracking-widest mb-1">
									Processo / Mandado
								</p>
								<h2 className="text-xl font-bold text-white tracking-tight">
									{medidaSelecionada.numeroProcesso}
								</h2>
							</div>
						</div>

						<div className="h-12 w-px bg-slate-800 hidden md:block"></div>

						<div className="flex flex-col gap-2 w-full md:w-auto">
							<p className="text-sm font-medium flex items-center gap-2">
								<Crosshair className="w-4 h-4 text-red-500 shrink-0" />
								<span className="text-slate-300 truncate max-w-[200px]">
									{medidaSelecionada.agressor.nome}
								</span>
							</p>
							<p className="text-sm font-medium flex items-center gap-2">
								<Users className="w-4 h-4 text-blue-500 shrink-0" />
								<span className="text-slate-300 truncate max-w-[200px]">
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
								className={`text-xl font-mono font-bold ${theme.text}`}
							>
								{medidaSelecionada.distancia != null
									? `${Math.round(medidaSelecionada.distancia as number)}m`
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
			</div>
		</div>
	);
}
