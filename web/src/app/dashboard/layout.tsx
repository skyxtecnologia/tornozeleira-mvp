"use client";

import {
	Bell,
	Home,
	LogOut,
	Map as MapIcon,
	Menu,
	Settings,
	ShieldAlert,
	Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const [isCollapsed, setIsCollapsed] = useState(false);
	const [operadorNome, setOperadorNome] = useState("Carregando...");
	const pathname = usePathname();
	const router = useRouter();

	useEffect(() => {
		fetch("/api/auth/me")
			.then((res) => res.json())
			.then((data) => {
				if (data?.user?.nome) {
					setOperadorNome(data.user.nome);
				}
			})
			.catch(console.error);

		const handlePerfilUpdate = (e: any) => {
			if (e.detail?.nome) {
				setOperadorNome(e.detail.nome);
			}
		};

		window.addEventListener("perfilUpdated", handlePerfilUpdate);
		return () => window.removeEventListener("perfilUpdated", handlePerfilUpdate);
	}, []);

	const handleLogout = async () => {
		await fetch("/api/auth/logout", { method: "POST" });
		router.push("/login");
	};

	return (
		<div className="flex h-screen bg-slate-950 text-slate-50 overflow-hidden">
			{/* Sidebar minimalista e séria */}
			<aside
				className={`${
					isCollapsed ? "w-16" : "w-64"
				} flex-shrink-0 border-r border-slate-800 bg-slate-950/50 backdrop-blur-xl flex flex-col justify-between transition-all duration-300 relative`}
			>
				<div>
					<div className="h-16 flex items-center justify-between border-b border-slate-800 relative px-4">
						{!isCollapsed && (
							<div className="flex items-center w-full justify-start">
								<img
									src="/logo-guarda.png"
									alt="Logo Guarda"
									className="h-10 shrink-0 object-contain drop-shadow-md"
									onError={(e) => {
										e.currentTarget.style.display = "none";
										const parent = e.currentTarget.parentElement;
										if (parent) {
											parent.innerHTML =
												'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-indigo-500"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path><path d="m9 12 2 2 4-4"></path></svg>';
										}
									}}
								/>
								<div className="ml-3 flex flex-col">
									<span className="font-bold tracking-wide text-[10px] uppercase whitespace-nowrap text-indigo-400">
										Guarda Municipal
									</span>
									<span className="font-black tracking-widest text-xs uppercase whitespace-nowrap">
										SME Macaé
									</span>
								</div>
							</div>
						)}
						<button
							type="button"
							onClick={() => setIsCollapsed(!isCollapsed)}
							className={`flex items-center justify-center p-2 text-slate-500 hover:bg-slate-800/50 hover:text-slate-300 rounded-md transition-colors ${isCollapsed ? "w-full" : ""}`}
						>
							<Menu className="h-5 w-5" />
						</button>
					</div>

					<nav className="p-2 space-y-1 mt-4 overflow-hidden">
						<NavItem
							href="/dashboard"
							icon={<Home className="h-5 w-5 shrink-0" />}
							label="Visão Geral"
							active={pathname === "/dashboard"}
							isCollapsed={isCollapsed}
						/>
						<NavItem
							href="/dashboard/map"
							icon={<MapIcon className="h-5 w-5 shrink-0" />}
							label="Monitoramento"
							active={pathname === "/dashboard/map"}
							isCollapsed={isCollapsed}
						/>
						<NavItem
							href="/dashboard/medidas"
							icon={<ShieldAlert className="h-5 w-5 shrink-0" />}
							label="Medidas Protetivas"
							active={pathname === "/dashboard/medidas"}
							isCollapsed={isCollapsed}
						/>
						<NavItem
							href="/dashboard/cadastros"
							icon={<Users className="h-5 w-5 shrink-0" />}
							label="Cadastros"
							active={pathname === "/dashboard/cadastros"}
							isCollapsed={isCollapsed}
						/>
						<NavItem
							href="/dashboard/agressores"
							icon={<Users className="h-5 w-5 shrink-0" />}
							label="Agressores"
							isCollapsed={isCollapsed}
						/>
						<NavItem
							href="/dashboard/vitimas"
							icon={<Users className="h-5 w-5 shrink-0" />}
							label="Vítimas"
							isCollapsed={isCollapsed}
						/>
						<NavItem
							href="/dashboard/alertas"
							icon={<Bell className="h-5 w-5 shrink-0" />}
							label="Alertas"
							isCollapsed={isCollapsed}
						/>
					</nav>
				</div>

				<div className="p-2 border-t border-slate-800">
					<NavItem
						href="/configuracoes"
						icon={<Settings className="h-5 w-5 shrink-0" />}
						label="Configurações"
						isCollapsed={isCollapsed}
					/>
					<button
						type="button"
						onClick={handleLogout}
						className={`w-full flex items-center p-3 rounded-md transition-colors text-slate-400 hover:bg-slate-800/50 hover:text-red-400 ${
							isCollapsed ? "justify-center" : "justify-start gap-3"
						}`}
						title={isCollapsed ? "Sair" : undefined}
					>
						<LogOut className="h-5 w-5 shrink-0" />
						{!isCollapsed && (
							<span className="text-sm font-medium whitespace-nowrap">
								Sair do Sistema
							</span>
						)}
					</button>
				</div>
			</aside>

			{/* Conteúdo Principal */}
			<main className="flex-1 flex flex-col min-w-0">
				{/* Cabeçalho minimalista */}
				<header className="h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm flex items-center justify-between px-6 shrink-0 z-10">
					<div>
						<h1 className="text-lg font-medium">Painel de Operações</h1>
					</div>
					<div className="flex items-center gap-4">
						<div className="flex items-center gap-2">
							<div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
							<span className="text-xs text-slate-400 uppercase font-medium tracking-wider hidden sm:inline-block">
								Sistema Online
							</span>
						</div>
						<div className="h-4 w-px bg-slate-800 hidden sm:block"></div>
						<div className="flex items-center gap-2 text-sm">
							<span className="text-slate-400 hidden sm:inline-block">
								Operador:
							</span>
							<span className="font-medium max-w-[150px] truncate" title={operadorNome}>{operadorNome}</span>
							<Badge
								variant="outline"
								className="ml-2 border-slate-700 bg-slate-900 text-slate-300 hidden sm:inline-flex"
							>
								Turno A
							</Badge>
						</div>
					</div>
				</header>

				{/* Área onde a página específica será renderizada */}
				<div className="flex-1 relative">{children}</div>
			</main>
		</div>
	);
}

function NavItem({
	href,
	icon,
	label,
	active = false,
	isCollapsed,
}: {
	href: string;
	icon: React.ReactNode;
	label: string;
	active?: boolean;
	isCollapsed: boolean;
}) {
	return (
		<Link
			href={href}
			className={`flex items-center p-3 rounded-md transition-colors overflow-hidden ${
				active
					? "bg-slate-800 text-slate-50"
					: "text-slate-400 hover:bg-slate-800/50 hover:text-slate-100"
			} ${isCollapsed ? "justify-center" : "justify-start gap-3"}`}
			title={isCollapsed ? label : undefined}
		>
			{icon}
			{!isCollapsed && (
				<span className="text-sm font-medium whitespace-nowrap">{label}</span>
			)}
		</Link>
	);
}
