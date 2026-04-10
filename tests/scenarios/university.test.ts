import {
	createActivity,
	createCalendar,
	createClass,
	createClassGroup,
	createClassroom,
	createInstitution,
	createScheduleProject,
	createTeacher,
} from "@orar/domain"
import { generate, prepareProblem } from "@orar/solver"
import { describe, expect, it } from "vitest"

describe("Scenario: University faculty (10 instructors, 6 courses, 8 rooms)", () => {
	function build() {
		const inst = createInstitution({ name: "Faculty of CS", type: "university" })
		const cal = createCalendar({
			name: "Semester",
			activeDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
			periodsPerDay: 6,
			periodDurationMinutes: 90,
			startTime: "08:00",
		})
		const project = createScheduleProject({ name: "Fall 2026", calendar: cal, institution: inst })

		const instructors = Array.from({ length: 10 }, (_, i) =>
			createTeacher({ name: `Prof. ${String.fromCharCode(65 + i)}`, shortName: `P${i}` }),
		)
		project.teachers.push(...instructors)

		const courses = ["CS101", "CS201", "CS301", "MATH101", "MATH201", "PHY101"]
		const years = ["Year 1", "Year 2", "Year 3"]
		const classes = years.map((y) => createClass({ name: y, shortName: y }))
		project.classes.push(...classes)

		const groups = [
			createClassGroup({ classId: classes[0]!.id, name: "Y1-A", shortName: "Y1A" }),
			createClassGroup({ classId: classes[0]!.id, name: "Y1-B", shortName: "Y1B" }),
			createClassGroup({ classId: classes[1]!.id, name: "Y2-A", shortName: "Y2A" }),
			createClassGroup({ classId: classes[1]!.id, name: "Y2-B", shortName: "Y2B" }),
			createClassGroup({ classId: classes[2]!.id, name: "Y3-A", shortName: "Y3A" }),
			createClassGroup({ classId: classes[2]!.id, name: "Y3-B", shortName: "Y3B" }),
		]
		project.classGroups.push(...groups)

		const rooms = Array.from({ length: 8 }, (_, i) =>
			createClassroom({
				name: `Hall ${i + 1}`,
				shortName: `H${i + 1}`,
				capacity: i < 4 ? 100 : 30,
				tags: i < 4 ? ["lecture"] : ["lab"],
			}),
		)
		project.classrooms.push(...rooms)

		// Year 1: CS101, MATH101 (shared lectures + lab groups)
		project.activities.push(
			createActivity({ name: "CS101 Lecture", subjectName: "CS101", teacherIds: [instructors[0]!.id], classGroupIds: [groups[0]!.id, groups[1]!.id], totalPerWeek: 2, roomTags: ["lecture"] }),
			createActivity({ name: "CS101 Lab Y1A", subjectName: "CS101", teacherIds: [instructors[1]!.id], classGroupIds: [groups[0]!.id], totalPerWeek: 1, roomTags: ["lab"] }),
			createActivity({ name: "CS101 Lab Y1B", subjectName: "CS101", teacherIds: [instructors[1]!.id], classGroupIds: [groups[1]!.id], totalPerWeek: 1, roomTags: ["lab"] }),
			createActivity({ name: "MATH101 Lecture", subjectName: "MATH101", teacherIds: [instructors[2]!.id], classGroupIds: [groups[0]!.id, groups[1]!.id], totalPerWeek: 3, roomTags: ["lecture"] }),
		)

		// Year 2: CS201, MATH201
		project.activities.push(
			createActivity({ name: "CS201 Lecture", subjectName: "CS201", teacherIds: [instructors[3]!.id], classGroupIds: [groups[2]!.id, groups[3]!.id], totalPerWeek: 2, roomTags: ["lecture"] }),
			createActivity({ name: "CS201 Lab Y2A", subjectName: "CS201", teacherIds: [instructors[4]!.id], classGroupIds: [groups[2]!.id], totalPerWeek: 2, roomTags: ["lab"] }),
			createActivity({ name: "CS201 Lab Y2B", subjectName: "CS201", teacherIds: [instructors[4]!.id], classGroupIds: [groups[3]!.id], totalPerWeek: 2, roomTags: ["lab"] }),
			createActivity({ name: "MATH201 Lecture", subjectName: "MATH201", teacherIds: [instructors[5]!.id], classGroupIds: [groups[2]!.id, groups[3]!.id], totalPerWeek: 2, roomTags: ["lecture"] }),
		)

		// Year 3: CS301, PHY101
		project.activities.push(
			createActivity({ name: "CS301 Lecture", subjectName: "CS301", teacherIds: [instructors[6]!.id], classGroupIds: [groups[4]!.id, groups[5]!.id], totalPerWeek: 2, roomTags: ["lecture"] }),
			createActivity({ name: "CS301 Lab Y3A", subjectName: "CS301", teacherIds: [instructors[7]!.id], classGroupIds: [groups[4]!.id], totalPerWeek: 2, roomTags: ["lab"] }),
			createActivity({ name: "CS301 Lab Y3B", subjectName: "CS301", teacherIds: [instructors[7]!.id], classGroupIds: [groups[5]!.id], totalPerWeek: 2, roomTags: ["lab"] }),
			createActivity({ name: "PHY101 Lecture", subjectName: "PHY101", teacherIds: [instructors[8]!.id], classGroupIds: [groups[4]!.id, groups[5]!.id], totalPerWeek: 2, roomTags: ["lecture"] }),
		)

		return project
	}

	it("handles multi-group lectures", () => {
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

	it("assigns rooms matching tags when possible", () => {
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
		const lectureActivities = project.activities.filter((a) => a.roomTags.includes("lecture"))
		const lectureRoomIds = project.classrooms.filter((r) => r.tags.includes("lecture")).map((r) => r.id)

		for (const assignment of result.assignments) {
			const act = lectureActivities.find((a) => a.id === assignment.activityId)
			if (act && assignment.roomId) {
				expect(lectureRoomIds).toContain(assignment.roomId)
			}
		}
	})
})
