import type { Constraint, ConstraintViolation, ScheduleContext } from "./types.ts"

export function createTeacherMaxHoursPerDay(): Constraint {
	return {
		id: "teacher-max-hours-per-day",
		type: "teacher-max-hours-per-day",
		weight: "hard",
		evaluate(context: ScheduleContext): ConstraintViolation[] {
			const violations: ConstraintViolation[] = []

			const limits = new Map<string, number>()
			for (const teacher of context.teachers) {
				if (teacher.maxHoursPerDay !== undefined) limits.set(teacher.id, teacher.maxHoursPerDay)
			}
			if (limits.size === 0) return violations

			const dailyLoad = new Map<string, { periods: number; activityIds: string[] }>()
			for (const assignment of context.assignments) {
				const activity = context.activities.find((a) => a.id === assignment.activityId)
				if (!activity) continue
				const duration = assignment.duration ?? 1
				for (const teacherId of activity.teacherIds) {
					if (!limits.has(teacherId)) continue
					const key = `${teacherId}|${assignment.timeSlot.day}`
					const load = dailyLoad.get(key) ?? { periods: 0, activityIds: [] }
					load.periods += duration
					load.activityIds.push(activity.id)
					dailyLoad.set(key, load)
				}
			}

			for (const [key, load] of dailyLoad) {
				const [teacherId, day] = key.split("|")
				const limit = limits.get(teacherId!)
				if (limit === undefined || load.periods <= limit) continue
				const teacher = context.teachers.find((t) => t.id === teacherId)
				violations.push({
					constraintId: "teacher-max-hours-per-day",
					constraintType: "teacher-max-hours-per-day",
					weight: "hard",
					activityIds: [...new Set(load.activityIds)],
					description: `Teacher ${teacher?.name ?? teacherId} has ${load.periods} periods on ${day}, exceeding the limit of ${limit}`,
				})
			}

			return violations
		},
	}
}
