import { jwtVerify, SignJWT } from "jose";

const getJwtSecretKey = () => {
	const secret = process.env.JWT_SECRET || "SUPER_SECRET_KEY_FOR_MOCK_ENV";
	return new TextEncoder().encode(secret);
};

export async function signToken(payload: {
	id: string;
	email: string;
	role: string;
}) {
	return new SignJWT(payload)
		.setProtectedHeader({ alg: "HS256" })
		.setIssuedAt()
		.setExpirationTime("8h")
		.sign(getJwtSecretKey());
}

export async function verifyToken(token: string) {
	try {
		const verified = await jwtVerify(token, getJwtSecretKey());
		return verified.payload as { id: string; email: string; role: string };
	} catch (_error) {
		return null;
	}
}
