import { describe, expect, it } from "vitest"
import { createActivity } from "../entities/activity.ts"
import { createCalendar } from "../entities/calendar.ts"
import { createClass } from "../entities/class.ts"
import { createClassGroup } from "../entities/class-group.ts"
import { createInstitution } from "../entities/institution.ts"
import { createScheduleProject } from "../entities/schedule-project.ts"
import { createTeacher } from "../entities/teacher.ts"
import { validateProject } from "./project-validator.ts"

describe("validateProject", () => {
	const inst = createInstitution({ name: "School", type: "school" })
	const cal = createCalendar({
		name: "Default",
		activeDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
		periodsPerDay: 7,
	})

	it("warns when no activities defined", () => {
		const project = createScheduleProject({
			name: "Empty",
			calendar: cal,
			institution: inst,
		})

		const issues = validateProject(project)
		const warnings = issues.filter((i) => i.severity === "warning")
		expect(warnings.length).toBeGreaterThan(0)
	})

	it("errors on activity referencing non-existent teacher", () => {
		const project = createScheduleProject({
			name: "Bad Ref",
			calendar: cal,
			institution: inst,
		})

		const cls = createClass({ name: "9A", shortName: "9A" })
		const group = createClassGroup({ classId: cls.id, name: "All", shortName: "All" })
		project.classes.push(cls)
		project.classGroups.push(group)

		const activity = createActivity({
			name: "Math",
			subjectName: "Math",
			teacherIds: [crypto.randomUUID()],
			classGroupIds: [group.id],
		})
		project.activities.push(activity)

		const issues = validateProject(project)
		const errors = issues.filter((i) => i.severity === "error")
		expect(errors.length).toBeGreaterThan(0)
	})

	it("passes for a well-formed project", () => {
		const project = createScheduleProject({
			name: "Good",
			calendar: cal,
			institution: inst,
		})

		const cls = createClass({ name: "9A", shortName: "9A" })
		const group = createClassGroup({ classId: cls.id, name: "All", shortName: "All" })
		const teacher = createTeacher({ name: "T", shortName: "T" })

		project.classes.push(cls)
		project.classGroups.push(group)
		project.teachers.push(teacher)

		const activity = createActivity({
			name: "Math",
			subjectName: "Math",
			teacherIds: [teacher.id],
			classGroupIds: [group.id],
		})
		project.activities.push(activity)

		const issues = validateProject(project)
		const errors = issues.filter((i) => i.severity === "error")
		expect(errors).toHaveLength(0)
	})
})
