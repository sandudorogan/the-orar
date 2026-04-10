import type { ScheduleProject } from "@orar/domain"

export function exportProjectToJson(project: ScheduleProject): string {
	return JSON.stringify(project, null, 2)
}

export function importProjectFromJson(json: string): ScheduleProject {
	return JSON.parse(json) as ScheduleProject
}

export function downloadJson(content: string, filename: string): void {
	const blob = new Blob([content], { type: "application/json" })
	const url = URL.createObjectURL(blob)
	const a = document.createElement("a")
	a.href = url
	a.download = filename
	a.click()
	URL.revokeObjectURL(url)
}
