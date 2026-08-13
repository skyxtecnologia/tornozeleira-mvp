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
	const [cep, setCep] = useState("");
	const [endereco, setEndereco] = useState("");
	const [loadingCep, setLoadingCep] = useState(false);

	const buscarCep = async (valorCep: string) => {
		const cepLimpo = valorCep.replace(/\D/g, "");
		if (cepLimpo.length === 8) {
			setLoadingCep(true);
			try {
				const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
				const data = await res.json();
				if (!data.erro) {
					setEndereco(`${data.logradouro}, Número: , ${data.bairro}, ${data.localidade} - ${data.uf}`);
				}
			} catch (error) {
				console.error("Erro ao buscar CEP", error);
			}
			setLoadingCep(false);
		}
	};

	async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setLoading(true);
		setStatus("");

		const formData = new FormData(e.currentTarget);
		const data = {
			nome: formData.get("nome"),
			cpf: formData.get("cpf"),
			telefone: formData.get("telefone"),
			endereco: formData.get("endereco"),
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
				setCep("");
				setEndereco("");
			} else {
				const json = await res.json();
				setStatus(`Erro: ${json.error || "Falha ao cadastrar agressor."}`);
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
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="telefone">Telefone (Opcional)</Label>
							<Input
								id="telefone"
								name="telefone"
								className="bg-slate-950 border-slate-800"
								placeholder="(22) 99999-9999"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="cep">CEP (Preenchimento Automático)</Label>
							<div className="relative">
								<Input
									id="cep"
									name="cep"
									value={cep}
									onChange={(e) => {
										setCep(e.target.value);
										if (e.target.value.length >= 8) {
											buscarCep(e.target.value);
										}
									}}
									maxLength={9}
									className="bg-slate-950 border-slate-800"
									placeholder="27910-000"
								/>
								{loadingCep && <span className="absolute right-3 top-2 text-xs text-slate-400">Buscando...</span>}
							</div>
						</div>
						<div className="space-y-2 md:col-span-2">
							<Label htmlFor="endereco">Endereço Principal (Opcional)</Label>
							<Input
								id="endereco"
								name="endereco"
								value={endereco}
								onChange={(e) => setEndereco(e.target.value)}
								className="bg-slate-950 border-slate-800"
								placeholder="Rua das Flores, 123"
							/>
						</div>
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
