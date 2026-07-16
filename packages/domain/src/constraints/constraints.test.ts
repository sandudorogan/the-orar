import { describe, expect, it } from "vitest"
import { createActivity } from "../entities/activity.ts"
import { createAssignment } from "../entities/assignment.ts"
import { createAvailabilityRule } from "../entities/availability-rule.ts"
import { createCalendar } from "../entities/calendar.ts"
import { createClassGroup } from "../entities/class-group.ts"
import { createClass } from "../entities/class.ts"
import { createClassroom } from "../entities/classroom.ts"
import { createTeacher } from "../entities/teacher.ts"
import { createTimeSlot } from "../entities/time-slot.ts"
import { createActivityPreferredRoom } from "./activity-preferred-room.ts"
import { createActivityPreferredTime } from "./activity-preferred-time.ts"
import { createNoClassOverlap } from "./no-overlap.ts"
import { createDefaultRegistry } from "./registry.ts"
import type { ScheduleContext } from "./types.ts"

function makeContext(overrides: Partial<ScheduleContext> = {}): ScheduleContext {
	return {
		calendar: createCalendar({
			name: "Default",
			activeDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
			periodsPerDay: 7,
		}),
		classes: [],
		classGroups: [],
		teachers: [],
		classrooms: [],
		activities: [],
		availabilityRules: [],
		assignments: [],
		...overrides,
	}
}

