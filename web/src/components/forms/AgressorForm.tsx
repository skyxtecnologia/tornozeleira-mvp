"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AgressorForm() {
	const [loading, setLoading] = useState(false);
	const [status, setStatus] = useState("");

	async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setLoading(true);
		setStatus("");

		const formData = new FormData(e.currentTarget);
		const data = {
			nome: formData.get("nome"),
			cpf: formData.get("cpf"),
			tipo: "AGRESSOR",
		};

		try {
			const res = await fetch("/api/monitorados", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			});
			if (res.ok) {
				setStatus("Agressor cadastrado com sucesso!");
				e.currentTarget.reset();
			} else {
				setStatus("Erro ao cadastrar agressor.");
			}
		} catch (_error) {
			setStatus("Erro de conexão.");
		}
		setLoading(false);
	}

	return (
		<Card className="bg-slate-900 border-slate-800 text-slate-100">
			<CardHeader>
				<CardTitle>Novo Agressor</CardTitle>
				<CardDescription className="text-slate-400">
					Cadastre os dados de um indivíduo monitorado.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form onSubmit={onSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="nomeAgressor">Nome Completo</Label>
						<Input
							id="nomeAgressor"
							name="nome"
							required
							className="bg-slate-950 border-slate-800"
							placeholder="João da Silva"
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="cpfAgressor">CPF</Label>
						<Input
							id="cpfAgressor"
							name="cpf"
							required
							className="bg-slate-950 border-slate-800"
							placeholder="111.111.111-11"
						/>
					</div>
					<Button
						type="submit"
						disabled={loading}
						className="w-full bg-red-600 hover:bg-red-700 text-white"
					>
						{loading ? "Salvando..." : "Salvar Agressor"}
					</Button>
					{status && (
						<p className="text-sm mt-2 text-center text-emerald-400">
							{status}
						</p>
					)}
				</form>
			</CardContent>
		</Card>
	);
}
