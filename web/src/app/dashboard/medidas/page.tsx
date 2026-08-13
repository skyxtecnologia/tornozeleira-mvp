import { PrismaClient } from "@prisma/client";
import { Crosshair, ShieldAlert, Users } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export default async function MedidasPage() {
	const medidas = await prisma.medidaProtetiva.findMany({
		include: {
			agressor: true,
			vitima: true,
			zonas: true,
		},
		orderBy: { criadoEm: "desc" },
	});

	return (
		<div className="p-8 max-w-7xl mx-auto space-y-6">
			<div>
				<h1 className="text-3xl font-bold tracking-tight text-slate-50 flex items-center gap-3">
					<ShieldAlert className="w-8 h-8 text-indigo-500" />
					Gestão de Medidas Protetivas
				</h1>
				<p className="text-muted-foreground mt-2">
					Consulte e configure os processos, raios de proteção e as zonas de
					exclusão das medidas ativas.
				</p>
			</div>
			
			<div className="flex justify-end">
				<Link href="/dashboard/cadastros?tab=medidas">
					<button type="button" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-md transition-colors flex items-center gap-2 shadow-lg shadow-indigo-500/20">
						<ShieldAlert className="w-5 h-5" />
						Cadastrar Nova Medida
					</button>
				</Link>
			</div>

			<div className="grid gap-6 md:grid-cols-3 mb-8">
				<Card className="bg-slate-900/50 border-slate-800">
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium text-slate-300">
							Medidas Ativas
						</CardTitle>
						<ShieldAlert className="w-4 h-4 text-indigo-400" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-slate-100">
							{medidas.filter((m) => m.status === "ATIVA").length}
						</div>
					</CardContent>
				</Card>
			</div>

			<div className="border border-slate-800 rounded-md bg-slate-950/50 backdrop-blur-sm">
				<Table>
					<TableCaption>
						Lista oficial de mandados e medidas protetivas do tribunal.
					</TableCaption>
					<TableHeader>
						<TableRow className="border-slate-800">
							<TableHead>Processo / Status</TableHead>
							<TableHead>Agressor (Alvo)</TableHead>
							<TableHead>Vítima (Protegida)</TableHead>
							<TableHead>Raio Móvel</TableHead>
							<TableHead>Zonas Fixas</TableHead>
							<TableHead className="text-right">Ações</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{medidas.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={6}
									className="text-center text-muted-foreground h-24"
								>
									Nenhuma medida cadastrada.
								</TableCell>
							</TableRow>
						) : (
							medidas.map((medida) => (
								<TableRow
									key={medida.id}
									className="border-slate-800 hover:bg-slate-900/50"
								>
									<TableCell>
										<div className="flex flex-col gap-1">
											<span className="font-mono text-sm text-slate-200">
												{medida.numeroProcesso}
											</span>
											<Badge
												variant={
													medida.status === "ATIVA" ? "default" : "secondary"
												}
												className={
													medida.status === "ATIVA"
														? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20"
														: ""
												}
											>
												{medida.status}
											</Badge>
										</div>
									</TableCell>
									<TableCell>
										<div className="flex items-center gap-2">
											<Crosshair className="w-4 h-4 text-red-500" />
											<span className="font-medium text-slate-300">
												{medida.agressor.nome}
											</span>
										</div>
									</TableCell>
									<TableCell>
										<div className="flex items-center gap-2">
											<Users className="w-4 h-4 text-blue-500" />
											<span className="font-medium text-slate-300">
												{medida.vitima.nome}
											</span>
										</div>
									</TableCell>
									<TableCell>
										<Badge
											variant="outline"
											className="text-slate-400 border-slate-700"
										>
											{medida.raioProtecaoMetros}m
										</Badge>
									</TableCell>
									<TableCell>
										<span className="text-sm text-slate-400">
											{medida.zonas.length > 0
												? `${medida.zonas.length} Zona(s) (${medida.zonas.map((z) => z.formato).join(", ")})`
												: "Nenhuma"}
										</span>
									</TableCell>
									<TableCell className="text-right">
										<Link href={`/dashboard/medidas/${medida.id}/zonas`}>
											<button
												type="button"
												className="text-sm text-indigo-400 hover:text-indigo-300 font-semibold uppercase tracking-wider bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-1.5 rounded-lg border border-indigo-500/20"
											>
												Gerenciar Zonas
											</button>
										</Link>
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
