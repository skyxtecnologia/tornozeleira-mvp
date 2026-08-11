import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";

const prisma = new PrismaClient();

export async function POST(request: Request) {
	try {
		// 1. Verifica se quem está chamando é um ADMIN
		const cookieStore = await cookies();
		const token = cookieStore.get("auth_token")?.value;

		if (!token) {
			return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
		}

		const payload = await verifyToken(token);
		if (payload?.role !== "ADMIN") {
			return NextResponse.json(
				{ error: "Apenas administradores podem registrar novos usuários" },
				{ status: 403 },
			);
		}

		// 2. Processa o registro
		const { nome, email, senha, role } = await request.json();

		if (!nome || !email || !senha) {
			return NextResponse.json(
				{ error: "Nome, e-mail e senha são obrigatórios" },
				{ status: 400 },
			);
		}

		const emailExistente = await prisma.usuario.findUnique({
			where: { email },
		});

		if (emailExistente) {
			return NextResponse.json(
				{ error: "Este e-mail já está em uso" },
				{ status: 400 },
			);
		}

		const salt = bcrypt.genSaltSync(10);
		const senhaHash = bcrypt.hashSync(senha, salt);

		const novoUsuario = await prisma.usuario.create({
			data: {
				nome,
				email,
				senhaHash,
				role: role === "ADMIN" ? "ADMIN" : "OPERADOR",
			},
		});

		return NextResponse.json(
			{
				success: true,
				user: {
					id: novoUsuario.id,
					nome: novoUsuario.nome,
					email: novoUsuario.email,
					role: novoUsuario.role,
				},
			},
			{ status: 201 },
		);
	} catch (error) {
		console.error("Erro no registro:", error);
		return NextResponse.json(
			{ error: "Erro interno no servidor" },
			{ status: 500 },
		);
	}
}
