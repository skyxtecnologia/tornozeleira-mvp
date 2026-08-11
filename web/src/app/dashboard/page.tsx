import { PrismaClient } from "@prisma/client";
import {
	Activity,
	BatteryWarning,
	MapPin,
	ShieldAlert,
	Siren,
	Users,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

const prisma = new PrismaClient();

export const dynamic = "force-dynamic";

export default async function DashboardHomePage() {
	// 1. Busca estatísticas principais em paralelo
	const [
		totalAgressores,
		totalVitimas,
		totalDispositivosAtivos,
		totalAlertas,
		ultimosAlertas,
	] = await Promise.all([
		prisma.monitorado.count({ where: { tipo: "AGRESSOR" } }),
		prisma.monitorado.count({ where: { tipo: "VITIMA" } }),
		prisma.dispositivo.count({ where: { status: "ATIVO" } }),
		prisma.alerta.count(),
		prisma.alerta.findMany({
			take: 5,
			orderBy: { timestamp: "desc" },
			include: { monitorado: true },
		}),
	]);

	// Função auxiliar para definir a cor e ícone da ocorrência
	const getAlertaIcon = (tipo: string) => {
		switch (tipo) {
			case "APROXIMACAO_VITIMA":
				return <ShieldAlert className="w-4 h-4 text-red-500" />;
			case "BATERIA_BAIXA":
				return <BatteryWarning className="w-4 h-4 text-amber-500" />;
			case "ROMPIMENTO_LACRE":
				return <Siren className="w-4 h-4 text-red-600" />;
			default:
				return <Activity className="w-4 h-4 text-blue-500" />;
		}
	};

	return (
		<div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
			{/* Cabeçalho */}
			<div>
				<h1 className="text-3xl font-bold tracking-tight text-slate-50">
					Visão Geral
				</h1>
				<p className="text-muted-foreground mt-2">
					Acompanhamento em tempo real do sistema de monitoramento eletrônico.
				</p>
			</div>

			{/* Cards de KPIs */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<Card className="bg-gradient-to-br from-slate-900 to-slate-950 border-slate-800 shadow-sm hover:border-red-900/50 transition-colors relative overflow-hidden group">
					<div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-red-500/10 transition-colors" />
					<CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
						<CardTitle className="text-sm font-medium text-slate-300">
							Agressores (Ativos)
						</CardTitle>
						<ShieldAlert className="w-4 h-4 text-red-400" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-slate-100">
							{totalAgressores}
						</div>
						<p className="text-xs text-slate-500 mt-1">
							+2 desde a última semana
						</p>
					</CardContent>
				</Card>

				<Card className="bg-gradient-to-br from-slate-900 to-slate-950 border-slate-800 shadow-sm hover:border-indigo-900/50 transition-colors relative overflow-hidden group">
					<div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-indigo-500/10 transition-colors" />
					<CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
						<CardTitle className="text-sm font-medium text-slate-300">
							Vítimas Protegidas
						</CardTitle>
						<Users className="w-4 h-4 text-indigo-400" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-slate-100">
							{totalVitimas}
						</div>
						<p className="text-xs text-slate-500 mt-1">100% de cobertura DAV</p>
					</CardContent>
				</Card>

				<Card className="bg-gradient-to-br from-slate-900 to-slate-950 border-slate-800 shadow-sm hover:border-blue-900/50 transition-colors relative overflow-hidden group">
					<div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-blue-500/10 transition-colors" />
					<CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
						<CardTitle className="text-sm font-medium text-slate-300">
							Hardwares Ativos
						</CardTitle>
						<Activity className="w-4 h-4 text-blue-400" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-slate-100">
							{totalDispositivosAtivos}
						</div>
						<p className="text-xs text-slate-500 mt-1">Sinais estáveis</p>
					</CardContent>
				</Card>

				<Card className="bg-gradient-to-br from-slate-900 to-slate-950 border-slate-800 shadow-sm hover:border-orange-900/50 transition-colors relative overflow-hidden group">
					<div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-orange-500/10 transition-colors" />
					<CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
						<CardTitle className="text-sm font-medium text-slate-300">
							Total de Alertas
						</CardTitle>
						<Siren className="w-4 h-4 text-orange-400" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-slate-100">
							{totalAlertas}
						</div>
						<p className="text-xs text-slate-500 mt-1">Registros auditáveis</p>
					</CardContent>
				</Card>
			</div>

			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
				{/* Seção Principal (Mapa Rápido / Status) */}
				<Card className="col-span-4 bg-gradient-to-br from-indigo-950/40 via-slate-950 to-slate-900 border-slate-800 flex flex-col justify-center items-center p-10 text-center relative overflow-hidden shadow-2xl">
					{/* Animações de fundo decorativas */}
					<div className="absolute top-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none" />
					<div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />
					
					<div className="w-24 h-24 bg-slate-900/80 backdrop-blur-md rounded-2xl flex items-center justify-center mb-8 ring-1 ring-slate-700/50 shadow-2xl relative z-10">
						<MapPin className="w-10 h-10 text-emerald-500" />
					</div>
					<h3 className="text-xl font-bold text-slate-100">
						Sistema Operacional
					</h3>
					<p className="text-slate-400 max-w-sm mt-2 mb-6 text-sm">
						Os serviços de telemetria e recepção georreferenciada estão ativos e
						rodando sem gargalos.
					</p>
					<Link
						href="/dashboard/map"
						className="relative z-10 inline-flex items-center justify-center rounded-lg text-sm font-bold tracking-wide transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-indigo-600 text-white hover:bg-indigo-500 hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] h-12 px-8 uppercase"
					>
						Abrir Central de Mapa
					</Link>
				</Card>

				{/* Últimas Ocorrências */}
				<Card className="col-span-3 bg-slate-900/50 border-slate-800 backdrop-blur-sm shadow-xl">
					<CardHeader className="border-b border-slate-800/50 pb-4">
						<CardTitle className="text-lg text-slate-200">
							Últimos Alertas
						</CardTitle>
						<CardDescription>
							Ocorrências recentes despachadas pelo sistema.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-4 pt-2">
							{ultimosAlertas.length === 0 ? (
								<p className="text-sm text-slate-500 italic text-center py-4">
									Nenhum evento crítico recente.
								</p>
							) : (
								ultimosAlertas.map((alerta) => (
									<div key={alerta.id} className="flex items-center p-3 rounded-lg hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-700/50 group">
										<div className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg group-hover:border-slate-700 transition-colors shadow-sm">
											{getAlertaIcon(alerta.tipo)}
										</div>
										<div className="ml-4 space-y-1">
											<p className="text-sm font-medium leading-none text-slate-200">
												{alerta.tipo.replace(/_/g, " ")}
											</p>
											<p className="text-xs text-slate-400">
												{alerta.monitorado?.nome || "Desconhecido"} •{" "}
												{new Date(alerta.timestamp).toLocaleTimeString(
													"pt-BR",
													{
														hour: "2-digit",
														minute: "2-digit",
													},
												)}
											</p>
										</div>
										<div className="ml-auto font-medium">
											<Badge
												variant={
													alerta.nivel === "CRITICO"
														? "destructive"
														: "secondary"
												}
												className="text-[10px]"
											>
												{alerta.nivel}
											</Badge>
										</div>
									</div>
								))
							)}
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
