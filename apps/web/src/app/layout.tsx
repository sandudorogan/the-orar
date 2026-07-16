import { useLocale, useMessages } from "@/app/i18n/use-i18n.ts"
import { useProject } from "@/app/project-context.tsx"
import type { Locale } from "@orar/locales"
import { getLocaleConfig, supportedLocales } from "@orar/locales"
import { cn } from "@orar/ui"
import { ScrollArea } from "@orar/ui"
import { Link, useMatchRoute } from "@tanstack/react-router"
import {
	CalendarDays,
	FileDown,
	Globe,
	LayoutDashboard,
	ListChecks,
	PanelLeft,
	PanelLeftClose,
	Redo2,
	Settings,
	Undo2,
	Zap,
} from "lucide-react"
import type { ReactNode } from "react"
import { useEffect, useState } from "react"

interface NavItem {
	path: string
	labelKey: keyof ReturnType<typeof useMessages>["nav"]
	icon: ReactNode
}

const navItems: NavItem[] = [
	{ path: "/dashboard", labelKey: "dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
	{ path: "/setup", labelKey: "setup", icon: <ListChecks className="h-5 w-5" /> },
	{ path: "/generate", labelKey: "generate", icon: <Zap className="h-5 w-5" /> },
	{ path: "/timetables", labelKey: "timetables", icon: <CalendarDays className="h-5 w-5" /> },
	{ path: "/exports", labelKey: "exports", icon: <FileDown className="h-5 w-5" /> },
	{ path: "/settings", labelKey: "settings", icon: <Settings className="h-5 w-5" /> },
]

export function AppLayout({ children }: { children: ReactNode }) {
	const [collapsed, setCollapsed] = useState(false)
	const messages = useMessages()
	const { locale, setLocale } = useLocale()
	const matchRoute = useMatchRoute()
	const { undo, redo, canUndo, canRedo } = useProject()

	useEffect(() => {
		function onKeyDown(e: KeyboardEvent) {
			if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== "z") return
			const target = e.target as HTMLElement
			if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)
				return
			e.preventDefault()
			if (e.shiftKey) redo()
			else undo()
		}
		window.addEventListener("keydown", onKeyDown)
		return () => window.removeEventListener("keydown", onKeyDown)
	}, [undo, redo])

	return (
		<div className="flex h-screen overflow-hidden">
			<aside
				className={cn(
					"flex flex-col bg-surface-sidebar text-text-on-sidebar transition-[width] duration-200",
					collapsed ? "w-[var(--sidebar-collapsed-width)]" : "w-[var(--sidebar-width)]",
				)}
			>
				<div className="flex h-14 items-center gap-2 px-3 border-b border-surface-sidebar-accent">
					{!collapsed && <span className="text-lg font-bold tracking-tight text-white">Orar</span>}
					<button
						type="button"
						onClick={() => setCollapsed(!collapsed)}
						className={cn(
							"flex items-center justify-center rounded-[var(--sidebar-item-radius)] p-1.5 text-text-on-sidebar hover:bg-[var(--sidebar-item-hover)] transition-colors",
							collapsed && "mx-auto",
						)}
					>
						{collapsed ? <PanelLeft className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
					</button>
				</div>

				<ScrollArea className="flex-1">
					<nav className="flex flex-col gap-1 p-2">
						{navItems.map((item) => {
							const isActive = matchRoute({
								to: item.path,
								fuzzy: item.path !== "/dashboard" && item.path !== "/setup",
							})

							return (
								<Link
									key={item.path}
									to={item.path}
									className={cn(
										"flex items-center gap-3 rounded-[var(--sidebar-item-radius)] px-3 py-2 text-sm transition-colors",
										"hover:bg-[var(--sidebar-item-hover)]",
										isActive && "bg-[var(--sidebar-item-active)] text-white",
										collapsed && "justify-center px-0",
									)}
								>
									{item.icon}
									{!collapsed && <span>{messages.nav[item.labelKey]}</span>}
								</Link>
							)
						})}
					</nav>
				</ScrollArea>

				<div className="border-t border-surface-sidebar-accent p-2">
					<div
						className={cn("flex items-center gap-1 pb-2", collapsed ? "justify-center" : "px-2")}
					>
						<button
							type="button"
							onClick={undo}
							disabled={!canUndo}
							title={messages.common.undo}
							className="flex items-center justify-center rounded-[var(--sidebar-item-radius)] p-1.5 text-text-on-sidebar hover:bg-[var(--sidebar-item-hover)] disabled:opacity-40 transition-colors"
						>
							<Undo2 className="h-4 w-4" />
						</button>
						{!collapsed && (
							<button
								type="button"
								onClick={redo}
								disabled={!canRedo}
								title={messages.common.redo}
								className="flex items-center justify-center rounded-[var(--sidebar-item-radius)] p-1.5 text-text-on-sidebar hover:bg-[var(--sidebar-item-hover)] disabled:opacity-40 transition-colors"
							>
								<Redo2 className="h-4 w-4" />
							</button>
						)}
					</div>
					<div className={cn("flex items-center gap-2", collapsed ? "justify-center" : "px-2")}>
						<Globe className="h-4 w-4 shrink-0" />
						{!collapsed && (
							<select
								value={locale}
								onChange={(e) => setLocale(e.target.value as Locale)}
								className="bg-transparent text-sm text-text-on-sidebar border-none outline-none cursor-pointer"
							>
								{supportedLocales.map((loc) => (
									<option key={loc} value={loc} className="bg-surface-sidebar text-text-on-sidebar">
										{getLocaleConfig(loc).nativeName}
									</option>
								))}
							</select>
						)}
					</div>
				</div>
			</aside>

			<main className="flex-1 overflow-auto bg-surface-page">
				<div className="p-6">{children}</div>
			</main>
		</div>
	)
}
