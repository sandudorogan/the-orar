import type { Assignment } from "@orar/domain"
import {
	createActivity,
	createAvailabilityRule,
	createCalendar,
	createClass,
	createClassGroup,
	createClassroom,
	createInstitution,
	createScheduleProject,
	createTeacher,
	createTimeSlot,
} from "@orar/domain"
import { describe, expect, it } from "vitest"
import { generate } from "./heuristics/generate.ts"
import { prepareProblem } from "./preprocessing/prepare.ts"
import { computeFitness } from "./scoring/fitness.ts"

function buildSmallSchool() {
	const inst = createInstitution({ name: "Test School", type: "school" })
	const cal = createCalendar({
		name: "Default",
		activeDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
		periodsPerDay: 7,
	})
	const project = createScheduleProject({ name: "Test", calendar: cal, institution: inst })

	const t1 = createTeacher({ name: "Math Teacher", shortName: "MT" })
	const t2 = createTeacher({ name: "Physics Teacher", shortName: "PT" })
	const t3 = createTeacher({ name: "English Teacher", shortName: "ET" })
	project.teachers.push(t1, t2, t3)

	const cls1 = createClass({ name: "9A", shortName: "9A" })
	const cls2 = createClass({ name: "9B", shortName: "9B" })
	project.classes.push(cls1, cls2)

	const g1 = createClassGroup({ classId: cls1.id, name: "9A All", shortName: "9A" })
	const g2 = createClassGroup({ classId: cls2.id, name: "9B All", shortName: "9B" })
	project.classGroups.push(g1, g2)

	const r1 = createClassroom({ name: "Room 101", shortName: "101" })
	const r2 = createClassroom({ name: "Room 102", shortName: "102" })
	project.classrooms.push(r1, r2)

	project.activities.push(
		createActivity({
			name: "Math 9A",
			subjectName: "Math",
			teacherIds: [t1.id],
			classGroupIds: [g1.id],
			totalPerWeek: 4,
		}),
		createActivity({
			name: "Math 9B",
			subjectName: "Math",
			teacherIds: [t1.id],
			classGroupIds: [g2.id],
			totalPerWeek: 4,
		}),
		createActivity({
			name: "Physics 9A",
			subjectName: "Physics",
			teacherIds: [t2.id],
			classGroupIds: [g1.id],
			totalPerWeek: 3,
		}),
		createActivity({
			name: "Physics 9B",
			subjectName: "Physics",
			teacherIds: [t2.id],
			classGroupIds: [g2.id],
			totalPerWeek: 3,
		}),
		createActivity({
			name: "English 9A",
			subjectName: "English",
			teacherIds: [t3.id],
			classGroupIds: [g1.id],
			totalPerWeek: 3,
		}),
		createActivity({
			name: "English 9B",
			subjectName: "English",
			teacherIds: [t3.id],
			classGroupIds: [g2.id],
			totalPerWeek: 3,
		}),
	)

	return project
}

describe("Preprocessing", () => {
	it("generates all time slots", () => {
		const project = buildSmallSchool()
		const problem = prepareProblem(
			project.calendar,
			project.activities,
			project.teachers,
			project.classGroups,
			project.classrooms,
			project.availabilityRules,
		)
		expect(problem.allSlots).toHaveLength(35) // 5 days x 7 periods
	})

	it("sorts activities by available slots (most constrained first)", () => {
		const project = buildSmallSchool()

		project.availabilityRules.push(
			createAvailabilityRule({
				targetType: "teacher",
				targetId: project.teachers[0]!.id,
				type: "unavailable",
				timeSlots: [
					createTimeSlot("monday", 0),
					createTimeSlot("monday", 1),
					createTimeSlot("monday", 2),
					createTimeSlot("tuesday", 0),
					createTimeSlot("tuesday", 1),
				],
			}),
		)

		const problem = prepareProblem(
			project.calendar,
			project.activities,
			project.teachers,
			project.classGroups,
			project.classrooms,
			project.availabilityRules,
		)

		const mathTeacherActivities = problem.activities.filter((a) =>
			a.activity.teacherIds.includes(project.teachers[0]!.id),
		)

		for (const a of mathTeacherActivities) {
			expect(a.availableSlots.length).toBeLessThan(35)
		}
	})

	it("expands split activities into multiple parts", () => {
		const project = buildSmallSchool()
		project.activities.push(
			createActivity({
				name: "PE 9A",
				subjectName: "PE",
				teacherIds: [project.teachers[0]!.id],
				classGroupIds: [project.classGroups[0]!.id],
				totalPerWeek: 3,
				splitConfig: { isSplit: true, parts: [2, 1] },
			}),
		)

		const problem = prepareProblem(
			project.calendar,
			project.activities,
			project.teachers,
			project.classGroups,
			project.classrooms,
			project.availabilityRules,
		)

		const peActivities = problem.activities.filter((a) => a.activity.subjectName === "PE")
		expect(peActivities).toHaveLength(2)
		expect(peActivities.map((a) => a.duration).sort()).toEqual([1, 2])
	})

	it("excludes start slots whose span crosses an unavailable period", () => {
		const calendar = createCalendar({
			name: "Cal",
			activeDays: ["monday"],
			periodsPerDay: 4,
		})
		const teacher = createTeacher({ name: "T", shortName: "T" })
		const cls = createClass({ name: "9A", shortName: "9A" })
		const group = createClassGroup({ classId: cls.id, name: "All", shortName: "ALL" })
		const activity = createActivity({
			name: "Math",
			subjectName: "Math",
			teacherIds: [teacher.id],
			classGroupIds: [group.id],
			duration: 2,
			totalPerWeek: 1,
		})
		const rule = createAvailabilityRule({
			targetType: "teacher",
			targetId: teacher.id,
			type: "unavailable",
			timeSlots: [{ day: "monday", period: 1 }],
		})

		const problem = prepareProblem(calendar, [activity], [teacher], [group], [], [rule])

		expect(problem.activities[0]!.availableSlots.map((s) => s.period)).toEqual([2])
	})
})

