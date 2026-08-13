import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
	const hash = await bcrypt.hash("admin123", 10);

	const admin = await prisma.usuario.upsert({
		where: { email: "admin@skyx.com.br" },
		update: {
            senhaHash: hash
        },
		create: {
			id: "admin-master",
			nome: "Administrador Central",
			email: "admin@skyx.com.br",
			senhaHash: hash,
			role: "ADMIN",
		},
	});

	console.log("✅ Usuário Master Criado/Atualizado!");
    console.log("Login:", admin.email);
    console.log("Senha: admin123");
}

main()
	.then(async () => {
		await prisma.$disconnect();
	})
	.catch(async (e) => {
		console.error("Erro ao criar usuário:", e);
		await prisma.$disconnect();
		process.exit(1);
	});