describe("No-overlap constraints", () => {
	it("detects teacher overlap", () => {
		const teacher = createTeacher({ name: "T1", shortName: "T1" })
		const cls = createClass({ name: "9A", shortName: "9A" })
		const group = createClassGroup({ classId: cls.id, name: "All", shortName: "All" })

		const a1 = createActivity({
			name: "Math",
			subjectName: "Math",
			teacherIds: [teacher.id],
			classGroupIds: [group.id],
		})
		const a2 = createActivity({
			name: "Physics",
			subjectName: "Physics",
			teacherIds: [teacher.id],
			classGroupIds: [group.id],
		})

		const slot = createTimeSlot("monday", 0)
		const context = makeContext({
			teachers: [teacher],
			classGroups: [group],
			activities: [a1, a2],
			assignments: [
				createAssignment({ activityId: a1.id, timeSlot: slot }),
				createAssignment({ activityId: a2.id, timeSlot: slot }),
			],
		})

		const registry = createDefaultRegistry()
		const violations = registry.evaluateHard(context)
		const teacherViolations = violations.filter((v) => v.constraintType === "no-teacher-overlap")
		expect(teacherViolations.length).toBeGreaterThan(0)
	})

	it("no violation when teachers differ", () => {
		const t1 = createTeacher({ name: "T1", shortName: "T1" })
		const t2 = createTeacher({ name: "T2", shortName: "T2" })
		const cls = createClass({ name: "9A", shortName: "9A" })
		const g1 = createClassGroup({ classId: cls.id, name: "G1", shortName: "G1" })
		const g2 = createClassGroup({ classId: cls.id, name: "G2", shortName: "G2" })

		const a1 = createActivity({
			name: "Math",
			subjectName: "Math",
			teacherIds: [t1.id],
			classGroupIds: [g1.id],
		})
		const a2 = createActivity({
			name: "Physics",
			subjectName: "Physics",
			teacherIds: [t2.id],
			classGroupIds: [g2.id],
		})

		const slot = createTimeSlot("monday", 0)
		const context = makeContext({
			teachers: [t1, t2],
			classGroups: [g1, g2],
			activities: [a1, a2],
			assignments: [
				createAssignment({ activityId: a1.id, timeSlot: slot }),
				createAssignment({ activityId: a2.id, timeSlot: slot }),
			],
		})

		const registry = createDefaultRegistry()
		const violations = registry.evaluateHard(context)
		const teacherViolations = violations.filter((v) => v.constraintType === "no-teacher-overlap")
		expect(teacherViolations).toHaveLength(0)
	})

	it("detects room overlap", () => {
		const t1 = createTeacher({ name: "T1", shortName: "T1" })
		const t2 = createTeacher({ name: "T2", shortName: "T2" })
		const cls = createClass({ name: "9A", shortName: "9A" })
		const g1 = createClassGroup({ classId: cls.id, name: "G1", shortName: "G1" })
		const g2 = createClassGroup({ classId: cls.id, name: "G2", shortName: "G2" })
		const room = createClassroom({ name: "R1", shortName: "R1" })

		const a1 = createActivity({
			name: "Math",
			subjectName: "Math",
			teacherIds: [t1.id],
			classGroupIds: [g1.id],
		})
		const a2 = createActivity({
			name: "Physics",
			subjectName: "Physics",
			teacherIds: [t2.id],
			classGroupIds: [g2.id],
		})

		const slot = createTimeSlot("monday", 0)
		const context = makeContext({
			teachers: [t1, t2],
			classGroups: [g1, g2],
			classrooms: [room],
			activities: [a1, a2],
			assignments: [
				createAssignment({ activityId: a1.id, timeSlot: slot, roomId: room.id }),
				createAssignment({ activityId: a2.id, timeSlot: slot, roomId: room.id }),
			],
		})

		const registry = createDefaultRegistry()
		const violations = registry.evaluateHard(context)
		const roomViolations = violations.filter((v) => v.constraintType === "no-room-overlap")
		expect(roomViolations.length).toBeGreaterThan(0)
	})

	it("detects class group overlap", () => {
		const t1 = createTeacher({ name: "T1", shortName: "T1" })
		const t2 = createTeacher({ name: "T2", shortName: "T2" })
		const cls = createClass({ name: "9A", shortName: "9A" })
		const group = createClassGroup({ classId: cls.id, name: "All", shortName: "All" })

		const a1 = createActivity({
			name: "Math",
			subjectName: "Math",
			teacherIds: [t1.id],
			classGroupIds: [group.id],
		})
		const a2 = createActivity({
			name: "Physics",
			subjectName: "Physics",
			teacherIds: [t2.id],
			classGroupIds: [group.id],
		})

		const slot = createTimeSlot("monday", 0)
		const context = makeContext({
			teachers: [t1, t2],
			classGroups: [group],
			activities: [a1, a2],
			assignments: [
				createAssignment({ activityId: a1.id, timeSlot: slot }),
				createAssignment({ activityId: a2.id, timeSlot: slot }),
			],
		})

		const registry = createDefaultRegistry()
		const violations = registry.evaluateHard(context)
		const classViolations = violations.filter((v) => v.constraintType === "no-class-overlap")
		expect(classViolations.length).toBeGreaterThan(0)
	})
})

describe("Availability constraints", () => {
	it("detects teacher unavailability violation", () => {
		const teacher = createTeacher({ name: "T1", shortName: "T1" })
		const cls = createClass({ name: "9A", shortName: "9A" })
		const group = createClassGroup({ classId: cls.id, name: "All", shortName: "All" })

		const blockedSlot = createTimeSlot("monday", 0)
		const rule = createAvailabilityRule({
			targetType: "teacher",
			targetId: teacher.id,
			type: "unavailable",
			timeSlots: [blockedSlot],
		})

		const activity = createActivity({
			name: "Math",
			subjectName: "Math",
			teacherIds: [teacher.id],
			classGroupIds: [group.id],
		})

		const context = makeContext({
			teachers: [teacher],
			classGroups: [group],
			activities: [activity],
			availabilityRules: [rule],
			assignments: [createAssignment({ activityId: activity.id, timeSlot: blockedSlot })],
		})

		const registry = createDefaultRegistry()
		const violations = registry.evaluateHard(context)
		const avail = violations.filter((v) => v.constraintType === "teacher-availability")
		expect(avail.length).toBeGreaterThan(0)
	})

	it("no violation when teacher is available", () => {
		const teacher = createTeacher({ name: "T1", shortName: "T1" })
		const cls = createClass({ name: "9A", shortName: "9A" })
		const group = createClassGroup({ classId: cls.id, name: "All", shortName: "All" })

		const rule = createAvailabilityRule({
			targetType: "teacher",
			targetId: teacher.id,
			type: "unavailable",
			timeSlots: [createTimeSlot("friday", 6)],
		})

		const activity = createActivity({
			name: "Math",
			subjectName: "Math",
			teacherIds: [teacher.id],
			classGroupIds: [group.id],
		})

		const context = makeContext({
			teachers: [teacher],
			classGroups: [group],
			activities: [activity],
			availabilityRules: [rule],
			assignments: [
				createAssignment({
					activityId: activity.id,
					timeSlot: createTimeSlot("monday", 0),
				}),
			],
		})

		const registry = createDefaultRegistry()
		const violations = registry.evaluateHard(context)
		const avail = violations.filter((v) => v.constraintType === "teacher-availability")
		expect(avail).toHaveLength(0)
	})
})

