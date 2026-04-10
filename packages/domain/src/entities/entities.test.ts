import { describe, expect, it } from "vitest"
import { createActivity, expandSplitActivity } from "./activity.ts"
import { createAssignment } from "./assignment.ts"
import { createAvailabilityRule } from "./availability-rule.ts"
import { createCalendar } from "./calendar.ts"
import { createClass } from "./class.ts"
import { createClassGroup } from "./class-group.ts"
import { createClassroom } from "./classroom.ts"
import { createConflict } from "./conflict.ts"
import { createGenerationRun } from "./generation-run.ts"
import { createInstitution } from "./institution.ts"
import { createSchedule } from "./schedule.ts"
import { createScheduleProject } from "./schedule-project.ts"
import { createTeacher } from "./teacher.ts"
import { createTimeSlot, parseTimeSlotKey, timeSlotKey } from "./time-slot.ts"

describe("Institution", () => {
	it("creates a school institution", () => {
		const inst = createInstitution({ name: "Test School", type: "school" })
		expect(inst.name).toBe("Test School")
		expect(inst.type).toBe("school")
		expect(inst.id).toBeTruthy()
		expect(inst.createdAt).toBeTruthy()
	})

	it("creates a university institution", () => {
		const inst = createInstitution({ name: "Test University", type: "university" })
		expect(inst.type).toBe("university")
	})

	it("rejects empty name", () => {
		expect(() => createInstitution({ name: "", type: "school" })).toThrow()
	})
})

describe("Calendar", () => {
	it("creates a standard school calendar", () => {
		const cal = createCalendar({
			name: "Default",
			activeDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
			periodsPerDay: 7,
		})
		expect(cal.activeDays).toHaveLength(5)
		expect(cal.periodsPerDay).toBe(7)
		expect(cal.periodDurationMinutes).toBe(50)
		expect(cal.startTime).toBe("08:00")
	})

	it("rejects zero periods per day", () => {
		expect(() =>
			createCalendar({
				name: "Bad",
				activeDays: ["monday"],
				periodsPerDay: 0,
			}),
		).toThrow()
	})

	it("rejects empty active days", () => {
		expect(() =>
			createCalendar({
				name: "Bad",
				activeDays: [],
				periodsPerDay: 5,
			}),
		).toThrow()
	})
})

describe("TimeSlot", () => {
	it("creates a valid slot", () => {
		const slot = createTimeSlot("monday", 0)
		expect(slot.day).toBe("monday")
		expect(slot.period).toBe(0)
	})

	it("serializes to key and back", () => {
		const slot = createTimeSlot("wednesday", 3)
		const key = timeSlotKey(slot)
		expect(key).toBe("wednesday:3")
		const parsed = parseTimeSlotKey(key)
		expect(parsed).toEqual(slot)
	})
})

describe("Class and ClassGroup", () => {
	it("creates a class", () => {
		const cls = createClass({ name: "9th A", shortName: "9A", year: 9 })
		expect(cls.name).toBe("9th A")
		expect(cls.year).toBe(9)
	})

	it("creates a class group belonging to a class", () => {
		const cls = createClass({ name: "10th B", shortName: "10B" })
		const group = createClassGroup({
			classId: cls.id,
			name: "Group 1",
			shortName: "G1",
			studentCount: 15,
		})
		expect(group.classId).toBe(cls.id)
		expect(group.studentCount).toBe(15)
	})
})

describe("Teacher", () => {
	it("creates a teacher with constraints", () => {
		const teacher = createTeacher({
			name: "Ion Popescu",
			shortName: "IP",
			maxHoursPerDay: 6,
			maxHoursPerWeek: 20,
		})
		expect(teacher.maxHoursPerDay).toBe(6)
		expect(teacher.maxHoursPerWeek).toBe(20)
	})
})

describe("Classroom", () => {
	it("creates a classroom with tags", () => {
		const room = createClassroom({
			name: "Lab 101",
			shortName: "L101",
			capacity: 30,
			building: "Main",
			tags: ["lab", "chemistry"],
		})
		expect(room.tags).toEqual(["lab", "chemistry"])
	})
})

