import {
	type ScheduleContext,
	createActivity,
	createCalendar,
	createClass,
	createClassGroup,
	createClassroom,
	createDefaultRegistry,
	createInstitution,
	createScheduleProject,
	createTeacher,
} from "@orar/domain"
import { generate, prepareProblem } from "@orar/solver"
import { describe, expect, it } from "vitest"

describe("Scenario: Small school (3 teachers, 2 classes, 2 rooms)", () => {
	function build() {
		const inst = createInstitution({ name: "Small School", type: "school" })
		const cal = createCalendar({
			name: "Default",
			activeDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
			periodsPerDay: 7,
		})
		const project = createScheduleProject({ name: "Small", calendar: cal, institution: inst })

		const teachers = [
			createTeacher({ name: "Math Teacher", shortName: "MT" }),
			createTeacher({ name: "English Teacher", shortName: "ET" }),
			createTeacher({ name: "Science Teacher", shortName: "ST" }),
		]
		project.teachers.push(...teachers)

		const classes = [
			createClass({ name: "Grade 5A", shortName: "5A" }),
			createClass({ name: "Grade 5B", shortName: "5B" }),
		]
		project.classes.push(...classes)

		const groups = classes.map((c) =>
			createClassGroup({ classId: c.id, name: `${c.shortName} All`, shortName: c.shortName }),
		)
		project.classGroups.push(...groups)

		const rooms = [
			createClassroom({ name: "Room 1", shortName: "R1" }),
			createClassroom({ name: "Room 2", shortName: "R2" }),
		]
		project.classrooms.push(...rooms)

		for (const group of groups) {
			project.activities.push(
				createActivity({
					name: `Math ${group.shortName}`,
					subjectName: "Math",
					teacherIds: [teachers[0]!.id],
					classGroupIds: [group.id],
					totalPerWeek: 5,
				}),
				createActivity({
					name: `English ${group.shortName}`,
					subjectName: "English",
					teacherIds: [teachers[1]!.id],
					classGroupIds: [group.id],
					totalPerWeek: 4,
				}),
				createActivity({
					name: `Science ${group.shortName}`,
					subjectName: "Science",
					teacherIds: [teachers[2]!.id],
					classGroupIds: [group.id],
					totalPerWeek: 3,
				}),
			)
		}

		return project
	}

	it("places all 24 activity slots", () => {
		const project = build()
		const problem = prepareProblem(
			project.calendar,
			project.activities,
			project.teachers,
			project.classGroups,
			project.classrooms,
			project.availabilityRules,
		)

		const result = generate(problem)
		expect(result.placedCount).toBe(result.totalCount)
	})

	it("produces no hard constraint violations", () => {
		const project = build()
		const problem = prepareProblem(
			project.calendar,
			project.activities,
			project.teachers,
			project.classGroups,
			project.classrooms,
			project.availabilityRules,
		)

		const result = generate(problem)
		const context: ScheduleContext = {
			calendar: project.calendar,
			classes: project.classes,
			classGroups: project.classGroups,
			teachers: project.teachers,
			classrooms: project.classrooms,
			activities: project.activities,
			availabilityRules: project.availabilityRules,
			assignments: result.assignments,
		}

		const registry = createDefaultRegistry()
		const violations = registry.evaluateHard(context)
		expect(violations).toHaveLength(0)
	})
})
