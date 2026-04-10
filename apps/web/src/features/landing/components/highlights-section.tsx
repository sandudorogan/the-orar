import { useMessages } from "@/app/i18n/use-i18n.ts"
import { Eye, FolderSync, Globe, HardDrive, Monitor, WifiOff } from "lucide-react"
import type { ReactNode } from "react"

interface Highlight {
	icon: ReactNode
	titleKey:
		| "highlightOffline"
		| "highlightLocalFirst"
		| "highlightBilingual"
		| "highlightBrowserOnly"
		| "highlightBackup"
		| "highlightTransparent"
	descKey:
		| "highlightOfflineDesc"
		| "highlightLocalFirstDesc"
		| "highlightBilingualDesc"
		| "highlightBrowserOnlyDesc"
		| "highlightBackupDesc"
		| "highlightTransparentDesc"
}

const highlights: Highlight[] = [
	{
		icon: <WifiOff className="h-8 w-8 text-landing-accent-muted" />,
		titleKey: "highlightOffline",
		descKey: "highlightOfflineDesc",
	},
	{
		icon: <HardDrive className="h-8 w-8 text-landing-accent-muted" />,
		titleKey: "highlightLocalFirst",
		descKey: "highlightLocalFirstDesc",
	},
	{
		icon: <Globe className="h-8 w-8 text-landing-accent-muted" />,
		titleKey: "highlightBilingual",
		descKey: "highlightBilingualDesc",
	},
	{
		icon: <Monitor className="h-8 w-8 text-landing-accent-muted" />,
		titleKey: "highlightBrowserOnly",
		descKey: "highlightBrowserOnlyDesc",
	},
	{
		icon: <FolderSync className="h-8 w-8 text-landing-accent-muted" />,
		titleKey: "highlightBackup",
		descKey: "highlightBackupDesc",
	},
	{
		icon: <Eye className="h-8 w-8 text-landing-accent-muted" />,
		titleKey: "highlightTransparent",
		descKey: "highlightTransparentDesc",
	},
]

export function HighlightsSection() {
	const messages = useMessages()

	return (
		<section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
			<div className="text-center">
				<h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-text-primary">
					{messages.landing.highlightsTitle}
				</h2>
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
				{highlights.map((h) => (
					<div key={h.titleKey}>
						{h.icon}
						<h3 className="font-semibold text-text-primary mt-3">{messages.landing[h.titleKey]}</h3>
						<p className="text-sm text-text-secondary mt-1">{messages.landing[h.descKey]}</p>
					</div>
				))}
			</div>
		</section>
	)
}
