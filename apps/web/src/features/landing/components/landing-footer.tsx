import { useLocale, useMessages } from "@/app/i18n/use-i18n.ts"
import type { Locale } from "@orar/locales"
import { getLocaleConfig, supportedLocales } from "@orar/locales"
import { Globe } from "lucide-react"

export function LandingFooter() {
	const messages = useMessages()
	const { locale, setLocale } = useLocale()

	return (
		<footer className="w-full bg-surface-raised border-t border-border-subtle py-8">
			<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
				<div className="flex items-center gap-2 text-sm text-text-secondary">
					<span className="font-semibold text-text-primary">Orar</span>
					<span>&middot;</span>
					<span>{messages.landing.footerTagline}</span>
				</div>

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
			</div>
		</footer>
	)
}
