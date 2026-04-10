import {
	createActivity,
	createAssignment,
	createCalendar,
	createClass,
	createClassGroup,
	createClassroom,
	createTeacher,
	createTimeSlot,
} from "@orar/domain"
import { describe, expect, it } from "vitest"
import {
	buildClassGroupExportModel,
	buildClassroomExportModel,
	buildTeacherExportModel,
} from "./schedule-to-export-model.ts"

describe("schedule-to-export-model", () => {
	const cal = createCalendar({
		name: "Default",
		activeDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
		periodsPerDay: 7,
	})

	const t1 = createTeacher({ name: "Math Teacher", shortName: "MT" })
	const t2 = createTeacher({ name: "Physics Teacher", shortName: "PT" })
	const cls = createClass({ name: "9A", shortName: "9A" })
	const g1 = createClassGroup({ classId: cls.id, name: "9A All", shortName: "9A" })
	const r1 = createClassroom({ name: "Room 101", shortName: "101" })

	const a1 = createActivity({
		name: "Math 9A",
		subjectName: "Mathematics",
		teacherIds: [t1.id],
		classGroupIds: [g1.id],
	})
	const a2 = createActivity({
		name: "Physics 9A",
		subjectName: "Physics",
		teacherIds: [t2.id],
		classGroupIds: [g1.id],
	})

	const assignments = [
		createAssignment({ activityId: a1.id, timeSlot: createTimeSlot("monday", 0), roomId: r1.id }),
		createAssignment({ activityId: a2.id, timeSlot: createTimeSlot("monday", 1), roomId: r1.id }),
	]

	it("builds teacher export model", () => {
		const model = buildTeacherExportModel(t1, cal, assignments, [a1, a2], [g1], [r1])
		expect(model.title).toBe("Math Teacher")
		expect(model.days).toHaveLength(5)
		expect(model.rows).toHaveLength(7)
		const firstCell = model.rows[0]!.cells[0]!
		expect(firstCell.subjectName).toBe("Mathematics")
	})

	it("builds class group export model", () => {
		const model = buildClassGroupExportModel(g1, cal, assignments, [a1, a2], [t1, t2], [r1])
		expect(model.title).toBe("9A All")
		expect(model.rows[0]!.cells[0]!.teacherNames).toContain("MT")
	})

	it("builds classroom export model", () => {
		const model = buildClassroomExportModel(r1, cal, assignments, [a1, a2], [t1, t2], [g1])
		expect(model.title).toBe("Room 101")
		expect(model.rows[0]!.cells[0]!.activityName).toBe("Math 9A")
	})

	it("handles empty cells for unassigned slots", () => {
		const model = buildTeacherExportModel(t1, cal, assignments, [a1, a2], [g1], [r1])
		const lastRow = model.rows[6]!
		for (const cell of lastRow.cells) {
			expect(cell.activityName).toBe("")
		}
	})
})
