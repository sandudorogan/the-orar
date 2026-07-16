import { createDefaultRegistry } from "../constraints/registry.ts"
import type { ScheduleContext } from "../constraints/types.ts"
import type { Activity } from "../entities/activity.ts"
import type { Assignment } from "../entities/assignment.ts"
import type { Conflict } from "../entities/conflict.ts"
import { createConflict } from "../entities/conflict.ts"

export function getAssignmentsForTeacher(
	assignments: Assignment[],
	teacherId: string,
	activities: Activity[],
): Assignment[] {
	const teacherActivityIds = new Set(
		activities.filter((a) => a.teacherIds.includes(teacherId)).map((a) => a.id),
	)
	return assignments.filter((a) => teacherActivityIds.has(a.activityId))
}

export function getAssignmentsForClassGroup(
	assignments: Assignment[],
	groupId: string,
	activities: Activity[],
): Assignment[] {
	const groupActivityIds = new Set(
		activities.filter((a) => a.classGroupIds.includes(groupId)).map((a) => a.id),
	)
	return assignments.filter((a) => groupActivityIds.has(a.activityId))
}

export function getAssignmentsForRoom(assignments: Assignment[], roomId: string): Assignment[] {
	return assignments.filter((a) => a.roomId === roomId)
}

export function detectConflicts(context: ScheduleContext): Conflict[] {
	const registry = createDefaultRegistry()
	const violations = registry.evaluateAll(context)

	return violations.map((v) =>
		createConflict({
			type: mapConstraintTypeToConflictType(v.constraintType),
			activityIds: v.activityIds,
			timeSlot: v.timeSlot,
			description: v.description,
			severity: v.weight,
		}),
	)
}

function mapConstraintTypeToConflictType(constraintType: string): Conflict["type"] {
	switch (constraintType) {
		case "no-teacher-overlap":
			return "teacher-overlap"
		case "no-class-overlap":
			return "class-overlap"
		case "no-room-overlap":
			return "room-overlap"
		case "teacher-availability":
		case "class-availability":
		case "classroom-availability":
			return "unavailability-violation"
		case "teacher-max-hours-per-day":
			return "workload-violation"
		case "activity-spread":
			return "spread-violation"
		default:
			return "unplaced-activity"
	}
}
