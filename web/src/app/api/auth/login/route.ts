import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { signToken } from "@/lib/jwt";

const prisma = new PrismaClient();

export async function POST(request: Request) {
	try {
		const { email, senha } = await request.json();

		if (!email || !senha) {
			return NextResponse.json(
				{ error: "E-mail e senha são obrigatórios" },
				{ status: 400 },
			);
		}

		const usuario = await prisma.usuario.findUnique({
			where: { email },
		});

		if (!usuario) {
			return NextResponse.json(
				{ error: "Credenciais inválidas" },
				{ status: 401 },
			);
		}

		const senhaValida = await bcrypt.compare(senha, usuario.senhaHash);

		if (!senhaValida) {
			return NextResponse.json(
				{ error: "Credenciais inválidas" },
				{ status: 401 },
			);
		}

		// Gera o JWT
		const token = await signToken({
			id: usuario.id,
			email: usuario.email,
			role: usuario.role,
		});

		// Configura o cookie
		(await cookies()).set({
			name: "auth_token",
			value: token,
			httpOnly: true,
			path: "/",
			secure: process.env.NODE_ENV === "production",
			maxAge: 60 * 60 * 8, // 8 horas
		});

		return NextResponse.json({
			success: true,
			user: {
				id: usuario.id,
				nome: usuario.nome,
				email: usuario.email,
				role: usuario.role,
			},
		});
	} catch (error) {
		console.error("Erro no login:", error);
		return NextResponse.json(
			{ error: "Erro interno no servidor" },
			{ status: 500 },
		);
	}
}
