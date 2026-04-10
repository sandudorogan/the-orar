import type {
	Activity,
	Assignment,
	Calendar,
	ClassGroup,
	Classroom,
	Teacher,
	TimeSlot,
} from "@orar/domain"

export interface ExportTimetableRow {
	period: number
	cells: ExportCell[]
}

export interface ExportCell {
	day: string
	period: number
	activityName: string
	subjectName: string
	teacherNames: string[]
	classGroupNames: string[]
	roomName?: string
}

export interface ExportScheduleModel {
	title: string
	subtitle: string
	days: string[]
	periods: number
	rows: ExportTimetableRow[]
}

export function buildTeacherExportModel(
	teacher: Teacher,
	calendar: Calendar,
	assignments: Assignment[],
	activities: Activity[],
	classGroups: ClassGroup[],
	classrooms: Classroom[],
): ExportScheduleModel {
	const teacherAssignments = assignments.filter((a) => {
		const act = activities.find((act) => act.id === a.activityId)
		return act?.teacherIds.includes(teacher.id)
	})

	return buildExportModel(
		teacher.name,
		"Teacher Schedule",
		calendar,
		teacherAssignments,
		activities,
		classGroups,
		classrooms,
		[],
	)
}

export function buildClassGroupExportModel(
	group: ClassGroup,
	calendar: Calendar,
	assignments: Assignment[],
	activities: Activity[],
	teachers: Teacher[],
	classrooms: Classroom[],
): ExportScheduleModel {
	const groupAssignments = assignments.filter((a) => {
		const act = activities.find((act) => act.id === a.activityId)
		return act?.classGroupIds.includes(group.id)
	})

	return buildExportModel(
		group.name,
		"Class Schedule",
		calendar,
		groupAssignments,
		activities,
		[],
		classrooms,
		teachers,
	)
}

export function buildClassroomExportModel(
	classroom: Classroom,
	calendar: Calendar,
	assignments: Assignment[],
	activities: Activity[],
	teachers: Teacher[],
	classGroups: ClassGroup[],
): ExportScheduleModel {
	const roomAssignments = assignments.filter((a) => a.roomId === classroom.id)

	return buildExportModel(
		classroom.name,
		"Room Schedule",
		calendar,
		roomAssignments,
		activities,
		classGroups,
		[],
		teachers,
	)
}

function buildExportModel(
	title: string,
	subtitle: string,
	calendar: Calendar,
	assignments: Assignment[],
	activities: Activity[],
	classGroups: ClassGroup[],
	classrooms: Classroom[],
	teachers: Teacher[],
): ExportScheduleModel {
	const days = calendar.activeDays.map((d) => d.charAt(0).toUpperCase() + d.slice(1))
	const rows: ExportTimetableRow[] = []

	for (let period = 0; period < calendar.periodsPerDay; period++) {
		const cells: ExportCell[] = []
		for (const day of calendar.activeDays) {
			const matching = assignments.filter(
				(a) => a.timeSlot.day === day && a.timeSlot.period === period,
			)
			if (matching.length > 0) {
				const a = matching[0]!
				const activity = activities.find((act) => act.id === a.activityId)
				cells.push({
					day,
					period,
					activityName: activity?.name ?? "",
					subjectName: activity?.subjectName ?? "",
					teacherNames: teachers.length > 0
						? (activity?.teacherIds.map((id) => teachers.find((t) => t.id === id)?.shortName ?? id) ?? [])
						: [],
					classGroupNames: classGroups.length > 0
						? (activity?.classGroupIds.map((id) => classGroups.find((g) => g.id === id)?.shortName ?? id) ?? [])
						: [],
					roomName: a.roomId
						? classrooms.find((r) => r.id === a.roomId)?.shortName
						: undefined,
				})
			} else {
				cells.push({
					day,
					period,
					activityName: "",
					subjectName: "",
					teacherNames: [],
					classGroupNames: [],
				})
			}
		}
		rows.push({ period, cells })
	}

	return { title, subtitle, days, periods: calendar.periodsPerDay, rows }
}
