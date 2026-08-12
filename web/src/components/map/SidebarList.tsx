import { Crosshair, ShieldCheck, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { MedidaProcessada } from "@/app/dashboard/map/page";
import { getStatusTheme } from "./AlertModal";

interface SidebarListProps {
	medidasComDistancia: MedidaProcessada[];
	medidaSelecionada: MedidaProcessada | null;
	setMedidaSelecionada: (m: MedidaProcessada | null) => void;
	forceVisibility: boolean;
}

export function SidebarList({
	medidasComDistancia,
	medidaSelecionada,
	setMedidaSelecionada,
	forceVisibility,
}: SidebarListProps) {
	return (
		<div className="w-full lg:w-96 bg-slate-900/80 backdrop-blur-xl border-l border-slate-800 flex flex-col h-[400px] lg:h-[calc(100vh-8rem)] z-10 shrink-0 shadow-2xl">
			<div className="p-4 border-b border-slate-800 bg-slate-900/90">
				<h3 className="font-bold text-slate-100 flex items-center gap-2">
					<Crosshair className="w-4 h-4 text-indigo-400" />
					Alvos em Monitoramento
				</h3>
				<p className="text-xs text-slate-500 mt-1">
					Selecione para focar no mapa
				</p>
			</div>
			<div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
				{medidasComDistancia.length === 0 ? (
					<p className="text-sm text-slate-500 text-center py-8">
						Nenhuma medida ativa ou com sinal no momento.
					</p>
				) : (
					medidasComDistancia.map((m) => {
						const theme = getStatusTheme(m.statusRisco);
						const isSelected = medidaSelecionada?.id === m.id;

						return (
							<button
								type="button"
								key={m.id}
								onClick={() => setMedidaSelecionada(m)}
								className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
									isSelected
										? "bg-slate-800 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.1)] scale-[1.02]"
										: "bg-slate-950 border-slate-800 hover:border-slate-700 hover:bg-slate-900"
								}`}
							>
								<div className="flex justify-between items-start mb-3">
									<Badge
										variant="outline"
										className="bg-slate-900 border-slate-700 text-xs font-mono text-slate-300"
									>
										{m.numeroProcesso}
									</Badge>
									<Badge
										variant="outline"
										className={`${theme.bg} ${theme.border} ${theme.text} text-xs font-bold uppercase tracking-wider`}
									>
										{m.statusRisco}
									</Badge>
								</div>

								<div className="space-y-2 mb-4">
									<div className="flex items-center gap-2">
										<div className="w-6 h-6 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
											<Crosshair className="w-3 h-3 text-red-500" />
										</div>
										<p className="text-sm font-medium text-slate-200 truncate">
											{m.agressor.nome}
										</p>
									</div>
									<div className="flex items-center gap-2">
										<div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
											<Users className="w-3 h-3 text-blue-500" />
										</div>
										<p className="text-sm font-medium text-slate-400 truncate">
											{m.vitima.nome}
										</p>
									</div>
								</div>

								<div className="pt-3 border-t border-slate-800/50 flex justify-between items-end">
									<div>
										<p className="text-xs text-slate-500 font-medium uppercase tracking-widest mb-1">
											Distância
										</p>
										<p
											className={`text-2xl font-mono font-bold drop-shadow-md ${theme.text}`}
										>
											{m.locAgressor?.isLocalizacaoOculta && !forceVisibility ? (
												<span className="text-sm font-semibold text-emerald-500 uppercase flex items-center gap-1">
													<ShieldCheck className="w-4 h-4" /> Dentro da Lei
												</span>
											) : m.distancia != null ? (
												`${Math.round(m.distancia)}m`
											) : (
												"S/ Sinal"
											)}
										</p>
									</div>
									<div className="text-right">
										<p className="text-[10px] text-slate-600 font-medium uppercase tracking-widest">
											Limite Máximo
										</p>
										<p className="text-sm text-slate-400 font-mono font-medium">
											{m.raioProtecaoMetros}m
										</p>
									</div>
								</div>
							</button>
						);
					})
				)}
			</div>
		</div>
	);
}
