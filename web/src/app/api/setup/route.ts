import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function GET() {
	try {
		// Proteção vital: Verifica se já existe algum usuário no banco.
		// Se existir, bloqueia a rota para sempre para que invasores não consigam criar novos admins.
		const count = await prisma.usuario.count();
		if (count > 0) {
			return NextResponse.json(
				{ error: "Setup bloqueado. O sistema já possui usuários cadastrados." },
				{ status: 403 },
			);
		}

		const salt = await bcrypt.genSalt(10);
		// Senha forte para produção
		const hash = await bcrypt.hash("Skyx@Admin2026!", salt);

		const admin = await prisma.usuario.create({
			data: {
				id: "admin-master",
				nome: "Comandante Operacional",
				email: "admin@skyx.com.br",
				senhaHash: hash,
				role: "ADMIN",
			},
		});

		return NextResponse.json({
			success: true,
			message: "Usuário Master criado com sucesso e rota bloqueada permanentemente!",
			credenciais: {
				email: admin.email,
				senha: "Skyx@Admin2026!",
			},
		});
	} catch (error) {
		console.error("Erro no setup:", error);
		return NextResponse.json(
			{ error: "Erro interno no servidor" },
			{ status: 500 },
		);
	}
}
