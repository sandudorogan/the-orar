import { describe, expect, it } from "vitest"
import {
	ORAR_CSV_AI_PROMPT,
	ORAR_CSV_COLUMNS,
	ORAR_CSV_HEADER,
	buildProjectFromOrarCsv,
	exportProjectToOrarCsv,
	parseOrarCsv,
} from "./orar-csv.ts"

type CsvCell = Partial<Record<(typeof ORAR_CSV_COLUMNS)[number], string | number | boolean>>

function csv(...rows: CsvCell[]) {
	return [
		ORAR_CSV_HEADER,
		...rows.map((row) => ORAR_CSV_COLUMNS.map((column) => String(row[column] ?? "")).join(",")),
	].join("\n")
}

const validCsv = csv(
	{ record_type: "project", key: "orar_demo", name: "Demo School", kind: "school" },
	{
		record_type: "calendar",
		key: "main",
		name: "Main Calendar",
		active_days: "monday|tuesday",
		periods_per_day: 4,
		period_duration_minutes: 50,
		start_time: "08:00",
	},
	{
		record_type: "class",
		key: "class_9a",
		name: "Class 9A",
		short_name: "9A",
		year: 9,
		student_count: 28,
	},
	{
		record_type: "group",
		key: "group_9a_all",
		name: "9A All",
		short_name: "9A",
		parent_key: "class_9a",
		student_count: 28,
	},
	{
		record_type: "teacher",
		key: "teacher_ionescu",
		name: "Ana Ionescu",
		short_name: "AI",
		email: "ana@example.com",
		max_hours_per_day: 5,
		max_hours_per_week: 24,
	},
	{
		record_type: "classroom",
		key: "room_lab1",
		name: "Lab 1",
		short_name: "L1",
		capacity: 30,
		building: "Main",
		tags: "lab|science",
	},
	{
		record_type: "activity",
		key: "activity_math_9a",
		name: "Math 9A",
		kind: "math",
		subject: "Mathematics",
		teacher_keys: "teacher_ionescu",
		class_group_keys: "group_9a_all",
		duration: 1,
		total_per_week: 2,
		preferred_room_keys: "room_lab1",
		room_tags: "lab",
	},
	{
		record_type: "availability",
		key: "teacher_ionescu_monday0",
		availability_target_type: "teacher",
		availability_target_key: "teacher_ionescu",
		availability_type: "unavailable",
		time_slots: "monday:0",
	},
	{
		record_type: "assignment",
		assignment_activity_key: "activity_math_9a",
		assignment_day: "monday",
		assignment_period: 1,
		assignment_room_key: "room_lab1",
		assignment_locked: true,
		assignment_duration: 1,
	},
	{
		record_type: "solver",
		key: "default",
		solver_seed: 42,
		solver_max_attempts: 3,
		solver_timeout_ms: 60_000,
	},
)

