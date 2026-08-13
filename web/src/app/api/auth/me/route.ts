import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
	try {
		const token = (await cookies()).get("auth_token")?.value;
		if (!token) {
			return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
		}

		const payload = await verifyToken(token);
		if (!payload) {
			return NextResponse.json({ error: "Token inválido" }, { status: 401 });
		}

		const usuario = await prisma.usuario.findUnique({
			where: { id: payload.id },
			select: {
				id: true,
				nome: true,
				email: true,
				role: true,
			},
		});

		if (!usuario) {
			return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
		}

		return NextResponse.json({ user: usuario }, { status: 200 });
	} catch (error) {
		console.error("Erro em /api/auth/me:", error);
		return NextResponse.json(
			{ error: "Erro interno no servidor" },
			{ status: 500 },
		);
	}
}
