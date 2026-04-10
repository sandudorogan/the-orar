import type { ScheduleProject } from "../entities/schedule-project.ts"

export interface ValidationIssue {
	severity: "error" | "warning"
	entity: string
	entityId?: string
	message: string
}

export function validateProject(project: ScheduleProject): ValidationIssue[] {
	const issues: ValidationIssue[] = []

	if (project.activities.length === 0) {
		issues.push({
			severity: "warning",
			entity: "project",
			message: "No activities defined",
		})
	}

	if (project.teachers.length === 0) {
		issues.push({
			severity: "warning",
			entity: "project",
			message: "No teachers defined",
		})
	}

	if (project.classes.length === 0) {
		issues.push({
			severity: "warning",
			entity: "project",
			message: "No classes defined",
		})
	}

	for (const activity of project.activities) {
		for (const teacherId of activity.teacherIds) {
			if (!project.teachers.some((t) => t.id === teacherId)) {
				issues.push({
					severity: "error",
					entity: "activity",
					entityId: activity.id,
					message: `Activity "${activity.name}" references non-existent teacher ${teacherId}`,
				})
			}
		}

		for (const groupId of activity.classGroupIds) {
			if (!project.classGroups.some((g) => g.id === groupId)) {
				issues.push({
					severity: "error",
					entity: "activity",
					entityId: activity.id,
					message: `Activity "${activity.name}" references non-existent class group ${groupId}`,
				})
			}
		}
	}

	for (const rule of project.availabilityRules) {
		let targetExists = false
		switch (rule.targetType) {
			case "teacher":
				targetExists = project.teachers.some((t) => t.id === rule.targetId)
				break
			case "class":
				targetExists = project.classes.some((c) => c.id === rule.targetId)
				break
			case "classGroup":
				targetExists = project.classGroups.some((g) => g.id === rule.targetId)
				break
			case "classroom":
				targetExists = project.classrooms.some((r) => r.id === rule.targetId)
				break
		}
		if (!targetExists) {
			issues.push({
				severity: "error",
				entity: "availability",
				entityId: rule.id,
				message: `Availability rule references non-existent ${rule.targetType} ${rule.targetId}`,
			})
		}
	}

	const totalSlots =
		project.calendar.activeDays.length * project.calendar.periodsPerDay
	let totalRequired = 0
	for (const activity of project.activities) {
		totalRequired += activity.totalPerWeek * activity.duration
	}
	if (totalRequired > totalSlots * project.classrooms.length && project.classrooms.length > 0) {
		issues.push({
			severity: "warning",
			entity: "project",
			message: `Total activity hours (${totalRequired}) may exceed available room-slots (${totalSlots * project.classrooms.length}). Schedule may be impossible.`,
		})
	}

	return issues
}
