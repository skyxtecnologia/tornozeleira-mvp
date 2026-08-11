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

export default async function AgressoresPage() {
	// Busca os agressores no banco
	const agressores = await prisma.monitorado.findMany({
		where: { tipo: "AGRESSOR" },
		include: {
			dispositivo: true,
			medidasComoAgressor: {
				include: {
					vitima: true,
				},
			},
		},
		orderBy: { nome: "asc" },
	});

	return (
		<div className="p-8 max-w-7xl mx-auto space-y-6">
			<div>
				<h1 className="text-3xl font-bold tracking-tight">
					Gestão de Agressores
				</h1>
				<p className="text-muted-foreground mt-2">
					Lista de todos os indivíduos classificados como agressores no sistema.
				</p>
			</div>

			<div className="border rounded-md">
				<Table>
					<TableCaption>
						Lista atualizada de agressores cadastrados.
					</TableCaption>
					<TableHeader>
						<TableRow>
							<TableHead>Nome</TableHead>
							<TableHead>CPF</TableHead>
							<TableHead>Dispositivo (Tornozeleira)</TableHead>
							<TableHead>Nº de Medidas (Vítimas)</TableHead>
							<TableHead>Status Geral</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{agressores.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={5}
									className="text-center text-muted-foreground h-24"
								>
									Nenhum agressor cadastrado ainda.
								</TableCell>
							</TableRow>
						) : (
							agressores.map((agressor) => (
								<TableRow key={agressor.id}>
									<TableCell className="font-medium">{agressor.nome}</TableCell>
									<TableCell>{agressor.cpf}</TableCell>
									<TableCell className="font-mono text-xs">
										{agressor.telefone || "Não informado"}
									</TableCell>
									<TableCell>
										{agressor.dispositivo ? (
											<div className="flex flex-col">
												<span className="text-xs font-mono">
													{agressor.dispositivo.imei}
												</span>
												<Badge
													variant={
														agressor.dispositivo.status === "ATIVO"
															? "default"
															: "secondary"
													}
													className="w-fit text-[10px]"
												>
													{agressor.dispositivo.status}
												</Badge>
											</div>
										) : (
											<span className="text-muted-foreground italic text-xs">
												Sem dispositivo
											</span>
										)}
									</TableCell>
									<TableCell>
										{agressor.medidasComoAgressor.length} Medida(s)
									</TableCell>
									<TableCell>
										<Badge variant="destructive">Em Monitoramento</Badge>
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
