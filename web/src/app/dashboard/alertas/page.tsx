import { PrismaClient } from "@prisma/client";
import { Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

const prisma = new PrismaClient();

export const dynamic = "force-dynamic";

export default async function AlertasPage() {
	// Busca o histórico de alertas
	const alertas = await prisma.alerta.findMany({
		include: {
			monitorado: true,
		},
		orderBy: { timestamp: "desc" },
	});

	// Função auxiliar para cor do nível
	const getNivelBadgeVariant = (nivel: string) => {
		switch (nivel) {
			case "CRITICO":
				return "destructive";
			case "ALTO":
				return "destructive";
			case "MEDIO":
				return "default"; // ou warning se tivéssemos customizado
			case "BAIXO":
				return "secondary";
			default:
				return "outline";
		}
	};

	return (
		<div className="p-8 max-w-7xl mx-auto space-y-6">
			<div>
				<h1 className="text-3xl font-bold tracking-tight text-slate-50">
					Histórico de Ocorrências
				</h1>
				<p className="text-muted-foreground mt-2">
					Registro cronológico de todas as violações e eventos críticos do
					sistema.
				</p>
			</div>
			<div className="flex justify-end">
				<a
					href="/api/export/alertas"
					className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-slate-100 text-slate-900 shadow-sm hover:bg-slate-100/80 h-9 px-4 py-2"
				>
					<Download className="w-4 h-4 mr-2" />
					Baixar Relatório (CSV)
				</a>
			</div>

			<div className="border border-slate-800 rounded-md bg-slate-950/50 backdrop-blur-sm">
				<Table>
					<TableCaption>Log inalterável de auditoria de eventos.</TableCaption>
					<TableHeader>
						<TableRow className="border-slate-800">
							<TableHead className="w-[180px]">Data / Hora</TableHead>
							<TableHead>Nível</TableHead>
							<TableHead>Tipo de Ocorrência</TableHead>
							<TableHead>Indivíduo Envolvido</TableHead>
							<TableHead>Anotações do Sistema</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{alertas.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={5}
									className="text-center text-muted-foreground h-24"
								>
									Nenhum alerta registrado no sistema ainda.
								</TableCell>
							</TableRow>
						) : (
							alertas.map((alerta) => (
								<TableRow key={alerta.id} className="border-slate-800">
									<TableCell className="font-mono text-xs text-slate-400">
										{new Date(alerta.timestamp).toLocaleString("pt-BR")}
									</TableCell>
									<TableCell>
										<Badge variant={getNivelBadgeVariant(alerta.nivel)}>
											{alerta.nivel}
										</Badge>
									</TableCell>
									<TableCell className="font-medium text-slate-200">
										{alerta.tipo.replace(/_/g, " ")}
									</TableCell>
									<TableCell>
										{alerta.monitorado ? (
											<div className="flex flex-col">
												<span className="text-sm font-medium text-slate-300">
													{alerta.monitorado.nome}
												</span>
												<span className="text-xs text-slate-500">
													ID: {alerta.monitorado.id.slice(0, 8)}...
												</span>
											</div>
										) : (
											<span className="text-muted-foreground italic text-xs">
												Desconhecido
											</span>
										)}
									</TableCell>
									<TableCell
										className="text-sm text-slate-400 max-w-xs truncate"
										title={alerta.anotacaoOperador || ""}
									>
										{alerta.anotacaoOperador || "-"}
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
