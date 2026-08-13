import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function PUT(request: Request) {
	try {
		const token = (await cookies()).get("auth_token")?.value;
		if (!token) {
			return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
		}

		const payload = await verifyToken(token);
		if (!payload) {
			return NextResponse.json({ error: "Token inválido" }, { status: 401 });
		}

		const { nome, senha } = await request.json();

		if (!nome) {
			return NextResponse.json({ error: "O nome é obrigatório" }, { status: 400 });
		}

		const updateData: any = { nome };

		if (senha && senha.trim() !== "") {
			const salt = await bcrypt.genSalt(10);
			updateData.senhaHash = await bcrypt.hash(senha, salt);
		}

		const usuarioAtualizado = await prisma.usuario.update({
			where: { id: payload.id },
			data: updateData,
			select: {
				id: true,
				nome: true,
				email: true,
				role: true,
			},
		});

		return NextResponse.json({ success: true, user: usuarioAtualizado }, { status: 200 });
	} catch (error) {
		console.error("Erro ao atualizar perfil:", error);
		return NextResponse.json(
			{ error: "Erro interno no servidor" },
			{ status: 500 },
		);
	}
}
