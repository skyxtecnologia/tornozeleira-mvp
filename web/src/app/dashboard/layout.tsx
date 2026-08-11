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
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const [isCollapsed, setIsCollapsed] = useState(false);
	const pathname = usePathname();

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
								<ShieldAlert className="h-6 w-6 text-red-500 shrink-0" />
								<span className="ml-3 font-semibold tracking-wide text-sm uppercase whitespace-nowrap">
									SME Central
								</span>
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
					<NavItem
						href="/logout"
						icon={<LogOut className="h-5 w-5 text-slate-400 shrink-0" />}
						label="Sair"
						isCollapsed={isCollapsed}
					/>
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
							<span className="font-medium">João Silva</span>
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
