import type { ScheduleProject } from "@orar/domain"

export function isProjectSetupEmpty(project: ScheduleProject): boolean {
	return (
		project.classes.length === 0 &&
		project.classGroups.length === 0 &&
		project.teachers.length === 0 &&
		project.classrooms.length === 0 &&
		project.activities.length === 0
	)
}

export function isProjectSetupReady(project: ScheduleProject): boolean {
	return (
		project.classes.length > 0 &&
		project.classGroups.length > 0 &&
		project.teachers.length > 0 &&
		project.classrooms.length > 0 &&
		project.activities.length > 0
	)
}
