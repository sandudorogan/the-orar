import {
	type Assignment,
	AssignmentSchema,
	type ScheduleProject,
	ScheduleProjectSchema,
} from "@orar/domain"
import { z } from "zod"

const BackupSchema = z.object({
	schemaVersion: z.literal(2),
	project: ScheduleProjectSchema,
	assignments: z.array(AssignmentSchema),
})

export interface ProjectBackup {
	project: ScheduleProject
	assignments: Assignment[]
}

export function exportProjectToJson(project: ScheduleProject, assignments: Assignment[]): string {
	return JSON.stringify({ schemaVersion: 2, project, assignments }, null, 2)
}

export function importProjectFromJson(json: string): ProjectBackup {
	const parsed = JSON.parse(json)

	if (parsed && typeof parsed === "object" && "schemaVersion" in parsed) {
		const result = BackupSchema.safeParse(parsed)
		if (!result.success) {
			throw new Error(`Invalid project file: ${result.error.issues[0]?.message ?? "unknown error"}`)
		}
		return { project: result.data.project, assignments: result.data.assignments }
	}

	const legacy = ScheduleProjectSchema.safeParse(parsed)
	if (!legacy.success) {
		throw new Error(`Invalid project file: ${legacy.error.issues[0]?.message ?? "unknown error"}`)
	}
	return { project: legacy.data, assignments: [] }
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
