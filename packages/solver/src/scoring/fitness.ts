import type { Assignment, ScheduleProject } from "@orar/domain"
import { type ScheduleContext, createDefaultRegistry, expandSplitActivity } from "@orar/domain"

export function computeFitness(project: ScheduleProject, assignments: Assignment[]): number {
	const context: ScheduleContext = {
		calendar: project.calendar,
		classes: project.classes,
		classGroups: project.classGroups,
		teachers: project.teachers,
		classrooms: project.classrooms,
		activities: project.activities,
		availabilityRules: project.availabilityRules,
		assignments,
	}

	const registry = createDefaultRegistry()
	const violations = registry.evaluateAll(context)

	let score = 100
	for (const v of violations) {
		score -= v.weight === "hard" ? 10 : 1
	}

	const totalActivities = project.activities.reduce(
		(sum, a) => sum + expandSplitActivity(a).length,
		0,
	)
	const placedRatio = assignments.length / Math.max(totalActivities, 1)
	score *= placedRatio

	return Math.max(0, Math.min(100, score))
}
