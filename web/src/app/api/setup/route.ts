import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function POST(request: Request) {
	try {
		// Proteção vital: Verifica se já existe algum usuário no banco.
		const count = await prisma.usuario.count();
		if (count > 0) {
			return NextResponse.json(
				{ error: "Setup bloqueado. O sistema já possui usuários cadastrados." },
				{ status: 403 },
			);
		}

		const body = await request.json();
		const { nome, email, senha } = body;

		if (!nome || !email || !senha) {
			return NextResponse.json(
				{ error: "Nome, email e senha são obrigatórios." },
				{ status: 400 },
			);
		}

		const salt = await bcrypt.genSalt(10);
		const hash = await bcrypt.hash(senha, salt);

		const admin = await prisma.usuario.create({
			data: {
				id: `admin-${Date.now()}`,
				nome,
				email,
				senhaHash: hash,
				role: "ADMIN",
			},
		});

		return NextResponse.json({
			success: true,
			message: "Usuário Master criado com sucesso e rota bloqueada permanentemente!",
		});
	} catch (error) {
		console.error("Erro no setup:", error);
		return NextResponse.json(
			{ error: "Erro interno no servidor" },
			{ status: 500 },
		);
	}
}
