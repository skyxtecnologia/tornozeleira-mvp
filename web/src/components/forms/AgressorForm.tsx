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
import { AddressAutocomplete } from "./AddressAutocomplete";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface Dispositivo {
	id: string;
	imei: string;
	serial: string;
	tipo: string;
	status: string;
}

export function AgressorForm() {
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const [status, setStatus] = useState("");
	const [endereco, setEndereco] = useState("");
	const [dispositivos, setDispositivos] = useState<Dispositivo[]>([]);

	useEffect(() => {
		fetch("/api/dispositivos")
			.then((res) => res.json())
			.then((data) => {
				if (Array.isArray(data)) {
					// Filtra apenas tornozeleiras em estoque para agressores
					setDispositivos(data.filter((d) => d.tipo === "TORNOZELEIRA" && d.status === "ESTOQUE"));
				}
			})
			.catch(console.error);
	}, []);

	async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setLoading(true);
		setStatus("");

		const form = e.currentTarget;
		const formData = new FormData(form);
		const data = {
			nome: formData.get("nome"),
			cpf: formData.get("cpf"),
			telefone: formData.get("telefone"),
			endereco: formData.get("endereco"),
			tipo: "AGRESSOR",
			dispositivoId: formData.get("dispositivoId") || null,
		};

		try {
			const res = await fetch("/api/monitorados", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			});
			if (res.ok) {
				setStatus("Agressor cadastrado com sucesso!");
				form.reset();
				setEndereco("");
				router.refresh();
			} else {
				const json = await res.json();
				setStatus(`Erro: ${json.error || "Falha ao cadastrar agressor."}`);
			}
		} catch (error) {
			console.error(error);
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
						<div className="space-y-2 md:col-span-2">
							<Label htmlFor="endereco">Busca de Endereço Automática</Label>
							<AddressAutocomplete
								id="endereco"
								name="endereco"
								value={endereco}
								onChange={setEndereco}
								placeholder="Digite o CEP ou Nome da Rua/Bairro para buscar..."
							/>
						</div>
						<div className="space-y-2 md:col-span-2">
							<Label htmlFor="dispositivoId">Vincular Tornozeleira Eletrônica (Opcional)</Label>
							<select
								id="dispositivoId"
								name="dispositivoId"
								className="flex h-9 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
							>
								<option value="">Nenhuma tornozeleira vinculada agora</option>
								{dispositivos.map((d) => (
									<option key={d.id} value={d.id}>
										{d.serial} (IMEI: {d.imei})
									</option>
								))}
							</select>
							<p className="text-xs text-slate-500 mt-1">Apenas equipamentos no "ESTOQUE" aparecem aqui.</p>
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
