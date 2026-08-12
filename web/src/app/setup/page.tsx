"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Loader2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function SetupPage() {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState(false);

	const [formData, setFormData] = useState({
		nome: "",
		email: "",
		senha: "",
	});

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setError("");

		try {
			const res = await fetch("/api/setup", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(formData),
			});

			const data = await res.json();

			if (!res.ok) {
				throw new Error(data.error || "Erro ao criar administrador");
			}

			setSuccess(true);
			setTimeout(() => {
				router.push("/login");
			}, 3000);
		} catch (err: any) {
			setError(err.message);
		} finally {
			setIsLoading(false);
		}
	};

	if (success) {
		return (
			<div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
				<Card className="w-full max-w-md bg-slate-900 border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.1)] text-center py-8">
					<div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
						<ShieldCheck className="w-10 h-10 text-emerald-500" />
					</div>
					<h2 className="text-2xl font-bold text-white mb-2">Setup Concluído!</h2>
					<p className="text-slate-400">
						Administrador Master criado. Redirecionando para o login...
					</p>
				</Card>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
			{/* Efeitos de fundo */}
			<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />

			<Card className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border-slate-800 shadow-2xl relative z-10">
				<CardHeader className="space-y-3 pb-6">
					<div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mb-2 mx-auto">
						<ShieldCheck className="w-8 h-8 text-indigo-400" />
					</div>
					<CardTitle className="text-2xl font-bold text-center text-white tracking-tight">
						Setup Inicial do Sistema
					</CardTitle>
					<CardDescription className="text-center text-slate-400">
						Crie a primeira conta de Administrador. Esta tela será bloqueada permanentemente após a criação.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className="space-y-4">
						{error && (
							<div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium text-center">
								{error}
							</div>
						)}

						<div className="space-y-2">
							<Label htmlFor="nome" className="text-slate-300">
								Nome do Comandante/Operador
							</Label>
							<Input
								id="nome"
								required
								value={formData.nome}
								onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
								className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-indigo-500"
								placeholder="Ex: Cel. Roberto Silva"
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="email" className="text-slate-300">
								E-mail Institucional
							</Label>
							<Input
								id="email"
								type="email"
								required
								value={formData.email}
								onChange={(e) => setFormData({ ...formData, email: e.target.value })}
								className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-indigo-500"
								placeholder="admin@instituicao.gov.br"
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="senha" className="text-slate-300">
								Senha Mestra
							</Label>
							<Input
								id="senha"
								type="password"
								required
								value={formData.senha}
								onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
								className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-indigo-500"
								placeholder="••••••••"
							/>
						</div>

						<Button
							type="submit"
							disabled={isLoading}
							className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-6 rounded-xl mt-4"
						>
							{isLoading ? (
								<Loader2 className="w-5 h-5 animate-spin" />
							) : (
								"Criar Conta Master"
							)}
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