describe("Activity", () => {
	it("creates a basic activity", () => {
		const teacher = createTeacher({ name: "Prof. A", shortName: "PA" })
		const cls = createClass({ name: "9A", shortName: "9A" })
		const group = createClassGroup({ classId: cls.id, name: "All", shortName: "All" })

		const activity = createActivity({
			name: "Math 9A",
			subjectName: "Mathematics",
			teacherIds: [teacher.id],
			classGroupIds: [group.id],
			totalPerWeek: 4,
		})
		expect(activity.teacherIds).toEqual([teacher.id])
		expect(activity.totalPerWeek).toBe(4)
	})

	it("supports multiple teachers", () => {
		const t1 = createTeacher({ name: "T1", shortName: "T1" })
		const t2 = createTeacher({ name: "T2", shortName: "T2" })
		const cls = createClass({ name: "X", shortName: "X" })
		const g = createClassGroup({ classId: cls.id, name: "All", shortName: "All" })

		const activity = createActivity({
			name: "Team Taught",
			subjectName: "Science",
			teacherIds: [t1.id, t2.id],
			classGroupIds: [g.id],
		})
		expect(activity.teacherIds).toHaveLength(2)
	})

	it("supports split configuration", () => {
		const t = createTeacher({ name: "T", shortName: "T" })
		const cls = createClass({ name: "X", shortName: "X" })
		const g = createClassGroup({ classId: cls.id, name: "All", shortName: "All" })

		const activity = createActivity({
			name: "Split",
			subjectName: "PE",
			teacherIds: [t.id],
			classGroupIds: [g.id],
			totalPerWeek: 3,
			splitConfig: { isSplit: true, parts: [2, 1] },
		})

		const parts = expandSplitActivity(activity)
		expect(parts).toEqual([2, 1])
	})

	it("expands non-split activity into uniform parts", () => {
		const t = createTeacher({ name: "T", shortName: "T" })
		const cls = createClass({ name: "X", shortName: "X" })
		const g = createClassGroup({ classId: cls.id, name: "All", shortName: "All" })

		const activity = createActivity({
			name: "Regular",
			subjectName: "Math",
			teacherIds: [t.id],
			classGroupIds: [g.id],
			totalPerWeek: 3,
			duration: 1,
		})

		const parts = expandSplitActivity(activity)
		expect(parts).toEqual([1, 1, 1])
	})

	it("supports multiple class groups", () => {
		const t = createTeacher({ name: "T", shortName: "T" })
		const cls = createClass({ name: "9A", shortName: "9A" })
		const g1 = createClassGroup({ classId: cls.id, name: "G1", shortName: "G1" })
		const g2 = createClassGroup({ classId: cls.id, name: "G2", shortName: "G2" })

		const activity = createActivity({
			name: "Lab",
			subjectName: "Physics",
			teacherIds: [t.id],
			classGroupIds: [g1.id, g2.id],
		})
		expect(activity.classGroupIds).toHaveLength(2)
	})
})

describe("AvailabilityRule", () => {
	it("creates an unavailability rule for a teacher", () => {
		const teacher = createTeacher({ name: "T", shortName: "T" })
		const rule = createAvailabilityRule({
			targetType: "teacher",
			targetId: teacher.id,
			type: "unavailable",
			timeSlots: [createTimeSlot("monday", 0), createTimeSlot("monday", 1)],
		})
		expect(rule.timeSlots).toHaveLength(2)
		expect(rule.type).toBe("unavailable")
	})

	it("creates a preferred time rule for a classroom", () => {
		const room = createClassroom({ name: "R", shortName: "R" })
		const rule = createAvailabilityRule({
			targetType: "classroom",
			targetId: room.id,
			type: "preferred",
			timeSlots: [createTimeSlot("friday", 5)],
		})
		expect(rule.targetType).toBe("classroom")
	})
})

describe("Assignment", () => {
	it("creates an assignment", () => {
		const assignment = createAssignment({
			activityId: crypto.randomUUID(),
			timeSlot: createTimeSlot("tuesday", 2),
			roomId: crypto.randomUUID(),
		})
		expect(assignment.locked).toBe(false)
	})

	it("can be locked", () => {
		const assignment = createAssignment({
			activityId: crypto.randomUUID(),
			timeSlot: createTimeSlot("monday", 0),
			locked: true,
		})
		expect(assignment.locked).toBe(true)
	})
})

describe("Schedule", () => {
	it("creates a schedule with assignments", () => {
		const projectId = crypto.randomUUID()
		const schedule = createSchedule({
			projectId,
			assignments: [
				createAssignment({
					activityId: crypto.randomUUID(),
					timeSlot: createTimeSlot("monday", 0),
				}),
			],
		})
		expect(schedule.assignments).toHaveLength(1)
		expect(schedule.projectId).toBe(projectId)
	})
})

describe("Conflict", () => {
	it("creates a teacher overlap conflict", () => {
		const conflict = createConflict({
			type: "teacher-overlap",
			activityIds: [crypto.randomUUID(), crypto.randomUUID()],
			timeSlot: createTimeSlot("monday", 0),
			description: "Teacher assigned to two activities at the same time",
			severity: "hard",
		})
		expect(conflict.type).toBe("teacher-overlap")
		expect(conflict.severity).toBe("hard")
	})
})

describe("GenerationRun", () => {
	it("starts in pending state", () => {
		const run = createGenerationRun({ projectId: crypto.randomUUID() })
		expect(run.status).toBe("pending")
		expect(run.progress).toBe(0)
	})
})

describe("ScheduleProject", () => {
	it("creates a complete project shell", () => {
		const inst = createInstitution({ name: "School", type: "school" })
		const cal = createCalendar({
			name: "Default",
			activeDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
			periodsPerDay: 7,
		})
		const project = createScheduleProject({
			name: "Fall 2026",
			calendar: cal,
			institution: inst,
		})
		expect(project.classes).toEqual([])
		expect(project.teachers).toEqual([])
		expect(project.institutionId).toBe(inst.id)
	})
})
