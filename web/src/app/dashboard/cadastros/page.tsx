"use client";

import {
	Link as LinkIcon,
	LocateFixed,
	ShieldAlert,
	Users,
} from "lucide-react";
import { AgressorForm } from "@/components/forms/AgressorForm";
import { DispositivoForm } from "@/components/forms/DispositivoForm";
import { MedidaForm } from "@/components/forms/MedidaForm";
import { VitimaForm } from "@/components/forms/VitimaForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function CadastrosPage() {
	return (
		<div className="flex h-full w-full flex-col bg-slate-950 p-6 overflow-y-auto">
			<div className="mb-6">
				<h1 className="text-2xl font-bold text-slate-100">
					Gestão de Cadastros
				</h1>
				<p className="text-sm text-slate-400 mt-1">
					Administre as vítimas, agressores, dispositivos e medidas protetivas
					do sistema.
				</p>
			</div>

			<Tabs defaultValue="vitimas" className="w-full max-w-4xl mx-auto">
				<TabsList className="grid w-full grid-cols-4 bg-slate-900 border border-slate-800">
					<TabsTrigger
						value="vitimas"
						className="text-slate-400 hover:text-slate-100 data-[state=active]:bg-slate-800 data-[state=active]:text-indigo-400"
					>
						<Users className="w-4 h-4 mr-2" />
						Vítimas
					</TabsTrigger>
					<TabsTrigger
						value="agressores"
						className="text-slate-400 hover:text-slate-100 data-[state=active]:bg-slate-800 data-[state=active]:text-red-400"
					>
						<ShieldAlert className="w-4 h-4 mr-2" />
						Agressores
					</TabsTrigger>
					<TabsTrigger
						value="dispositivos"
						className="text-slate-400 hover:text-slate-100 data-[state=active]:bg-slate-800 data-[state=active]:text-slate-100"
					>
						<LocateFixed className="w-4 h-4 mr-2" />
						Dispositivos
					</TabsTrigger>
					<TabsTrigger
						value="medidas"
						className="text-slate-400 hover:text-slate-100 data-[state=active]:bg-slate-800 data-[state=active]:text-orange-400"
					>
						<LinkIcon className="w-4 h-4 mr-2" />
						Medidas Protetivas
					</TabsTrigger>
				</TabsList>

				<div className="mt-6">
					<TabsContent value="vitimas">
						<VitimaForm />
					</TabsContent>
					<TabsContent value="agressores">
						<AgressorForm />
					</TabsContent>
					<TabsContent value="dispositivos">
						<DispositivoForm />
					</TabsContent>
					<TabsContent value="medidas">
						<MedidaForm />
					</TabsContent>
				</div>
			</Tabs>
		</div>
	);
}
