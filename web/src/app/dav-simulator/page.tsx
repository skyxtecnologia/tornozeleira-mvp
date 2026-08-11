"use client";

import { AlertCircle, CheckCircle2, Shield } from "lucide-react";
import { useState } from "react";

export default function DavSimulatorPage() {
	const [imei, setImei] = useState("999999999999"); // Padrão usado nos nossos testes
	const [status, setStatus] = useState<"idle" | "firing" | "sent">("idle");
	const [errorMsg, setErrorMsg] = useState("");

	const handlePanic = async () => {
		setStatus("firing");
		setErrorMsg("");

		try {
			const res = await fetch("/api/panico", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ imei }),
			});

			const data = await res.json();

			if (res.ok) {
				setStatus("sent");
				setTimeout(() => setStatus("idle"), 3000);
			} else {
				setStatus("idle");
				setErrorMsg(data.error || "Erro ao acionar o pânico.");
			}
		} catch (_err) {
			setStatus("idle");
			setErrorMsg("Erro de conexão.");
		}
	};

	return (
		<div className="flex h-screen w-full items-center justify-center bg-slate-950">
			{/* "Celular" Wrapper */}
			<div className="w-[360px] h-[720px] bg-slate-900 rounded-[3rem] border-8 border-slate-800 p-6 flex flex-col relative overflow-hidden shadow-2xl">
				{/* Header do App SIMULADO */}
				<div className="flex items-center justify-between mb-8 mt-4">
					<div className="flex items-center space-x-2">
						<Shield className="w-6 h-6 text-indigo-400" />
						<span className="text-slate-100 font-semibold tracking-wide">
							App Vítima (DAV)
						</span>
					</div>
				</div>

				<div className="mb-8">
					<label htmlFor="imei" className="block text-xs text-slate-400 mb-1">
						IMEI (Identificador do Celular da Vítima)
					</label>
					<input
						id="imei"
						value={imei}
						onChange={(e) => setImei(e.target.value)}
						className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-100 text-center font-mono focus:border-indigo-500 focus:outline-none transition-colors"
					/>
				</div>

				{/* Área Central (Botão) */}
				<div className="flex-1 flex flex-col items-center justify-center relative">
					{/* Ondas pulsantes de fundo se estiver "firing" */}
					{status === "firing" && (
						<>
							<div className="absolute w-64 h-64 bg-red-600/20 rounded-full animate-ping" />
							<div className="absolute w-48 h-48 bg-red-600/40 rounded-full animate-ping delay-150" />
						</>
					)}

					<button
						type="button"
						onClick={handlePanic}
						disabled={status !== "idle"}
						className={`relative w-48 h-48 rounded-full flex flex-col items-center justify-center transition-all duration-300 transform shadow-[0_0_50px_rgba(220,38,38,0.5)] ${
							status === "idle"
								? "bg-gradient-to-b from-red-500 to-red-700 hover:scale-105 active:scale-95 cursor-pointer"
								: "bg-red-800 scale-95 opacity-80 cursor-not-allowed"
						}`}
					>
						{status === "sent" ? (
							<CheckCircle2 className="w-20 h-20 text-white" />
						) : (
							<AlertCircle className="w-20 h-20 text-white mb-2" />
						)}
						<span className="text-white font-bold tracking-widest uppercase text-xl">
							{status === "sent" ? "Enviado" : "Pânico"}
						</span>
					</button>

					<p className="text-slate-400 text-center text-sm mt-12 px-4 leading-relaxed">
						Pressione o botão acima em caso de emergência ou aproximação do
						agressor.
					</p>

					{errorMsg && (
						<p className="text-red-400 text-xs mt-6 bg-red-950/50 p-2 rounded w-full text-center border border-red-900/50">
							{errorMsg}
						</p>
					)}
				</div>
			</div>
		</div>
	);
}