describe("Soft constraints", () => {
	it("detects preferred time violation", () => {
		const teacher = createTeacher({ name: "T1", shortName: "T1" })
		const cls = createClass({ name: "9A", shortName: "9A" })
		const group = createClassGroup({ classId: cls.id, name: "All", shortName: "All" })

		const activity = createActivity({
			name: "Math",
			subjectName: "Math",
			teacherIds: [teacher.id],
			classGroupIds: [group.id],
		})

		const constraint = createActivityPreferredTime(activity.id, [
			createTimeSlot("monday", 0),
			createTimeSlot("monday", 1),
		])

		const context = makeContext({
			teachers: [teacher],
			classGroups: [group],
			activities: [activity],
			assignments: [
				createAssignment({
					activityId: activity.id,
					timeSlot: createTimeSlot("friday", 5),
				}),
			],
		})

		const violations = constraint.evaluate(context)
		expect(violations.length).toBeGreaterThan(0)
		expect(violations[0]!.weight).toBe("soft")
	})

	it("detects preferred room violation", () => {
		const teacher = createTeacher({ name: "T1", shortName: "T1" })
		const cls = createClass({ name: "9A", shortName: "9A" })
		const group = createClassGroup({ classId: cls.id, name: "All", shortName: "All" })
		const preferredRoom = createClassroom({ name: "Lab1", shortName: "L1" })
		const otherRoom = createClassroom({ name: "Lab2", shortName: "L2" })

		const activity = createActivity({
			name: "Chemistry",
			subjectName: "Chemistry",
			teacherIds: [teacher.id],
			classGroupIds: [group.id],
		})

		const constraint = createActivityPreferredRoom(activity.id, [preferredRoom.id])

		const context = makeContext({
			teachers: [teacher],
			classGroups: [group],
			classrooms: [preferredRoom, otherRoom],
			activities: [activity],
			assignments: [
				createAssignment({
					activityId: activity.id,
					timeSlot: createTimeSlot("monday", 0),
					roomId: otherRoom.id,
				}),
			],
		})

		const violations = constraint.evaluate(context)
		expect(violations.length).toBeGreaterThan(0)
		expect(violations[0]!.weight).toBe("soft")
	})
})