describe("Generation", () => {
	it("places all activities in a simple school", () => {
		const project = buildSmallSchool()
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
		expect(result.assignments.length).toBe(result.totalCount)
		expect(result.fitness).toBeGreaterThan(0)
	})

	it("reports progress during generation", () => {
		const project = buildSmallSchool()
		const problem = prepareProblem(
			project.calendar,
			project.activities,
			project.teachers,
			project.classGroups,
			project.classrooms,
			project.availabilityRules,
		)

		const progressReports: number[] = []
		generate(problem, (placed) => progressReports.push(placed))
		expect(progressReports.length).toBeGreaterThan(0)
	})

	it("can be cancelled mid-generation", () => {
		const project = buildSmallSchool()
		const problem = prepareProblem(
			project.calendar,
			project.activities,
			project.teachers,
			project.classGroups,
			project.classrooms,
			project.availabilityRules,
		)

		let calls = 0
		const result = generate(problem, undefined, () => {
			calls++
			return calls > 5
		})
		expect(result.placedCount).toBeLessThan(result.totalCount)
	})

	it("produces identical assignments for the same seed", () => {
		const project = buildSmallSchool()
		const problem = prepareProblem(
			project.calendar,
			project.activities,
			project.teachers,
			project.classGroups,
			project.classrooms,
			project.availabilityRules,
		)

		const first = generate(problem, undefined, undefined, { seed: 1234 })
		const second = generate(problem, undefined, undefined, { seed: 1234 })

		expect(second.assignments).toEqual(first.assignments)
	})

	it("still supports unseeded generation", () => {
		const project = buildSmallSchool()
		const problem = prepareProblem(
			project.calendar,
			project.activities,
			project.teachers,
			project.classGroups,
			project.classrooms,
			project.availabilityRules,
		)

		const result = generate(problem, undefined, undefined, {})

		expect(result.placedCount).toBe(result.totalCount)
		expect(result.assignments.length).toBe(result.totalCount)
	})

	it("reports activity ids that could not be placed", () => {
		const calendar = createCalendar({
			name: "Cal",
			activeDays: ["monday"],
			periodsPerDay: 1,
		})
		const teacher = createTeacher({ name: "T", shortName: "T" })
		const cls = createClass({ name: "9A", shortName: "9A" })
		const group = createClassGroup({ classId: cls.id, name: "All", shortName: "ALL" })
		const math = createActivity({
			name: "Math",
			subjectName: "Math",
			teacherIds: [teacher.id],
			classGroupIds: [group.id],
		})
		const bio = createActivity({
			name: "Bio",
			subjectName: "Bio",
			teacherIds: [teacher.id],
			classGroupIds: [group.id],
		})

		const problem = prepareProblem(calendar, [math, bio], [teacher], [group], [], [])
		const result = generate(problem, undefined, undefined, { seed: 1 })

		expect(result.placedCount).toBe(1)
		expect(result.unplacedActivityIds).toHaveLength(1)
		expect([math.id, bio.id]).toContain(result.unplacedActivityIds[0])
	})
})

describe("Fitness scoring", () => {
	it("scores a fully placed valid schedule highly", () => {
		const project = buildSmallSchool()
		const problem = prepareProblem(
			project.calendar,
			project.activities,
			project.teachers,
			project.classGroups,
			project.classrooms,
			project.availabilityRules,
		)

		const result = generate(problem)
		const fitness = computeFitness(project, result.assignments)
		expect(fitness).toBeGreaterThan(50)
	})

	it("scores empty assignment list at 0", () => {
		const project = buildSmallSchool()
		const fitness = computeFitness(project, [])
		expect(fitness).toBe(0)
	})

	it("computeFitness penalizes hard constraint violations", () => {
		const institution = createInstitution({ name: "S", type: "school" })
		const calendar = createCalendar({
			name: "Cal",
			activeDays: ["monday"],
			periodsPerDay: 4,
		})
		const project = createScheduleProject({
			name: "P",
			calendar,
			institution,
			institutionId: institution.id,
		})
		const teacher = createTeacher({ name: "T", shortName: "T" })
		const cls = createClass({ name: "9A", shortName: "9A" })
		const group = createClassGroup({ classId: cls.id, name: "All", shortName: "ALL" })
		project.teachers.push(teacher)
		project.classes.push(cls)
		project.classGroups.push(group)
		const math = createActivity({
			name: "Math",
			subjectName: "Math",
			teacherIds: [teacher.id],
			classGroupIds: [group.id],
		})
		const bio = createActivity({
			name: "Bio",
			subjectName: "Bio",
			teacherIds: [teacher.id],
			classGroupIds: [group.id],
		})
		project.activities.push(math, bio)

		const clean: Assignment[] = [
			{ activityId: math.id, timeSlot: { day: "monday", period: 0 }, locked: false, duration: 1 },
			{ activityId: bio.id, timeSlot: { day: "monday", period: 1 }, locked: false, duration: 1 },
		]
		const overlapping: Assignment[] = [
			{ activityId: math.id, timeSlot: { day: "monday", period: 0 }, locked: false, duration: 1 },
			{ activityId: bio.id, timeSlot: { day: "monday", period: 0 }, locked: false, duration: 1 },
		]

		expect(computeFitness(project, clean)).toBe(100)
		expect(computeFitness(project, overlapping)).toBeLessThan(computeFitness(project, clean))
	})
})
