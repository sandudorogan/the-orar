import { type ScheduleProject, ScheduleProjectSchema } from "@orar/domain"

export function exportProjectToJson(project: ScheduleProject): string {
	return JSON.stringify(project, null, 2)
}

export function importProjectFromJson(json: string): ScheduleProject {
	const parsed = JSON.parse(json)
	const result = ScheduleProjectSchema.safeParse(parsed)
	if (!result.success) {
		throw new Error(`Invalid project file: ${result.error.issues[0]?.message ?? "unknown error"}`)
	}
	return result.data
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
