import { PrismaClient } from "@prisma/client";
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

export default async function VitimasPage() {
	// Busca as vítimas no banco
	const vitimas = await prisma.monitorado.findMany({
		where: { tipo: "VITIMA" },
		include: {
			dispositivo: true,
			medidasComoVitima: {
				include: {
					agressor: true,
				},
			},
		},
		orderBy: { nome: "asc" },
	});

	return (
		<div className="p-8 max-w-7xl mx-auto space-y-6">
			<div>
				<h1 className="text-3xl font-bold tracking-tight">Gestão de Vítimas</h1>
				<p className="text-muted-foreground mt-2">
					Lista de todos os indivíduos classificados como vítimas sob proteção
					do sistema.
				</p>
			</div>

			<div className="border rounded-md">
				<Table>
					<TableCaption>Lista atualizada de vítimas cadastradas.</TableCaption>
					<TableHeader>
						<TableRow>
							<TableHead>Nome</TableHead>
							<TableHead>CPF / Contato</TableHead>
							<TableHead>Dispositivo (DAV)</TableHead>
							<TableHead>Nº de Medidas Ativas</TableHead>
							<TableHead>Status Geral</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{vitimas.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={5}
									className="text-center text-muted-foreground h-24"
								>
									Nenhuma vítima cadastrada ainda.
								</TableCell>
							</TableRow>
						) : (
							vitimas.map((vitima) => {
								const medidasAtivas = vitima.medidasComoVitima.filter(
									(m) => m.status === "ATIVA",
								);

								return (
									<TableRow key={vitima.id}>
										<TableCell className="font-medium">{vitima.nome}</TableCell>
										<TableCell>
											<div className="flex flex-col">
												<span>{vitima.cpf}</span>
												<span className="text-xs text-muted-foreground">
													{vitima.telefone || "Sem contato"}
												</span>
											</div>
										</TableCell>
										<TableCell>
											{vitima.dispositivo ? (
												<div className="flex flex-col">
													<span className="text-xs font-mono">
														{vitima.dispositivo.imei}
													</span>
													<Badge
														variant={
															vitima.dispositivo.status === "ATIVO"
																? "default"
																: "secondary"
														}
														className="w-fit text-[10px] bg-blue-600 hover:bg-blue-700"
													>
														{vitima.dispositivo.status}
													</Badge>
												</div>
											) : (
												<span className="text-muted-foreground italic text-xs">
													Sem dispositivo DAV
												</span>
											)}
										</TableCell>
										<TableCell>{medidasAtivas.length} Medida(s)</TableCell>
										<TableCell>
											{medidasAtivas.length > 0 ? (
												<Badge className="bg-green-600 hover:bg-green-700">
													Protegida
												</Badge>
											) : (
												<Badge variant="secondary">Sem Medida Ativa</Badge>
											)}
										</TableCell>
									</TableRow>
								);
							})
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
