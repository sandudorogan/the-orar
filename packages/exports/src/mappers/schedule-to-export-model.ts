import type { Activity, Assignment, Calendar, ClassGroup, Classroom, Teacher } from "@orar/domain"
import { type Locale, getCatalog, translateDayName } from "@orar/locales"

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
	periodLabel: string
	rows: ExportTimetableRow[]
}

export function buildTeacherExportModel(
	teacher: Teacher,
	calendar: Calendar,
	assignments: Assignment[],
	activities: Activity[],
	classGroups: ClassGroup[],
	classrooms: Classroom[],
	locale: Locale = "en",
): ExportScheduleModel {
	const catalog = getCatalog(locale)
	const teacherAssignments = assignments.filter((a) => {
		const act = activities.find((act) => act.id === a.activityId)
		return act?.teacherIds.includes(teacher.id)
	})

	return buildExportModel(
		teacher.name,
		catalog.exports.perTeacher,
		calendar,
		teacherAssignments,
		activities,
		classGroups,
		classrooms,
		[],
		locale,
		catalog.timetables.period,
	)
}

export function buildClassGroupExportModel(
	group: ClassGroup,
	calendar: Calendar,
	assignments: Assignment[],
	activities: Activity[],
	teachers: Teacher[],
	classrooms: Classroom[],
	locale: Locale = "en",
): ExportScheduleModel {
	const catalog = getCatalog(locale)
	const groupAssignments = assignments.filter((a) => {
		const act = activities.find((act) => act.id === a.activityId)
		return act?.classGroupIds.includes(group.id)
	})

	return buildExportModel(
		group.name,
		catalog.exports.perClass,
		calendar,
		groupAssignments,
		activities,
		[],
		classrooms,
		teachers,
		locale,
		catalog.timetables.period,
	)
}

export function buildClassroomExportModel(
	classroom: Classroom,
	calendar: Calendar,
	assignments: Assignment[],
	activities: Activity[],
	teachers: Teacher[],
	classGroups: ClassGroup[],
	locale: Locale = "en",
): ExportScheduleModel {
	const catalog = getCatalog(locale)
	const roomAssignments = assignments.filter((a) => a.roomId === classroom.id)

	return buildExportModel(
		classroom.name,
		catalog.exports.perClassroom,
		calendar,
		roomAssignments,
		activities,
		classGroups,
		[],
		teachers,
		locale,
		catalog.timetables.period,
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
	locale: Locale = "en",
	periodLabel = "Period",
): ExportScheduleModel {
	const days = calendar.activeDays.map((d) => translateDayName(d, locale))
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
					teacherNames:
						teachers.length > 0
							? (activity?.teacherIds.map(
									(id) => teachers.find((t) => t.id === id)?.shortName ?? id,
								) ?? [])
							: [],
					classGroupNames:
						classGroups.length > 0
							? (activity?.classGroupIds.map(
									(id) => classGroups.find((g) => g.id === id)?.shortName ?? id,
								) ?? [])
							: [],
					roomName: a.roomId ? classrooms.find((r) => r.id === a.roomId)?.shortName : undefined,
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

	return { title, subtitle, days, periods: calendar.periodsPerDay, periodLabel, rows }
}
