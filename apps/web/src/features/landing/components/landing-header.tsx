import { useLocale, useMessages } from "@/app/i18n/use-i18n.ts"
import type { Locale } from "@orar/locales"
import { getLocaleConfig, supportedLocales } from "@orar/locales"
import { Button } from "@orar/ui"
import { Link } from "@tanstack/react-router"
import { Globe } from "lucide-react"

export function LandingHeader() {
	const messages = useMessages()
	const { locale, setLocale } = useLocale()

	return (
		<header className="sticky top-0 z-50 w-full bg-surface-card/90 backdrop-blur-sm border-b border-border-subtle">
			<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
				<span className="text-xl font-bold tracking-tight text-text-primary">Orar</span>

				<div className="flex items-center gap-3">
					<div className="flex items-center gap-1.5 text-text-secondary">
						<Globe className="h-4 w-4" />
						<select
							value={locale}
							onChange={(e) => setLocale(e.target.value as Locale)}
							className="bg-transparent text-sm border-none outline-none cursor-pointer text-text-secondary"
						>
							{supportedLocales.map((loc) => (
								<option key={loc} value={loc}>
									{getLocaleConfig(loc).nativeName}
								</option>
							))}
						</select>
					</div>

					<Button asChild>
						<Link to="/dashboard">{messages.landing.heroCta}</Link>
					</Button>
				</div>
			</div>
		</header>
	)
}