describe("Registry", () => {
	it("creates default registry with all core constraints", () => {
		const registry = createDefaultRegistry()
		expect(registry.getAll().length).toBeGreaterThanOrEqual(6)
	})

	it("returns empty violations for valid schedule", () => {
		const t1 = createTeacher({ name: "T1", shortName: "T1" })
		const t2 = createTeacher({ name: "T2", shortName: "T2" })
		const cls = createClass({ name: "9A", shortName: "9A" })
		const g1 = createClassGroup({ classId: cls.id, name: "G1", shortName: "G1" })
		const g2 = createClassGroup({ classId: cls.id, name: "G2", shortName: "G2" })
		const r1 = createClassroom({ name: "R1", shortName: "R1" })
		const r2 = createClassroom({ name: "R2", shortName: "R2" })

		const a1 = createActivity({
			name: "Math",
			subjectName: "Math",
			teacherIds: [t1.id],
			classGroupIds: [g1.id],
		})
		const a2 = createActivity({
			name: "Physics",
			subjectName: "Physics",
			teacherIds: [t2.id],
			classGroupIds: [g2.id],
		})

		const context = makeContext({
			teachers: [t1, t2],
			classGroups: [g1, g2],
			classrooms: [r1, r2],
			activities: [a1, a2],
			assignments: [
				createAssignment({
					activityId: a1.id,
					timeSlot: createTimeSlot("monday", 0),
					roomId: r1.id,
				}),
				createAssignment({
					activityId: a2.id,
					timeSlot: createTimeSlot("monday", 0),
					roomId: r2.id,
				}),
			],
		})

		const registry = createDefaultRegistry()
		const violations = registry.evaluateAll(context)
		expect(violations).toHaveLength(0)
	})
})

describe("no-class-overlap with whole-class groups", () => {
	function buildContext() {
		const calendar = createCalendar({ name: "Cal", activeDays: ["monday"], periodsPerDay: 4 })
		const cls = createClass({ name: "9A", shortName: "9A" })
		const whole = createClassGroup({
			classId: cls.id,
			name: "All",
			shortName: "ALL",
			isWholeClass: true,
		})
		const sub1 = createClassGroup({ classId: cls.id, name: "Sci", shortName: "SCI" })
		const sub2 = createClassGroup({ classId: cls.id, name: "Arts", shortName: "ART" })
		const t1 = createTeacher({ name: "T1", shortName: "T1" })
		const t2 = createTeacher({ name: "T2", shortName: "T2" })
		return { calendar, cls, whole, sub1, sub2, t1, t2 }
	}

	it("flags a whole-class group overlapping a subgroup of the same class", () => {
		const { calendar, cls, whole, sub1, sub2, t1, t2 } = buildContext()
		const a1 = createActivity({
			name: "Math",
			subjectName: "Math",
			teacherIds: [t1.id],
			classGroupIds: [whole.id],
		})
		const a2 = createActivity({
			name: "Bio",
			subjectName: "Bio",
			teacherIds: [t2.id],
			classGroupIds: [sub1.id],
		})
		const context: ScheduleContext = {
			calendar,
			classes: [cls],
			classGroups: [whole, sub1, sub2],
			teachers: [t1, t2],
			classrooms: [],
			activities: [a1, a2],
			availabilityRules: [],
			assignments: [
				{ activityId: a1.id, timeSlot: { day: "monday", period: 0 }, locked: false, duration: 1 },
				{ activityId: a2.id, timeSlot: { day: "monday", period: 0 }, locked: false, duration: 1 },
			],
		}

		const violations = createNoClassOverlap().evaluate(context)
		expect(violations).toHaveLength(1)
		expect(violations[0]!.activityIds).toEqual(expect.arrayContaining([a1.id, a2.id]))
	})

	it("allows two sibling subgroups at the same time", () => {
		const { calendar, cls, whole, sub1, sub2, t1, t2 } = buildContext()
		const a1 = createActivity({
			name: "Chem",
			subjectName: "Chem",
			teacherIds: [t1.id],
			classGroupIds: [sub1.id],
		})
		const a2 = createActivity({
			name: "Art",
			subjectName: "Art",
			teacherIds: [t2.id],
			classGroupIds: [sub2.id],
		})
		const context: ScheduleContext = {
			calendar,
			classes: [cls],
			classGroups: [whole, sub1, sub2],
			teachers: [t1, t2],
			classrooms: [],
			activities: [a1, a2],
			availabilityRules: [],
			assignments: [
				{ activityId: a1.id, timeSlot: { day: "monday", period: 0 }, locked: false, duration: 1 },
				{ activityId: a2.id, timeSlot: { day: "monday", period: 0 }, locked: false, duration: 1 },
			],
		}

		expect(createNoClassOverlap().evaluate(context)).toHaveLength(0)
	})
})