describe("Orar CSV", () => {
	it("parses typed rows and builds a project with assignments", () => {
		const rows = parseOrarCsv(validCsv)
		expect(rows).toHaveLength(10)

		const imported = buildProjectFromOrarCsv(validCsv)

		expect(imported.project.name).toBe("Demo School")
		expect(imported.project.institution.type).toBe("school")
		expect(imported.project.calendar.activeDays).toEqual(["monday", "tuesday"])
		expect(imported.project.classes).toHaveLength(1)
		expect(imported.project.classGroups[0]?.classId).toBe(imported.project.classes[0]?.id)
		expect(imported.project.teachers[0]?.email).toBe("ana@example.com")
		expect(imported.project.classrooms[0]?.tags).toEqual(["lab", "science"])
		expect(imported.project.activities[0]?.teacherIds).toEqual([imported.project.teachers[0]?.id])
		expect(imported.project.availabilityRules[0]?.timeSlots).toEqual([{ day: "monday", period: 0 }])
		expect(imported.assignments).toEqual([
			{
				activityId: imported.project.activities[0]?.id,
				timeSlot: { day: "monday", period: 1 },
				roomId: imported.project.classrooms[0]?.id,
				locked: true,
				duration: 1,
			},
		])
		expect(imported.summary).toMatchObject({
			classes: 1,
			classGroups: 1,
			teachers: 1,
			classrooms: 1,
			activities: 1,
			availabilityRules: 1,
			assignments: 1,
		})
	})

	it("exports and imports an equivalent project and exact assignments", () => {
		const imported = buildProjectFromOrarCsv(validCsv)
		const exported = exportProjectToOrarCsv(imported.project, imported.assignments, {
			seed: 42,
			maxAttempts: 3,
			timeoutMs: 60_000,
		})
		const roundTrip = buildProjectFromOrarCsv(exported)

		expect(roundTrip.project.classes).toEqual(imported.project.classes)
		expect(roundTrip.project.classGroups).toEqual(imported.project.classGroups)
		expect(roundTrip.project.teachers).toEqual(imported.project.teachers)
		expect(roundTrip.project.classrooms).toEqual(imported.project.classrooms)
		expect(roundTrip.project.activities).toEqual(imported.project.activities)
		expect(roundTrip.project.availabilityRules).toEqual(imported.project.availabilityRules)
		expect(roundTrip.assignments).toEqual(imported.assignments)
	})

	it("reports row and column errors for invalid CSV", () => {
		const csvText = csv(
			{ record_type: "project", key: "orar_demo", name: "Demo School", kind: "school" },
			{
				record_type: "calendar",
				key: "main",
				name: "Main Calendar",
				active_days: "monday",
				periods_per_day: "abc",
				period_duration_minutes: 50,
				start_time: "08:00",
			},
			{
				record_type: "teacher",
				key: "teacher_1",
				name: "Ana Ionescu",
				short_name: "AI",
				email: "not-an-email",
			},
			{
				record_type: "activity",
				key: "activity_1",
				name: "Math",
				kind: "math",
				subject: "Mathematics",
				teacher_keys: "missing_teacher",
				class_group_keys: "missing_group",
				duration: 1,
				total_per_week: 1,
			},
		)

		expect(() => buildProjectFromOrarCsv(csvText)).toThrowError(/row 3, column periods_per_day/)
		expect(() => buildProjectFromOrarCsv(csvText)).toThrowError(/row 4, column email/)
		expect(() => buildProjectFromOrarCsv(csvText)).toThrowError(/row 5, column teacher_keys/)
	})

	it("rejects missing headers and duplicate keys with actionable errors", () => {
		expect(() => parseOrarCsv("record_type,key,name\nproject,p,Demo")).toThrowError(
			/missing header columns/i,
		)

		const csvText = csv(
			{ record_type: "project", key: "orar_demo", name: "Demo School", kind: "school" },
			{
				record_type: "calendar",
				key: "main",
				name: "Main Calendar",
				active_days: "monday",
				periods_per_day: 4,
				period_duration_minutes: 50,
				start_time: "08:00",
			},
			{ record_type: "class", key: "class_9a", name: "Class 9A", short_name: "9A" },
			{ record_type: "class", key: "class_9a", name: "Class 9A Copy", short_name: "9A2" },
		)

		expect(() => buildProjectFromOrarCsv(csvText)).toThrowError(/duplicate key "class_9a"/i)
	})

	it("keeps the AI conversion prompt tied to the exact CSV header", () => {
		expect(ORAR_CSV_AI_PROMPT).toContain(ORAR_CSV_HEADER)
		expect(ORAR_CSV_AI_PROMPT).toContain("Return only CSV")
		expect(ORAR_CSV_AI_PROMPT).toContain("Never invent schedule assignments")
		expect(ORAR_CSV_AI_PROMPT).toContain("Random Excel files")
		expect(ORAR_CSV_AI_PROMPT).toContain("Record type schema")
		expect(ORAR_CSV_AI_PROMPT).toContain("class_group_keys")
		expect(ORAR_CSV_AI_PROMPT).toContain("availability_target_type")
		expect(ORAR_CSV_AI_PROMPT).toContain("assignment rows only if")
		expect(ORAR_CSV_AI_PROMPT).toContain("Do not use display names as references")
	})

	it("round-trips is_whole_class through export and import", () => {
		const source = csv(
			{ record_type: "project", key: "p", name: "Demo", kind: "school" },
			{
				record_type: "calendar",
				key: "main",
				active_days: "monday",
				periods_per_day: 4,
				period_duration_minutes: 50,
				start_time: "08:00",
			},
			{ record_type: "class", key: "class_9a", name: "Class 9A", short_name: "9A" },
			{
				record_type: "group",
				key: "group_9a_all",
				name: "9A All",
				short_name: "ALL",
				parent_key: "class_9a",
				is_whole_class: true,
			},
			{
				record_type: "group",
				key: "group_9a_sci",
				name: "9A Sci",
				short_name: "SCI",
				parent_key: "class_9a",
			},
		)

		const first = buildProjectFromOrarCsv(source)
		expect(first.project.classGroups.filter((g) => g.isWholeClass)).toHaveLength(1)

		const exported = exportProjectToOrarCsv(first.project, [])
		const second = buildProjectFromOrarCsv(exported)
		expect(second.project.classGroups.filter((g) => g.isWholeClass)).toHaveLength(1)
	})

	it("marks a class's only group as whole-class on import", () => {
		const source = csv(
			{ record_type: "project", key: "p", name: "Demo", kind: "school" },
			{
				record_type: "calendar",
				key: "main",
				active_days: "monday",
				periods_per_day: 4,
				period_duration_minutes: 50,
				start_time: "08:00",
			},
			{ record_type: "class", key: "class_9a", name: "Class 9A", short_name: "9A" },
			{
				record_type: "group",
				key: "group_9a_all",
				name: "9A All",
				short_name: "ALL",
				parent_key: "class_9a",
			},
		)

		const imported = buildProjectFromOrarCsv(source)
		expect(imported.project.classGroups[0]!.isWholeClass).toBe(true)
	})

	it("still imports CSV without the is_whole_class column", () => {
		const legacyColumns = ORAR_CSV_COLUMNS.filter((c) => c !== "is_whole_class")
		const legacyRows: CsvCell[] = [
			{ record_type: "project", key: "p", name: "Demo", kind: "school" },
			{
				record_type: "calendar",
				key: "main",
				active_days: "monday",
				periods_per_day: 4,
				period_duration_minutes: 50,
				start_time: "08:00",
			},
			{ record_type: "class", key: "class_9a", name: "Class 9A", short_name: "9A" },
			{
				record_type: "group",
				key: "group_9a_all",
				name: "9A All",
				short_name: "ALL",
				parent_key: "class_9a",
			},
		]
		const legacyCsv = [
			legacyColumns.join(","),
			...legacyRows.map((row) => legacyColumns.map((c) => String(row[c] ?? "")).join(",")),
		].join("\n")

		expect(() => buildProjectFromOrarCsv(legacyCsv)).not.toThrow()
	})
})
