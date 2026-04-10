import {
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

		const json = exportProjectToJson(project)
		const restored = importProjectFromJson(json)
		expect(restored.name).toBe(project.name)
		expect(restored.id).toBe(project.id)
		expect(restored.calendar.periodsPerDay).toBe(7)
	})

	it("preserves teachers in round-trip", () => {
		const project = createScheduleProject({
			name: "Test",
			calendar: cal,
			institution: inst,
		})
		const teacher = createTeacher({ name: "John", shortName: "JD" })
		project.teachers.push(teacher)

		const json = exportProjectToJson(project)
		const restored = importProjectFromJson(json)
		expect(restored.teachers).toHaveLength(1)
		expect(restored.teachers[0]!.name).toBe("John")
	})

	it("produces valid JSON", () => {
		const project = createScheduleProject({
			name: "Test",
			calendar: cal,
			institution: inst,
		})
		const json = exportProjectToJson(project)
		expect(() => JSON.parse(json)).not.toThrow()
	})
})
