import { useMessages } from "@/app/i18n/use-i18n.ts"
import { Card, CardContent, CardHeader, CardTitle } from "@orar/ui"
import { CalendarDays } from "lucide-react"

export function TimetablesPage() {
	const messages = useMessages()

	return (
		<div className="space-y-6">
			<h1 className="text-2xl font-bold text-text-primary">{messages.nav.timetables}</h1>
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<CalendarDays className="h-5 w-5 text-text-secondary" />
						{messages.nav.timetables}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-text-muted">{messages.common.comingSoon}</p>
				</CardContent>
			</Card>
		</div>
	)
}
