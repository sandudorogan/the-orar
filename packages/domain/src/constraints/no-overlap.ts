import { timeSlotKey } from "../entities/time-slot.ts"
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

				const key = timeSlotKey(assignment.timeSlot)
				for (const teacherId of activity.teacherIds) {
					const mapKey = `${teacherId}:${key}`
					const existing = teacherSlotMap.get(mapKey) ?? []
					existing.push(activity.id)
					teacherSlotMap.set(mapKey, existing)
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

export function createNoClassOverlap(): Constraint {
	return {
		id: "no-class-overlap",
		type: "no-class-overlap",
		weight: "hard",
		evaluate(context: ScheduleContext): ConstraintViolation[] {
			const violations: ConstraintViolation[] = []
			const groupSlotMap = new Map<string, string[]>()

			for (const assignment of context.assignments) {
				const activity = context.activities.find((a) => a.id === assignment.activityId)
				if (!activity) continue

				const key = timeSlotKey(assignment.timeSlot)
				for (const groupId of activity.classGroupIds) {
					const mapKey = `${groupId}:${key}`
					const existing = groupSlotMap.get(mapKey) ?? []
					existing.push(activity.id)
					groupSlotMap.set(mapKey, existing)
				}
			}

			for (const [mapKey, activityIds] of groupSlotMap) {
				if (activityIds.length > 1) {
					const [groupId] = mapKey.split(":")
					const group = context.classGroups.find((g) => g.id === groupId)
					violations.push({
						constraintId: "no-class-overlap",
						constraintType: "no-class-overlap",
						weight: "hard",
						activityIds,
						description: `Class group ${group?.name ?? groupId} has ${activityIds.length} activities at the same time`,
					})
				}
			}

			return violations
		},
	}
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

				const key = `${assignment.roomId}:${timeSlotKey(assignment.timeSlot)}`
				const existing = roomSlotMap.get(key) ?? []
				existing.push(assignment.activityId)
				roomSlotMap.set(key, existing)
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
