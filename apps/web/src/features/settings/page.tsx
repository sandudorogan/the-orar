import { useLocale, useMessages } from "@/app/i18n/use-i18n.ts"
import { useProject } from "@/app/project-context.tsx"
import {
	downloadJson,
	exportProjectToJson,
	importProjectFromJson,
} from "@/shared/storage/backup.ts"
import type { Locale } from "@orar/locales"
import { getLocaleConfig, supportedLocales } from "@orar/locales"
import {
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@orar/ui"
import { Download, Upload } from "lucide-react"
import { useRef } from "react"

export function SettingsPage() {
	const messages = useMessages()
	const { locale, setLocale } = useLocale()
	const { project, replaceProject } = useProject()
	const fileInputRef = useRef<HTMLInputElement>(null)

	function handleExport() {
		const json = exportProjectToJson(project)
		downloadJson(json, `${project.name.replace(/\s+/g, "-").toLowerCase()}.json`)
	}

	function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0]
		if (!file) return
		const reader = new FileReader()
		reader.onload = (ev) => {
			const text = ev.target?.result as string
			const imported = importProjectFromJson(text)
			replaceProject(imported)
		}
		reader.readAsText(file)
		e.target.value = ""
	}

	return (
		<div className="space-y-6">
			<h1 className="text-2xl font-bold text-text-primary">{messages.nav.settings}</h1>

			<Card>
				<CardHeader>
					<CardTitle>{messages.settings.general}</CardTitle>
				</CardHeader>
				<CardContent className="space-y-6">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm font-medium text-text-primary">{messages.settings.language}</p>
						</div>
						<Select value={locale} onValueChange={(v) => setLocale(v as Locale)}>
							<SelectTrigger className="w-48">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{supportedLocales.map((loc) => (
									<SelectItem key={loc} value={loc}>
										{getLocaleConfig(loc).nativeName}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>{messages.settings.importExport}</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex gap-3">
						<Button variant="outline" onClick={handleExport}>
							<Download className="h-4 w-4" />
							{messages.settings.exportProject}
						</Button>
						<Button variant="outline" onClick={() => fileInputRef.current?.click()}>
							<Upload className="h-4 w-4" />
							{messages.settings.importProject}
						</Button>
						<input
							ref={fileInputRef}
							type="file"
							accept=".json"
							onChange={handleImport}
							className="hidden"
						/>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
