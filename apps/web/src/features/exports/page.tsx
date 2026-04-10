import { useMessages } from "@/app/i18n/use-i18n.ts"
import { Card, CardContent, CardHeader, CardTitle } from "@orar/ui"
import { FileDown } from "lucide-react"

export function ExportsPage() {
	const messages = useMessages()

	return (
		<div className="space-y-6">
			<h1 className="text-2xl font-bold text-text-primary">{messages.nav.exports}</h1>
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<FileDown className="h-5 w-5 text-text-secondary" />
						{messages.nav.exports}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-text-muted">{messages.common.comingSoon}</p>
				</CardContent>
			</Card>
		</div>
	)
}
