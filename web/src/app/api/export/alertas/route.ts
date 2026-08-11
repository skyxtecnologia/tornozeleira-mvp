import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET() {
	try {
		// Busca todos os alertas, ordenados do mais recente para o mais antigo
		const alertas = await prisma.alerta.findMany({
			include: { monitorado: true },
			orderBy: { timestamp: "desc" },
		});

		// Cria o cabeçalho do CSV
		const headers = [
			"ID_Alerta",
			"Data_Hora",
			"Nivel",
			"Tipo",
			"Monitorado_Nome",
			"Monitorado_CPF",
			"Anotacoes",
		];
		const rows = [headers.join(",")];

		// Preenche as linhas
		for (const alerta of alertas) {
			const dataHora = new Date(alerta.timestamp).toISOString();
			const nome = alerta.monitorado?.nome || "Desconhecido";
			const cpf = alerta.monitorado?.cpf || "N/A";

			// Protege as anotações contra vírgulas que quebram o CSV
			const anotacoes = alerta.anotacaoOperador
				? `"${alerta.anotacaoOperador.replace(/"/g, '""')}"`
				: "";

			const row = [
				alerta.id,
				dataHora,
				alerta.nivel,
				alerta.tipo,
				`"${nome}"`,
				cpf,
				anotacoes,
			];
			rows.push(row.join(","));
		}

		const csvContent = rows.join("\n");

		// Retorna com headers para forçar o download no navegador
		return new NextResponse(csvContent, {
			status: 200,
			headers: {
				"Content-Type": "text/csv; charset=utf-8",
				"Content-Disposition": 'attachment; filename="auditoria_alertas.csv"',
			},
		});
	} catch (error) {
		console.error("Erro ao exportar CSV:", error);
		return NextResponse.json(
			{ error: "Falha na geração do relatório" },
			{ status: 500 },
		);
	}
}
