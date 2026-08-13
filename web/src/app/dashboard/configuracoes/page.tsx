"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserCog, Loader2 } from "lucide-react";

export default function ConfiguracoesPage() {
	const [loading, setLoading] = useState(false);
	const [initialLoading, setInitialLoading] = useState(true);
	const [status, setStatus] = useState("");
	const [statusType, setStatusType] = useState<"success" | "error">("success");

	const [formData, setFormData] = useState({
		nome: "",
		senha: "",
	});
	const [email, setEmail] = useState("");
	const [role, setRole] = useState("");

	useEffect(() => {
		async function fetchPerfil() {
			try {
				const res = await fetch("/api/auth/me");
				if (res.ok) {
					const data = await res.json();
					setFormData({ nome: data.user.nome, senha: "" });
					setEmail(data.user.email);
					setRole(data.user.role);
				}
			} catch (err) {
				console.error(err);
			} finally {
				setInitialLoading(false);
			}
		}
		fetchPerfil();
	}, []);

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		setLoading(true);
		setStatus("");

		try {
			const res = await fetch("/api/usuarios/perfil", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(formData),
			});
			const data = await res.json();

			if (res.ok) {
				setStatus("Perfil atualizado com sucesso!");
				setStatusType("success");
				setFormData((prev) => ({ ...prev, senha: "" })); // Limpa a senha visualmente
				
				// Dispara um evento customizado para o layout atualizar o nome no cabeçalho
				window.dispatchEvent(new CustomEvent("perfilUpdated", { detail: { nome: data.user.nome } }));
			} else {
				setStatus(data.error || "Erro ao atualizar perfil");
				setStatusType("error");
			}
		} catch (error) {
			setStatus("Erro de conexão");
			setStatusType("error");
		} finally {
			setLoading(false);
		}
	}

	if (initialLoading) {
		return (
			<div className="flex h-full items-center justify-center text-slate-400">
				<Loader2 className="h-8 w-8 animate-spin" />
			</div>
		);
	}

	return (
		<div className="p-6 max-w-2xl mx-auto space-y-6">
			<div>
				<h2 className="text-3xl font-bold tracking-tight text-slate-100 flex items-center gap-3">
					<UserCog className="h-8 w-8 text-indigo-500" />
					Configurações da Conta
				</h2>
				<p className="text-slate-400 mt-2">
					Gerencie as informações do seu perfil de operador e credenciais de acesso.
				</p>
			</div>

			<Card className="bg-slate-900 border-slate-800 text-slate-100">
				<CardHeader>
					<CardTitle>Meu Perfil</CardTitle>
					<CardDescription className="text-slate-400">
						Visualize e edite as informações da sua conta.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={onSubmit} className="space-y-4">
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="email" className="text-slate-400">E-mail (Não editável)</Label>
								<Input
									id="email"
									value={email}
									disabled
									className="bg-slate-950/50 border-slate-800 text-slate-500 cursor-not-allowed"
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="role" className="text-slate-400">Nível de Acesso (Não editável)</Label>
								<Input
									id="role"
									value={role}
									disabled
									className="bg-slate-950/50 border-slate-800 text-indigo-400/70 font-semibold cursor-not-allowed"
								/>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="nome">Nome do Operador</Label>
							<Input
								id="nome"
								required
								value={formData.nome}
								onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
								className="bg-slate-950 border-slate-800"
								placeholder="Seu nome completo"
							/>
						</div>

						<div className="space-y-2 pt-4 border-t border-slate-800">
							<Label htmlFor="senha">Alterar Senha</Label>
							<Input
								id="senha"
								type="password"
								value={formData.senha}
								onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
								className="bg-slate-950 border-slate-800"
								placeholder="Deixe em branco para manter a senha atual"
							/>
							<p className="text-xs text-slate-500">
								Digite uma nova senha apenas se quiser alterá-la.
							</p>
						</div>

						{status && (
							<div className={`p-3 rounded-md text-sm font-medium ${statusType === "success" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
								{status}
							</div>
						)}

						<Button
							type="submit"
							disabled={loading}
							className="w-full bg-indigo-600 hover:bg-indigo-700 text-white mt-4"
						>
							{loading ? (
								<><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Salvando...</>
							) : (
								"Salvar Alterações"
							)}
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
