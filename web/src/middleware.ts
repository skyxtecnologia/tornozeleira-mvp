import { jwtVerify } from "jose";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const getJwtSecretKey = () => {
	const secret = process.env.JWT_SECRET || "SUPER_SECRET_KEY_FOR_MOCK_ENV";
	return new TextEncoder().encode(secret);
};

export async function middleware(request: NextRequest) {
	// Apenas protege as rotas dentro de /dashboard
	if (request.nextUrl.pathname.startsWith("/dashboard")) {
		const token = request.cookies.get("auth_token")?.value;

		if (!token) {
			return NextResponse.redirect(new URL("/login", request.url));
		}

		try {
			// Verifica se o token é válido
			await jwtVerify(token, getJwtSecretKey());
			return NextResponse.next();
		} catch (_error) {
			// Token expirado ou inválido
			return NextResponse.redirect(new URL("/login", request.url));
		}
	}

	// Se o usuário já estiver logado e tentar acessar /login, redireciona para o dashboard
	if (
		request.nextUrl.pathname === "/login" ||
		request.nextUrl.pathname === "/"
	) {
		const token = request.cookies.get("auth_token")?.value;
		if (token) {
			try {
				await jwtVerify(token, getJwtSecretKey());
				return NextResponse.redirect(new URL("/dashboard", request.url));
			} catch (_error) {
				return NextResponse.next();
			}
		}
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
