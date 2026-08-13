"use client";

import { useEffect, useState } from "react";
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

interface Monitorado {
	id: string;
	nome: string;
	cpf: string;
	tipo: string;
}

export function MedidaForm() {
	const [loading, setLoading] = useState(false);
	const [status, setStatus] = useState("");
	const [vitimas, setVitimas] = useState<Monitorado[]>([]);
	const [agressores, setAgressores] = useState<Monitorado[]>([]);

	useEffect(() => {
		fetch("/api/monitorados")
			.then((res) => res.json())
			.then((data) => {
				if (Array.isArray(data)) {
					setVitimas(data.filter((m) => m.tipo === "VITIMA"));
					setAgressores(data.filter((m) => m.tipo === "AGRESSOR"));
				}
			})
			.catch(console.error);
	}, []);

	async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setLoading(true);
		setStatus("");

		const formData = new FormData(e.currentTarget);
		const data = {
			numeroProcesso: formData.get("numeroProcesso"),
			agressorId: formData.get("agressorId"),
			vitimaId: formData.get("vitimaId"),
			raioProtecaoMetros: formData.get("raioProtecaoMetros"),
			juizo: formData.get("juizo"),
			varaCriminal: formData.get("varaCriminal"),
			observacoes: formData.get("observacoes"),
		};

		try {
			const res = await fetch("/api/medidas", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			});
			
			const json = await res.json();
			
			if (res.ok) {
				setStatus("Medida Protetiva cadastrada com sucesso!");
				e.currentTarget.reset();
			} else {
				setStatus(`Erro: ${json.error || "Falha ao cadastrar medida."}`);
			}
		} catch (_error) {
			setStatus("Erro de conexão.");
		}
		setLoading(false);
	}

	return (
		<Card className="bg-slate-900 border-slate-800 text-slate-100">
			<CardHeader>
				<CardTitle>Nova Medida Protetiva</CardTitle>
				<CardDescription className="text-slate-400">
					Vincule um Agressor a uma Vítima com um raio de restrição.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form onSubmit={onSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="numeroProcesso">Número do Processo</Label>
						<Input
							id="numeroProcesso"
							name="numeroProcesso"
							required
							className="bg-slate-950 border-slate-800"
							placeholder="0001234-56.2026.8.21.0001"
						/>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="juizo">Juízo Responsável (Opcional)</Label>
							<Input
								id="juizo"
								name="juizo"
								className="bg-slate-950 border-slate-800"
								placeholder="Ex: 1º Juizado de Violência Doméstica"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="varaCriminal">Vara Criminal (Opcional)</Label>
							<Input
								id="varaCriminal"
								name="varaCriminal"
								className="bg-slate-950 border-slate-800"
								placeholder="Ex: 3ª Vara Criminal"
							/>
						</div>
					</div>
					<div className="space-y-2">
						<Label htmlFor="observacoes">Observações (Opcional)</Label>
						<Input
							id="observacoes"
							name="observacoes"
							className="bg-slate-950 border-slate-800"
							placeholder="Condições especiais da Medida Protetiva"
						/>
					</div>

					<div className="space-y-2 flex flex-col">
						<Label htmlFor="agressorId">Agressor Monitorado</Label>
						<select
							id="agressorId"
							name="agressorId"
							required
							className="flex h-9 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
						>
							<option value="">Selecione um Agressor...</option>
							{agressores.map((a) => (
								<option key={a.id} value={a.id}>
									{a.nome} ({a.cpf})
								</option>
							))}
						</select>
					</div>

					<div className="space-y-2 flex flex-col">
						<Label htmlFor="vitimaId">Vítima Protegida</Label>
						<select
							id="vitimaId"
							name="vitimaId"
							required
							className="flex h-9 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
						>
							<option value="">Selecione uma Vítima...</option>
							{vitimas.map((v) => (
								<option key={v.id} value={v.id}>
									{v.nome} ({v.cpf})
								</option>
							))}
						</select>
					</div>

					<div className="space-y-2">
						<Label htmlFor="raioProtecaoMetros">
							Raio de Proteção (metros)
						</Label>
						<Input
							id="raioProtecaoMetros"
							name="raioProtecaoMetros"
							type="number"
							required
							defaultValue="500"
							className="bg-slate-950 border-slate-800"
						/>
					</div>

					<Button
						type="submit"
						disabled={loading}
						className="w-full bg-orange-600 hover:bg-orange-700 text-white"
					>
						{loading ? "Salvando..." : "Salvar Medida"}
					</Button>
					{status && (
						<p
							className={`text-sm mt-2 text-center ${
								status.includes("Erro") ? "text-red-400" : "text-emerald-400"
							}`}
						>
							{status}
						</p>
					)}
				</form>
			</CardContent>
		</Card>
	);
}
