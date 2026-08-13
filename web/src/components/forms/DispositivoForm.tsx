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
import { useRouter } from "next/navigation";

export function DispositivoForm() {
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const [status, setStatus] = useState("");

	async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setLoading(true);
		setStatus("");

		const form = e.currentTarget;
		const formData = new FormData(form);
		const data = {
			imei: formData.get("imei"),
			serial: formData.get("serial"),
			tipo: formData.get("tipo"),
		};

		try {
			const res = await fetch("/api/dispositivos", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			});
			if (res.ok) {
				setStatus("Dispositivo cadastrado com sucesso!");
				form.reset();
				router.refresh();
			} else {
				setStatus("Erro ao cadastrar dispositivo.");
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
				<CardTitle>Novo Dispositivo</CardTitle>
				<CardDescription className="text-slate-400">
					Cadastre uma nova Tornozeleira ou Dispositivo de Alarme à Vítima (DAV)
					no estoque.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form onSubmit={onSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="imei">IMEI</Label>
						<Input
							id="imei"
							name="imei"
							required
							className="bg-slate-950 border-slate-800"
							placeholder="15 dígitos numéricos"
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="serial">Serial / Patrimônio</Label>
						<Input
							id="serial"
							name="serial"
							required
							className="bg-slate-950 border-slate-800"
							placeholder="TRNZ-0000"
						/>
					</div>
					<div className="space-y-2 flex flex-col">
						<Label htmlFor="tipo">Tipo de Dispositivo</Label>
						<select
							id="tipo"
							name="tipo"
							required
							className="flex h-9 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
						>
							<option value="TORNOZELEIRA">
								Tornozeleira Eletrônica (Agressor)
							</option>
							<option value="DAV">DAV - Botão do Pânico (Vítima)</option>
						</select>
					</div>
					<Button
						type="submit"
						disabled={loading}
						className="w-full bg-slate-100 text-slate-900 hover:bg-slate-200"
					>
						{loading ? "Salvando..." : "Cadastrar Dispositivo"}
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
