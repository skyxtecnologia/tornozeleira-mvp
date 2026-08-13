"use client";

import { Loader2, ShieldCheck, UserPlus } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { useRouter } from "next/navigation";

export function OperadorForm() {
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const [success, setSuccess] = useState(false);
	const [error, setError] = useState("");

	const [formData, setFormData] = useState({
		nome: "",
		email: "",
		senha: "",
		role: "OPERADOR",
	});

	const handleSubmit = async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setLoading(true);
		setError("");
		setSuccess(false);

		const form = e.currentTarget;
		const formData = new FormData(form);

		try {
			const res = await fetch("/api/auth/register", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(Object.fromEntries(formData)),
			});

			const data = await res.json();

			if (res.ok) {
				setSuccess(true);
				form.reset();
				setFormData({ nome: "", email: "", senha: "", role: "OPERADOR" });
				router.refresh();
			} else {
				setError(data.error || "Erro ao registrar usuário.");
			}
		} catch (error) {
			console.error(error);
			setError("Erro de comunicação com o servidor.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<Card className="bg-slate-900 border-slate-800">
			<CardHeader>
				<CardTitle className="text-xl text-slate-100 flex items-center gap-2">
					<UserPlus className="w-5 h-5 text-indigo-400" />
					Novo Operador
				</CardTitle>
				<CardDescription className="text-slate-400">
					Apenas perfis{" "}
					<Badge
						variant="outline"
						className="text-red-400 border-red-900 bg-red-950/30"
					>
						ADMIN
					</Badge>{" "}
					podem registrar novos policiais ou operadores.
				</CardDescription>
			</CardHeader>
			<CardContent>
				{error && (
					<div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg mb-6 flex items-start gap-2">
						<ShieldCheck className="w-5 h-5 shrink-0" />
						<span>{error}</span>
					</div>
				)}

				{success && (
					<div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm p-3 rounded-lg mb-6 flex items-start gap-2">
						<ShieldCheck className="w-5 h-5 shrink-0" />
						<span>
							Operador registrado com sucesso! Ele já pode acessar o sistema.
						</span>
					</div>
				)}

				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="space-y-2">
							<label
								htmlFor="nome"
								className="text-xs font-semibold text-slate-400 uppercase"
							>
								Nome Completo / Patente
							</label>
							<input
								id="nome"
								type="text"
								required
								value={formData.nome}
								onChange={(e) =>
									setFormData({ ...formData, nome: e.target.value })
								}
								className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:border-indigo-500 focus:outline-none"
								placeholder="Sgt. Silva"
							/>
						</div>

						<div className="space-y-2">
							<label
								htmlFor="email"
								className="text-xs font-semibold text-slate-400 uppercase"
							>
								E-mail Operacional
							</label>
							<input
								id="email"
								type="email"
								required
								value={formData.email}
								onChange={(e) =>
									setFormData({ ...formData, email: e.target.value })
								}
								className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:border-indigo-500 focus:outline-none"
								placeholder="silva@macaeseguranca.gov.br"
							/>
						</div>

						<div className="space-y-2">
							<label
								htmlFor="senha"
								className="text-xs font-semibold text-slate-400 uppercase"
							>
								Senha de Acesso
							</label>
							<input
								id="senha"
								type="password"
								required
								value={formData.senha}
								onChange={(e) =>
									setFormData({ ...formData, senha: e.target.value })
								}
								className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:border-indigo-500 focus:outline-none"
								placeholder="••••••••"
							/>
						</div>

						<div className="space-y-2">
							<label
								htmlFor="role"
								className="text-xs font-semibold text-slate-400 uppercase"
							>
								Nível de Permissão
							</label>
							<select
								id="role"
								value={formData.role}
								onChange={(e) =>
									setFormData({ ...formData, role: e.target.value })
								}
								className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:border-indigo-500 focus:outline-none"
							>
								<option value="OPERADOR">OPERADOR (Acesso Tático)</option>
								<option value="ADMIN">ADMINISTRADOR (Acesso Total)</option>
							</select>
						</div>
					</div>

					<button
						type="submit"
						disabled={loading}
						className="w-full mt-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-lg uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50"
					>
						{loading ? (
							<Loader2 className="w-5 h-5 animate-spin" />
						) : (
							"Registrar Conta Operacional"
						)}
					</button>
				</form>
			</CardContent>
		</Card>
	);
}
