import type { ClassGroup } from "../entities/class-group.ts"
import { timeSlotKeysForSpan } from "../entities/time-slot.ts"
import type { Constraint, ConstraintViolation, ScheduleContext } from "./types.ts"

export function createNoTeacherOverlap(): Constraint {
	return {
		id: "no-teacher-overlap",
		type: "no-teacher-overlap",
		weight: "hard",
		evaluate(context: ScheduleContext): ConstraintViolation[] {
			const violations: ConstraintViolation[] = []
			const teacherSlotMap = new Map<string, string[]>()

			for (const assignment of context.assignments) {
				const activity = context.activities.find((a) => a.id === assignment.activityId)
				if (!activity) continue

				const spanKeys = timeSlotKeysForSpan(assignment.timeSlot, assignment.duration ?? 1)
				for (const key of spanKeys) {
					for (const teacherId of activity.teacherIds) {
						const mapKey = `${teacherId}:${key}`
						const existing = teacherSlotMap.get(mapKey) ?? []
						existing.push(activity.id)
						teacherSlotMap.set(mapKey, existing)
					}
				}
			}

			for (const [mapKey, activityIds] of teacherSlotMap) {
				if (activityIds.length > 1) {
					const [teacherId] = mapKey.split(":")
					const teacher = context.teachers.find((t) => t.id === teacherId)
					violations.push({
						constraintId: "no-teacher-overlap",
						constraintType: "no-teacher-overlap",
						weight: "hard",
						activityIds,
						description: `Teacher ${teacher?.name ?? teacherId} has ${activityIds.length} activities at the same time`,
					})
				}
			}

			return violations
		},
	}
}

interface ClassSlotEntry {
	assignmentIndex: number
	activityId: string
	group: ClassGroup
}

export function createNoClassOverlap(): Constraint {
	return {
		id: "no-class-overlap",
		type: "no-class-overlap",
		weight: "hard",
		evaluate(context: ScheduleContext): ConstraintViolation[] {
			const violations: ConstraintViolation[] = []
			const groupsById = new Map(context.classGroups.map((g) => [g.id, g]))
			const slotEntries = new Map<string, ClassSlotEntry[]>()

			context.assignments.forEach((assignment, assignmentIndex) => {
				const activity = context.activities.find((a) => a.id === assignment.activityId)
				if (!activity) return

				const spanKeys = timeSlotKeysForSpan(assignment.timeSlot, assignment.duration ?? 1)
				for (const key of spanKeys) {
					for (const groupId of activity.classGroupIds) {
						const group = groupsById.get(groupId)
						if (!group) continue
						const existing = slotEntries.get(key) ?? []
						existing.push({ assignmentIndex, activityId: activity.id, group })
						slotEntries.set(key, existing)
					}
				}
			})

			for (const entries of slotEntries.values()) {
				const byClass = new Map<string, ClassSlotEntry[]>()
				for (const entry of entries) {
					const list = byClass.get(entry.group.classId) ?? []
					list.push(entry)
					byClass.set(entry.group.classId, list)
				}

				for (const classEntries of byClass.values()) {
					const conflicting = findClassSlotConflicts(classEntries)
					if (conflicting.length > 0) {
						violations.push({
							constraintId: "no-class-overlap",
							constraintType: "no-class-overlap",
							weight: "hard",
							activityIds: [...new Set(conflicting.map((e) => e.activityId))],
							description: `Class group ${conflicting[0]!.group.name} has overlapping activities at the same time`,
						})
					}
				}
			}

			return violations
		},
	}
}

function findClassSlotConflicts(entries: ClassSlotEntry[]): ClassSlotEntry[] {
	const byGroup = new Map<string, ClassSlotEntry[]>()
	for (const entry of entries) {
		const list = byGroup.get(entry.group.id) ?? []
		list.push(entry)
		byGroup.set(entry.group.id, list)
	}
	for (const list of byGroup.values()) {
		if (new Set(list.map((e) => e.assignmentIndex)).size > 1) return list
	}

	for (const whole of entries) {
		if (!whole.group.isWholeClass) continue
		const others = entries.filter((e) => e.assignmentIndex !== whole.assignmentIndex)
		if (others.length > 0) return [whole, ...others]
	}

	return []
}

export function createNoRoomOverlap(): Constraint {
	return {
		id: "no-room-overlap",
		type: "no-room-overlap",
		weight: "hard",
		evaluate(context: ScheduleContext): ConstraintViolation[] {
			const violations: ConstraintViolation[] = []
			const roomSlotMap = new Map<string, string[]>()

			for (const assignment of context.assignments) {
				if (!assignment.roomId) continue

				const spanKeys = timeSlotKeysForSpan(assignment.timeSlot, assignment.duration ?? 1)
				for (const slotKey of spanKeys) {
					const key = `${assignment.roomId}:${slotKey}`
					const existing = roomSlotMap.get(key) ?? []
					existing.push(assignment.activityId)
					roomSlotMap.set(key, existing)
				}
			}

			for (const [mapKey, activityIds] of roomSlotMap) {
				if (activityIds.length > 1) {
					const [roomId] = mapKey.split(":")
					const room = context.classrooms.find((r) => r.id === roomId)
					violations.push({
						constraintId: "no-room-overlap",
						constraintType: "no-room-overlap",
						weight: "hard",
						activityIds,
						description: `Room ${room?.name ?? roomId} has ${activityIds.length} activities at the same time`,
					})
				}
			}

			return violations
		},
	}
}
