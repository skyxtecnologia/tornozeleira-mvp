"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function MobileVitimaLogin() {
	const [cpf, setCpf] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const router = useRouter();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError("");

		try {
			const res = await fetch("/api/mobile/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ cpf }),
			});
			const data = await res.json();

			if (res.ok) {
				// Salva o IMEI e nome no localStorage para usar na tela do radar
				localStorage.setItem("vitima_imei", data.dispositivo.imei);
				localStorage.setItem("vitima_nome", data.vitima.nome);
				router.push("/mobile/vitima/tracker");
			} else {
				setError(data.error || "CPF não encontrado");
			}
		} catch (err) {
			setError("Erro de conexão");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-slate-950 flex flex-col p-6 items-center justify-center">
			<div className="w-full max-w-sm space-y-8">
				<div className="text-center">
					<div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
						<ShieldCheck className="w-10 h-10 text-indigo-400" />
					</div>
					<h1 className="text-2xl font-bold text-slate-100 tracking-tight">
						Guarda Municipal - Cidadão
					</h1>
					<p className="text-slate-400 mt-2 text-sm">
						Digite o seu CPF para acessar o aplicativo de proteção (DAV).
					</p>
				</div>

				<Card className="bg-slate-900 border-slate-800 text-slate-100 shadow-xl shadow-indigo-500/5">
					<CardHeader>
						<CardTitle>Acesso à Proteção</CardTitle>
						<CardDescription className="text-slate-400">
							Conecte seu celular à Central de Monitoramento
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleSubmit} className="space-y-6">
							<div className="space-y-2">
								<Label htmlFor="cpf">Seu CPF</Label>
								<Input
									id="cpf"
									type="tel"
									required
									value={cpf}
									onChange={(e) => setCpf(e.target.value)}
									placeholder="Apenas números"
									className="bg-slate-950 border-slate-800 h-12 text-lg text-center tracking-widest"
								/>
							</div>

							{error && (
								<p className="text-sm text-red-400 text-center font-medium">
									{error}
								</p>
							)}

							<Button
								type="submit"
								disabled={loading}
								className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-lg"
							>
								{loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Entrar"}
							</Button>
						</form>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
