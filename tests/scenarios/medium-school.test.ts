import {
	type ScheduleContext,
	createActivity,
	createAvailabilityRule,
	createCalendar,
	createClass,
	createClassGroup,
	createClassroom,
	createDefaultRegistry,
	createInstitution,
	createScheduleProject,
	createTeacher,
	createTimeSlot,
} from "@orar/domain"
import { generate, prepareProblem } from "@orar/solver"
import { describe, expect, it } from "vitest"

describe("Scenario: Medium school (8 teachers, 4 classes, 6 rooms, availability constraints)", () => {
	function build() {
		const inst = createInstitution({ name: "Medium School", type: "school" })
		const cal = createCalendar({
			name: "Default",
			activeDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
			periodsPerDay: 8,
		})
		const project = createScheduleProject({ name: "Medium", calendar: cal, institution: inst })

		const subjects = ["Math", "English", "Science", "History", "Geography", "PE", "Art", "Music"]
		const teachers = subjects.map((s, i) =>
			createTeacher({ name: `${s} Teacher`, shortName: `T${i + 1}` }),
		)
		project.teachers.push(...teachers)

		const classNames = ["6A", "6B", "7A", "7B"]
		const classes = classNames.map((n) => createClass({ name: `Grade ${n}`, shortName: n }))
		project.classes.push(...classes)

		const groups = classes.map((c) =>
			createClassGroup({ classId: c.id, name: `${c.shortName} All`, shortName: c.shortName }),
		)
		project.classGroups.push(...groups)

		const rooms = Array.from({ length: 6 }, (_, i) =>
			createClassroom({ name: `Room ${i + 1}`, shortName: `R${i + 1}` }),
		)
		project.classrooms.push(...rooms)

		// Each class gets 4h math, 3h english, 3h science, 2h each for others = 22h total
		for (const group of groups) {
			project.activities.push(
				createActivity({
					name: `Math ${group.shortName}`,
					subjectName: "Math",
					teacherIds: [teachers[0]!.id],
					classGroupIds: [group.id],
					totalPerWeek: 4,
				}),
				createActivity({
					name: `English ${group.shortName}`,
					subjectName: "English",
					teacherIds: [teachers[1]!.id],
					classGroupIds: [group.id],
					totalPerWeek: 3,
				}),
				createActivity({
					name: `Science ${group.shortName}`,
					subjectName: "Science",
					teacherIds: [teachers[2]!.id],
					classGroupIds: [group.id],
					totalPerWeek: 3,
				}),
				createActivity({
					name: `History ${group.shortName}`,
					subjectName: "History",
					teacherIds: [teachers[3]!.id],
					classGroupIds: [group.id],
					totalPerWeek: 2,
				}),
				createActivity({
					name: `Geography ${group.shortName}`,
					subjectName: "Geography",
					teacherIds: [teachers[4]!.id],
					classGroupIds: [group.id],
					totalPerWeek: 2,
				}),
				createActivity({
					name: `PE ${group.shortName}`,
					subjectName: "PE",
					teacherIds: [teachers[5]!.id],
					classGroupIds: [group.id],
					totalPerWeek: 2,
				}),
				createActivity({
					name: `Art ${group.shortName}`,
					subjectName: "Art",
					teacherIds: [teachers[6]!.id],
					classGroupIds: [group.id],
					totalPerWeek: 1,
				}),
				createActivity({
					name: `Music ${group.shortName}`,
					subjectName: "Music",
					teacherIds: [teachers[7]!.id],
					classGroupIds: [group.id],
					totalPerWeek: 1,
				}),
			)
		}

		// Add availability constraints
		project.availabilityRules.push(
			createAvailabilityRule({
				targetType: "teacher",
				targetId: teachers[0]!.id,
				type: "unavailable",
				timeSlots: [createTimeSlot("friday", 6), createTimeSlot("friday", 7)],
			}),
			createAvailabilityRule({
				targetType: "teacher",
				targetId: teachers[5]!.id,
				type: "unavailable",
				timeSlots: [createTimeSlot("monday", 0), createTimeSlot("monday", 1)],
			}),
		)

		return project
	}

	it("places all activities (72 slots)", () => {
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
		expect(result.totalCount).toBe(72)
		expect(result.placedCount).toBe(result.totalCount)
	})

	it("respects teacher availability constraints", () => {
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

	it("completes generation within 1 second", () => {
		const project = build()
		const problem = prepareProblem(
			project.calendar,
			project.activities,
			project.teachers,
			project.classGroups,
			project.classrooms,
			project.availabilityRules,
		)

		const start = performance.now()
		generate(problem)
		const elapsed = performance.now() - start
		expect(elapsed).toBeLessThan(1000)
	})
})
