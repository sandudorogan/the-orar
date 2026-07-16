import {
	type Assignment,
	createCalendar,
	createInstitution,
	createScheduleProject,
	createTeacher,
} from "@orar/domain"
import { describe, expect, it } from "vitest"
import { exportProjectToJson, importProjectFromJson } from "./backup.ts"

describe("backup", () => {
	const inst = createInstitution({ name: "School", type: "school" })
	const cal = createCalendar({
		name: "Default",
		activeDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
		periodsPerDay: 7,
	})

	it("round-trips a project through JSON", () => {
		const project = createScheduleProject({
			name: "Test Project",
			calendar: cal,
			institution: inst,
		})

		const json = exportProjectToJson(project, [])
		const restored = importProjectFromJson(json)
		expect(restored.project.name).toBe(project.name)
		expect(restored.project.id).toBe(project.id)
		expect(restored.project.calendar.periodsPerDay).toBe(7)
	})

	it("preserves teachers in round-trip", () => {
		const project = createScheduleProject({
			name: "Test",
			calendar: cal,
			institution: inst,
		})
		const teacher = createTeacher({ name: "John", shortName: "JD" })
		project.teachers.push(teacher)

		const json = exportProjectToJson(project, [])
		const restored = importProjectFromJson(json)
		expect(restored.project.teachers).toHaveLength(1)
		expect(restored.project.teachers[0]!.name).toBe("John")
	})

	it("produces valid JSON", () => {
		const project = createScheduleProject({
			name: "Test",
			calendar: cal,
			institution: inst,
		})
		const json = exportProjectToJson(project, [])
		expect(() => JSON.parse(json)).not.toThrow()
	})

	it("round-trips assignments through export and import", () => {
		const project = createScheduleProject({ name: "Test", calendar: cal, institution: inst })
		const assignments: Assignment[] = [
			{
				activityId: crypto.randomUUID(),
				timeSlot: { day: "monday", period: 0 },
				locked: true,
				duration: 1,
			},
		]

		const json = exportProjectToJson(project, assignments)
		const imported = importProjectFromJson(json)

		expect(imported.project.id).toBe(project.id)
		expect(imported.assignments).toEqual(assignments)
	})

	it("imports a legacy raw-project file with empty assignments", () => {
		const project = createScheduleProject({ name: "Test", calendar: cal, institution: inst })
		const imported = importProjectFromJson(JSON.stringify(project))

		expect(imported.project.id).toBe(project.id)
		expect(imported.assignments).toEqual([])
	})
})
