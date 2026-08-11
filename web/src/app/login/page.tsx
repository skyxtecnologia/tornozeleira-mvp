"use client";

import { Loader2, Lock, Mail, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [senha, setSenha] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError("");

		try {
			const res = await fetch("/api/auth/login", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ email, senha }),
			});

			const data = await res.json();

			if (res.ok) {
				// Login successful, middleware will now allow access to /dashboard
				router.push("/dashboard");
			} else {
				setError(data.error || "Erro ao realizar login");
			}
		} catch (_err) {
			setError("Erro de conexão com o servidor");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
			{/* Efeitos de Fundo */}
			<div className="absolute inset-0 overflow-hidden pointer-events-none">
				<div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px]" />
				<div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px]" />
			</div>

			<div className="w-full max-w-md relative z-10">
				{/* Cabeçalho de Logos Institucionais */}
				<div className="flex flex-col items-center mb-10 space-y-4">
					<div className="flex items-center justify-center gap-6">
						{/* Logo da Guarda Municipal (Usuário deve salvar a imagem enviada em web/public/logo-guarda.png) */}
						<div className="w-32 h-32 flex items-center justify-center p-2 mb-2">
							<img
								src="/logo-guarda.png"
								alt="Logo Guarda Municipal de Macaé"
								className="w-full h-full object-contain drop-shadow-2xl"
								onError={(e) => {
									// Fallback tático caso a imagem ainda não tenha sido salva na pasta
									e.currentTarget.style.display = "none";
									const parent = e.currentTarget.parentElement;
									if (parent) {
										parent.innerHTML =
											'<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-indigo-500"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path><path d="m9 12 2 2 4-4"></path></svg>';
									}
								}}
							/>
						</div>
					</div>
					<div className="text-center">
						<h1 className="text-2xl font-black text-slate-100 tracking-tight uppercase">
							Centro de Monitoramento
						</h1>
						<p className="text-sm font-semibold text-indigo-400 mt-1 uppercase tracking-widest">
							Patrulha Maria da Penha • Macaé/RJ
						</p>
					</div>
				</div>

				{/* Formulário de Login */}
				<div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl p-8">
					<h2 className="text-lg font-bold text-slate-300 mb-6 flex items-center gap-2">
						<Lock className="w-5 h-5 text-indigo-500" />
						Acesso Restrito
					</h2>

					{error && (
						<div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg mb-6 flex items-start gap-2">
							<ShieldCheck className="w-5 h-5 shrink-0" />
							<span>{error}</span>
						</div>
					)}

					<form onSubmit={handleLogin} className="space-y-5">
						<div className="space-y-2">
							<label
								htmlFor="email"
								className="text-xs font-semibold text-slate-400 uppercase tracking-wider"
							>
								E-mail Operacional
							</label>
							<div className="relative">
								<Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
								<input
									id="email"
									type="email"
									required
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
									placeholder="operador@skyx.com.br"
								/>
							</div>
						</div>

						<div className="space-y-2">
							<label
								htmlFor="senha"
								className="text-xs font-semibold text-slate-400 uppercase tracking-wider"
							>
								Senha de Acesso
							</label>
							<div className="relative">
								<Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
								<input
									id="senha"
									type="password"
									required
									value={senha}
									onChange={(e) => setSenha(e.target.value)}
									className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
									placeholder="••••••••"
								/>
							</div>
						</div>

						<button
							type="submit"
							disabled={loading}
							className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl uppercase tracking-widest transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50 shadow-[0_0_20px_rgba(79,70,229,0.2)] hover:shadow-[0_0_30px_rgba(79,70,229,0.4)]"
						>
							{loading ? (
								<Loader2 className="w-5 h-5 animate-spin" />
							) : (
								"Autenticar"
							)}
						</button>
					</form>
				</div>

				<p className="text-center text-xs text-slate-600 mt-8">
					Acesso não autorizado a este sistema é crime federal. <br />
					Lei Carolina Dieckmann (Lei 12.737/2012).
				</p>
			</div>
		</div>
	);
}
