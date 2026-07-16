import {
	type Assignment,
	type AvailabilityTargetValue,
	type AvailabilityTypeValue,
	type DayOfWeekType,
	type ScheduleProject,
	createActivity,
	createAssignment,
	createAvailabilityRule,
	createCalendar,
	createClass,
	createClassGroup,
	createClassroom,
	createInstitution,
	createScheduleProject,
	createTeacher,
	createTimeSlot,
} from "../entities/index.ts"
import { validateProject } from "../validation/index.ts"

export const ORAR_CSV_COLUMNS = [
	"record_type",
	"key",
	"name",
	"short_name",
	"parent_key",
	"kind",
	"active_days",
	"periods_per_day",
	"period_duration_minutes",
	"start_time",
	"year",
	"student_count",
	"is_whole_class",
	"email",
	"max_hours_per_day",
	"max_hours_per_week",
	"capacity",
	"building",
	"tags",
	"subject",
	"teacher_keys",
	"class_group_keys",
	"duration",
	"total_per_week",
	"split_parts",
	"preferred_room_keys",
	"room_tags",
	"availability_target_type",
	"availability_target_key",
	"availability_type",
	"time_slots",
	"assignment_activity_key",
	"assignment_day",
	"assignment_period",
	"assignment_room_key",
	"assignment_locked",
	"assignment_duration",
	"solver_seed",
	"solver_max_attempts",
	"solver_timeout_ms",
] as const

export const ORAR_CSV_HEADER = ORAR_CSV_COLUMNS.join(",")

const OPTIONAL_COLUMNS = new Set<string>(["is_whole_class"])

export const ORAR_CSV_AI_PROMPT = `Convert the attached or pasted school timetable data into Orar CSV v1.

Random Excel files are expected. The source may have multiple sheets, merged headers, Romanian or English labels, teacher initials, room names, weekly lesson counts, availability tables, or an already-created timetable. Infer the structure carefully, but output only valid Orar CSV.

Return only CSV, no Markdown, no explanations, no code fences. Use this exact header:
${ORAR_CSV_HEADER}

General conversion rules:
- Preserve every class/cohort, class group/subgroup, teacher, room, activity/subject requirement, availability rule, and explicit timetable placement found in the source.
- Use stable readable keys, lowercase snake_case, unique inside each record_type: class_9a, group_9a_all, teacher_popescu_ana, room_lab1, activity_math_9a.
- Do not use display names as references. Relationship columns must use keys created in this same CSV.
- Use | to separate multiple values inside one cell. Do not use commas inside list cells.
- Leave unknown optional fields empty. Do not guess emails, buildings, capacity, workload limits, or room tags unless present or clearly implied.
- Normalize Romanian/English day names to: monday, tuesday, wednesday, thursday, friday, saturday, sunday.
- Period indexes are zero-based. If a spreadsheet labels periods 1..7, output 0..6.
- Numeric columns must contain only integers. Boolean assignment_locked must be true or false.
- If a cell needs commas, quotes, or line breaks, escape it as RFC 4180 CSV.

Record type schema:
- project: one row. key required. name = institution/project name. kind = school or university.
- calendar: one row. active_days = monday|tuesday|...; periods_per_day integer; period_duration_minutes integer; start_time HH:MM.
- class: one row per cohort/class. key, name, short_name required. year and student_count optional.
- group: one row per subgroup. key, name, short_name, parent_key required. parent_key references a class key. If the source has no subgroups, create one all-students group per class, such as group_9a_all. Set is_whole_class to true for any group that contains all students of its class (including generated all-students groups); leave it empty for partial subgroups.
- teacher: one row per teacher. key, name, short_name required. email, max_hours_per_day, max_hours_per_week optional.
- classroom: one row per room. key, name, short_name required. capacity, building, tags optional. tags use values like lab|sports|computer.
- activity: one row per scheduling demand. key, name, subject, teacher_keys, class_group_keys, duration, total_per_week required. teacher_keys references teacher rows. class_group_keys references group rows. preferred_room_keys references classroom rows. room_tags lists acceptable tags. split_parts is optional, such as 1|1|1 or 2|1.
- availability: one row per unavailable/preferred rule. availability_target_type is teacher, class, classGroup, or classroom. availability_target_key references the matching key type. availability_type is unavailable or preferred. time_slots uses day:zero_based_period values, such as monday:0|monday:1.
- assignment: assignment rows only if the source contains an actual timetable with placed lessons. assignment_activity_key references an activity key. assignment_day and assignment_period are required. assignment_room_key references a classroom key if known. assignment_locked should be true for imported timetable placements. assignment_duration should match the placed activity duration.
- solver: optional metadata only if present in the source; otherwise omit.

Activity extraction rules:
- A subject taught to two classes is usually two activity rows, one per class/group, unless the source clearly says they meet together.
- If a teacher teaches multiple groups for the same subject, keep all referenced group keys in class_group_keys only when the lesson is joint.
- total_per_week is the number of weekly occurrences or hours from the curriculum table. duration is periods per occurrence; use 1 unless a double period or block is explicitly shown.
- Never invent schedule assignments unless the source file contains an explicit timetable. If the file only contains curriculum, teachers, rooms, or constraints, output no assignment rows.`

export type OrarCsvRecordType =
	| "project"
	| "calendar"
	| "class"
	| "group"
	| "teacher"
	| "classroom"
	| "activity"
	| "availability"
	| "assignment"
	| "solver"

export type ParsedCsvRow = Record<(typeof ORAR_CSV_COLUMNS)[number], string> & {
	rowNumber: number
}

export interface OrarCsvSummary {
	classes: number
	classGroups: number
	teachers: number
	classrooms: number
	activities: number
	availabilityRules: number
	assignments: number
}

export interface OrarCsvImportResult {
	project: ScheduleProject
	assignments: Assignment[]
	summary: OrarCsvSummary
	warnings: string[]
}

export interface OrarCsvErrorDetail {
	row: number
	column: string
	message: string
}

export class OrarCsvValidationError extends Error {
	constructor(public readonly errors: OrarCsvErrorDetail[]) {
		super(errors.map((e) => `row ${e.row}, column ${e.column}: ${e.message}`).join("\n"))
		this.name = "OrarCsvValidationError"
	}
}

const recordTypes = new Set<OrarCsvRecordType>([
	"project",
	"calendar",
	"class",
	"group",
	"teacher",
	"classroom",
	"activity",
	"availability",
	"assignment",
	"solver",
])

const days = new Set<DayOfWeekType>([
	"monday",
	"tuesday",
	"wednesday",
	"thursday",
	"friday",
	"saturday",
	"sunday",
])

const availabilityTargets = new Set<AvailabilityTargetValue>([
	"teacher",
	"class",
	"classGroup",
	"classroom",
])

const availabilityTypes = new Set<AvailabilityTypeValue>(["unavailable", "preferred"])

export function parseOrarCsv(text: string): ParsedCsvRow[] {
	const table = parseCsv(text)
	if (table.length === 0) {
		throw new OrarCsvValidationError([{ row: 1, column: "header", message: "CSV is empty" }])
	}

	const header = table[0] ?? []
	const missing = ORAR_CSV_COLUMNS.filter(
		(column) => !OPTIONAL_COLUMNS.has(column) && !header.includes(column),
	)
	if (missing.length > 0) {
		throw new OrarCsvValidationError([
			{ row: 1, column: "header", message: `missing header columns: ${missing.join(", ")}` },
		])
	}

	const indexByColumn = new Map(header.map((column, index) => [column, index]))
	const errors: OrarCsvErrorDetail[] = []
	const rows: ParsedCsvRow[] = []

	for (let i = 1; i < table.length; i++) {
		const fields = table[i] ?? []
		if (fields.every((field) => field.trim() === "")) continue

		const extraFields = fields.slice(header.length).filter((field) => field.trim() !== "")
		if (extraFields.length > 0) {
			errors.push({
				row: i + 1,
				column: "row",
				message: `expected ${header.length} columns, found ${fields.length}`,
			})
		}

		const row = { rowNumber: i + 1 } as ParsedCsvRow
		for (const column of ORAR_CSV_COLUMNS) {
			const index = indexByColumn.get(column)
			row[column] = index === undefined ? "" : (fields[index] ?? "").trim()
		}
		rows.push(row)
	}

	if (errors.length > 0) throw new OrarCsvValidationError(errors)
	return rows
}

export function buildProjectFromOrarCsv(text: string): OrarCsvImportResult {
	const rows = parseOrarCsv(text)
	const errors: OrarCsvErrorDetail[] = []
	const warnings: string[] = []
	const ids = new Map<string, string>()

	const byType = new Map<OrarCsvRecordType, ParsedCsvRow[]>()
	for (const row of rows) {
		const type = row.record_type as OrarCsvRecordType
		if (!recordTypes.has(type)) {
			errors.push({
				row: row.rowNumber,
				column: "record_type",
				message: `invalid record type "${row.record_type}"`,
			})
			continue
		}
		byType.set(type, [...(byType.get(type) ?? []), row])
		if (row.key) {
			const scopedKey = `${type}:${row.key}`
			if (ids.has(scopedKey)) {
				errors.push({
					row: row.rowNumber,
					column: "key",
					message: `duplicate key "${row.key}" for ${type}`,
				})
			} else {
				ids.set(scopedKey, stableUuid(scopedKey))
			}
		}
	}

	const projectRow = singleRow(byType, "project", errors)
	const calendarRow = singleRow(byType, "calendar", errors)
	if (!projectRow || !calendarRow || errors.length > 0) throw new OrarCsvValidationError(errors)

	const institutionType = parseInstitutionType(projectRow, errors)
	const activeDays = parseDays(calendarRow, "active_days", true, errors)
	const periodsPerDay = parseInteger(calendarRow, "periods_per_day", true, errors)
	const periodDurationMinutes = parseInteger(calendarRow, "period_duration_minutes", true, errors)
	const projectName = requireCell(projectRow, "name", errors)
	const calendarName = calendarRow.name || "Imported Calendar"
	const startTime = /^\d{2}:\d{2}$/.test(calendarRow.start_time) ? calendarRow.start_time : "08:00"
	if (calendarRow.start_time && startTime !== calendarRow.start_time) {
		errors.push({
			row: calendarRow.rowNumber,
			column: "start_time",
			message: `invalid start time "${calendarRow.start_time}"`,
		})
	}

	const institution = createInstitution({
		id: stableUuid(`institution:${projectRow.key || projectName}`),
		name: projectName,
		type: institutionType,
	})
	const calendar = createCalendar({
		id: idFor(calendarRow, "calendar"),
		name: calendarName,
		activeDays: activeDays.length > 0 ? activeDays : ["monday"],
		periodsPerDay: periodsPerDay ?? 1,
		periodDurationMinutes: periodDurationMinutes ?? 50,
		startTime,
	})
	const project = createScheduleProject({
		id: idFor(projectRow, "project"),
		name: projectName,
		calendar,
		institution,
		institutionId: institution.id,
	})

	const classIds = new Map<string, string>()
	for (const row of byType.get("class") ?? []) {
		const name = requireCell(row, "name", errors)
		const shortName = requireCell(row, "short_name", errors)
		const cls = createClass({
			id: idFor(row, "class"),
			name,
			shortName,
			year: parseInteger(row, "year", false, errors),
			studentCount: parseInteger(row, "student_count", false, errors),
		})
		project.classes.push(cls)
		classIds.set(row.key, cls.id)
	}

	const groupIds = new Map<string, string>()
	for (const row of byType.get("group") ?? []) {
		const classId = ref(row, "parent_key", classIds, "class", errors)
		const group = createClassGroup({
			id: idFor(row, "group"),
			classId,
			name: requireCell(row, "name", errors),
			shortName: requireCell(row, "short_name", errors),
			studentCount: parseInteger(row, "student_count", false, errors),
			isWholeClass: row.is_whole_class.trim().toLowerCase() === "true",
		})
		project.classGroups.push(group)
		groupIds.set(row.key, group.id)
	}

	const groupCountByClass = new Map<string, number>()
	for (const group of project.classGroups) {
		groupCountByClass.set(group.classId, (groupCountByClass.get(group.classId) ?? 0) + 1)
	}
	for (const group of project.classGroups) {
		if (groupCountByClass.get(group.classId) === 1) group.isWholeClass = true
	}

	const teacherIds = new Map<string, string>()
	for (const row of byType.get("teacher") ?? []) {
		const email = optionalCell(row, "email")
		if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			errors.push({ row: row.rowNumber, column: "email", message: `invalid email "${email}"` })
		}
		const teacher = createTeacher({
			id: idFor(row, "teacher"),
			name: requireCell(row, "name", errors),
			shortName: requireCell(row, "short_name", errors),
			email: email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : undefined,
			maxHoursPerDay: parseInteger(row, "max_hours_per_day", false, errors),
			maxHoursPerWeek: parseInteger(row, "max_hours_per_week", false, errors),
		})
		project.teachers.push(teacher)
		teacherIds.set(row.key, teacher.id)
	}

	const roomIds = new Map<string, string>()
	for (const row of byType.get("classroom") ?? []) {
		const room = createClassroom({
			id: idFor(row, "classroom"),
			name: requireCell(row, "name", errors),
			shortName: requireCell(row, "short_name", errors),
			capacity: parseInteger(row, "capacity", false, errors),
			building: optionalCell(row, "building"),
			tags: parseList(row.tags),
		})
		project.classrooms.push(room)
		roomIds.set(row.key, room.id)
	}

	const activityIds = new Map<string, string>()
	for (const row of byType.get("activity") ?? []) {
		const teacherRefs = refs(row, "teacher_keys", teacherIds, "teacher", errors)
		const groupRefs = refs(row, "class_group_keys", groupIds, "class group", errors)
		const roomRefs = refs(row, "preferred_room_keys", roomIds, "classroom", errors)
		const splitParts = parseIntegerList(row, "split_parts", errors)
		const activity = createActivity({
			id: idFor(row, "activity"),
			name: requireCell(row, "name", errors),
			subjectName: requireCell(row, "subject", errors),
			teacherIds: teacherRefs,
			classGroupIds: groupRefs,
			duration: parseInteger(row, "duration", true, errors),
			totalPerWeek: parseInteger(row, "total_per_week", true, errors),
			splitConfig:
				splitParts.length > 0 ? { isSplit: true, parts: splitParts } : { isSplit: false },
			preferredRoomIds: roomRefs,
			roomTags: parseList(row.room_tags),
		})
		project.activities.push(activity)
		activityIds.set(row.key, activity.id)
	}

	for (const row of byType.get("availability") ?? []) {
		const targetType = parseAvailabilityTargetValue(row, errors)
		const targetMap = targetMapFor(targetType, classIds, groupIds, teacherIds, roomIds)
		project.availabilityRules.push(
			createAvailabilityRule({
				id: idFor(row, "availability"),
				targetType,
				targetId: ref(row, "availability_target_key", targetMap, targetType, errors),
				type: parseAvailabilityTypeValue(row, errors),
				timeSlots: parseTimeSlots(row, "time_slots", errors),
			}),
		)
	}

	const assignments: Assignment[] = []
	for (const row of byType.get("assignment") ?? []) {
		assignments.push(
			createAssignment({
				activityId: ref(row, "assignment_activity_key", activityIds, "activity", errors),
				timeSlot: parseAssignmentSlot(row, errors),
				roomId: optionalRef(row, "assignment_room_key", roomIds, "classroom", errors),
				locked: parseBoolean(row.assignment_locked),
				duration: parseInteger(row, "assignment_duration", false, errors) ?? 1,
			}),
		)
	}

	for (const issue of validateProject(project)) {
		if (issue.severity === "error") {
			errors.push({ row: 0, column: issue.entity, message: issue.message })
		} else {
			warnings.push(issue.message)
		}
	}

	if (errors.length > 0) throw new OrarCsvValidationError(errors)

	return {
		project,
		assignments,
		summary: {
			classes: project.classes.length,
			classGroups: project.classGroups.length,
			teachers: project.teachers.length,
			classrooms: project.classrooms.length,
			activities: project.activities.length,
			availabilityRules: project.availabilityRules.length,
			assignments: assignments.length,
		},
		warnings,
	}
}

export function exportProjectToOrarCsv(
	project: ScheduleProject,
	assignments: Assignment[] = [],
	solverConfig?: { seed?: number; maxAttempts?: number; timeoutMs?: number },
): string {
	const rows: string[][] = [ORAR_CSV_COLUMNS.map((column) => column)]
	const push = (
		values: Partial<Record<(typeof ORAR_CSV_COLUMNS)[number], string | number | boolean>>,
	) => {
		rows.push(ORAR_CSV_COLUMNS.map((column) => String(values[column] ?? "")))
	}

	push({
		record_type: "project",
		key: project.id,
		name: project.name,
		kind: project.institution.type,
	})
	push({
		record_type: "calendar",
		key: project.calendar.id,
		name: project.calendar.name,
		active_days: project.calendar.activeDays.join("|"),
		periods_per_day: project.calendar.periodsPerDay,
		period_duration_minutes: project.calendar.periodDurationMinutes,
		start_time: project.calendar.startTime,
	})
	for (const cls of project.classes) {
		push({
			record_type: "class",
			key: cls.id,
			name: cls.name,
			short_name: cls.shortName,
			year: cls.year,
			student_count: cls.studentCount,
		})
	}
	for (const group of project.classGroups) {
		push({
			record_type: "group",
			key: group.id,
			name: group.name,
			short_name: group.shortName,
			parent_key: group.classId,
			student_count: group.studentCount,
			is_whole_class: group.isWholeClass,
		})
	}
	for (const teacher of project.teachers) {
		push({
			record_type: "teacher",
			key: teacher.id,
			name: teacher.name,
			short_name: teacher.shortName,
			email: teacher.email,
			max_hours_per_day: teacher.maxHoursPerDay,
			max_hours_per_week: teacher.maxHoursPerWeek,
		})
	}
	for (const room of project.classrooms) {
		push({
			record_type: "classroom",
			key: room.id,
			name: room.name,
			short_name: room.shortName,
			capacity: room.capacity,
			building: room.building,
			tags: room.tags.join("|"),
		})
	}
	for (const activity of project.activities) {
		push({
			record_type: "activity",
			key: activity.id,
			name: activity.name,
			kind: activity.subjectName.toLowerCase().replace(/\s+/g, "_"),
			subject: activity.subjectName,
			teacher_keys: activity.teacherIds.join("|"),
			class_group_keys: activity.classGroupIds.join("|"),
			duration: activity.duration,
			total_per_week: activity.totalPerWeek,
			split_parts: activity.splitConfig.parts?.join("|") ?? "",
			preferred_room_keys: activity.preferredRoomIds.join("|"),
			room_tags: activity.roomTags.join("|"),
		})
	}
	for (const rule of project.availabilityRules) {
		push({
			record_type: "availability",
			key: rule.id,
			availability_target_type: rule.targetType,
			availability_target_key: rule.targetId,
			availability_type: rule.type,
			time_slots: rule.timeSlots.map((slot) => `${slot.day}:${slot.period}`).join("|"),
		})
	}
	for (const assignment of assignments) {
		push({
			record_type: "assignment",
			assignment_activity_key: assignment.activityId,
			assignment_day: assignment.timeSlot.day,
			assignment_period: assignment.timeSlot.period,
			assignment_room_key: assignment.roomId,
			assignment_locked: assignment.locked,
			assignment_duration: assignment.duration,
		})
	}
	if (solverConfig) {
		push({
			record_type: "solver",
			key: "default",
			solver_seed: solverConfig.seed,
			solver_max_attempts: solverConfig.maxAttempts,
			solver_timeout_ms: solverConfig.timeoutMs,
		})
	}

	return rows.map((row) => row.map(escapeCsvCell).join(",")).join("\n")
}

function singleRow(
	byType: Map<OrarCsvRecordType, ParsedCsvRow[]>,
	type: OrarCsvRecordType,
	errors: OrarCsvErrorDetail[],
): ParsedCsvRow | undefined {
	const rows = byType.get(type) ?? []
	if (rows.length === 0)
		errors.push({ row: 0, column: "record_type", message: `missing ${type} row` })
	if (rows.length > 1) {
		errors.push({
			row: rows[1]!.rowNumber,
			column: "record_type",
			message: `duplicate ${type} row`,
		})
	}
	return rows[0]
}

function requireCell(
	row: ParsedCsvRow,
	column: (typeof ORAR_CSV_COLUMNS)[number],
	errors: OrarCsvErrorDetail[],
): string {
	const value = row[column]
	if (!value) errors.push({ row: row.rowNumber, column, message: "required value is missing" })
	return value
}

function optionalCell(
	row: ParsedCsvRow,
	column: (typeof ORAR_CSV_COLUMNS)[number],
): string | undefined {
	return row[column] || undefined
}

function parseInteger(
	row: ParsedCsvRow,
	column: (typeof ORAR_CSV_COLUMNS)[number],
	required: boolean,
	errors: OrarCsvErrorDetail[],
): number | undefined {
	const value = row[column]
	if (!value) {
		if (required) errors.push({ row: row.rowNumber, column, message: "required number is missing" })
		return undefined
	}
	const number = Number(value)
	if (!Number.isInteger(number)) {
		errors.push({ row: row.rowNumber, column, message: `invalid integer "${value}"` })
		return undefined
	}
	return number
}

function parseIntegerList(
	row: ParsedCsvRow,
	column: (typeof ORAR_CSV_COLUMNS)[number],
	errors: OrarCsvErrorDetail[],
): number[] {
	return parseList(row[column]).flatMap((value) => {
		const number = Number(value)
		if (!Number.isInteger(number)) {
			errors.push({ row: row.rowNumber, column, message: `invalid integer "${value}"` })
			return []
		}
		return [number]
	})
}

function parseList(value: string): string[] {
	return value
		.split("|")
		.map((part) => part.trim())
		.filter(Boolean)
}

function refs(
	row: ParsedCsvRow,
	column: (typeof ORAR_CSV_COLUMNS)[number],
	map: Map<string, string>,
	label: string,
	errors: OrarCsvErrorDetail[],
): string[] {
	const values = parseList(row[column])
	if (values.length === 0) {
		errors.push({ row: row.rowNumber, column, message: `at least one ${label} key is required` })
		return [stableUuid(`invalid:${label}:${row.rowNumber}`)]
	}
	return values.map((value) => {
		const id = map.get(value)
		if (!id) {
			errors.push({ row: row.rowNumber, column, message: `unknown ${label} key "${value}"` })
			return stableUuid(`invalid:${label}:${value}`)
		}
		return id
	})
}

function ref(
	row: ParsedCsvRow,
	column: (typeof ORAR_CSV_COLUMNS)[number],
	map: Map<string, string>,
	label: string,
	errors: OrarCsvErrorDetail[],
): string {
	const value = requireCell(row, column, errors)
	const id = map.get(value)
	if (!id) errors.push({ row: row.rowNumber, column, message: `unknown ${label} key "${value}"` })
	return id ?? stableUuid(`invalid:${label}:${value}`)
}

function optionalRef(
	row: ParsedCsvRow,
	column: (typeof ORAR_CSV_COLUMNS)[number],
	map: Map<string, string>,
	label: string,
	errors: OrarCsvErrorDetail[],
): string | undefined {
	if (!row[column]) return undefined
	return ref(row, column, map, label, errors)
}

function parseDays(
	row: ParsedCsvRow,
	column: (typeof ORAR_CSV_COLUMNS)[number],
	required: boolean,
	errors: OrarCsvErrorDetail[],
): DayOfWeekType[] {
	const values = parseList(row[column])
	if (required && values.length === 0) {
		errors.push({ row: row.rowNumber, column, message: "at least one day is required" })
	}
	return values.flatMap((value) => {
		if (!days.has(value as DayOfWeekType)) {
			errors.push({ row: row.rowNumber, column, message: `invalid day "${value}"` })
			return []
		}
		return [value as DayOfWeekType]
	})
}

function parseTimeSlots(
	row: ParsedCsvRow,
	column: (typeof ORAR_CSV_COLUMNS)[number],
	errors: OrarCsvErrorDetail[],
) {
	const values = parseList(row[column])
	if (values.length === 0) {
		errors.push({ row: row.rowNumber, column, message: "at least one time slot is required" })
	}
	return values.flatMap((value) => {
		const [day, period] = value.split(":")
		if (
			!day ||
			period === undefined ||
			!days.has(day as DayOfWeekType) ||
			!Number.isInteger(Number(period))
		) {
			errors.push({ row: row.rowNumber, column, message: `invalid time slot "${value}"` })
			return []
		}
		return [createTimeSlot(day as DayOfWeekType, Number(period))]
	})
}

function parseAssignmentSlot(row: ParsedCsvRow, errors: OrarCsvErrorDetail[]) {
	const day = row.assignment_day
	const period = parseInteger(row, "assignment_period", true, errors)
	if (!days.has(day as DayOfWeekType)) {
		errors.push({ row: row.rowNumber, column: "assignment_day", message: `invalid day "${day}"` })
	}
	return createTimeSlot(
		(days.has(day as DayOfWeekType) ? day : "monday") as DayOfWeekType,
		period ?? 0,
	)
}

function parseInstitutionType(
	row: ParsedCsvRow,
	errors: OrarCsvErrorDetail[],
): "school" | "university" {
	if (row.kind === "school" || row.kind === "university") return row.kind
	errors.push({
		row: row.rowNumber,
		column: "kind",
		message: `invalid institution type "${row.kind}"`,
	})
	return "school"
}

function parseAvailabilityTargetValue(
	row: ParsedCsvRow,
	errors: OrarCsvErrorDetail[],
): AvailabilityTargetValue {
	if (availabilityTargets.has(row.availability_target_type as AvailabilityTargetValue)) {
		return row.availability_target_type as AvailabilityTargetValue
	}
	errors.push({
		row: row.rowNumber,
		column: "availability_target_type",
		message: `invalid availability target "${row.availability_target_type}"`,
	})
	return "teacher"
}

function parseAvailabilityTypeValue(
	row: ParsedCsvRow,
	errors: OrarCsvErrorDetail[],
): AvailabilityTypeValue {
	if (availabilityTypes.has(row.availability_type as AvailabilityTypeValue)) {
		return row.availability_type as AvailabilityTypeValue
	}
	errors.push({
		row: row.rowNumber,
		column: "availability_type",
		message: `invalid availability type "${row.availability_type}"`,
	})
	return "unavailable"
}

function targetMapFor(
	target: AvailabilityTargetValue,
	classIds: Map<string, string>,
	groupIds: Map<string, string>,
	teacherIds: Map<string, string>,
	roomIds: Map<string, string>,
) {
	if (target === "class") return classIds
	if (target === "classGroup") return groupIds
	if (target === "classroom") return roomIds
	return teacherIds
}

function parseBoolean(value: string): boolean {
	return value.toLowerCase() === "true" || value === "1" || value.toLowerCase() === "yes"
}

function idFor(row: ParsedCsvRow, type: OrarCsvRecordType): string {
	if (isUuid(row.key)) return row.key.toLowerCase()
	return stableUuid(`${type}:${row.key || row.rowNumber}`)
}

function stableUuid(value: string): string {
	if (isUuid(value)) {
		return value.toLowerCase()
	}

	let h1 = 0x811c9dc5
	let h2 = 0x01000193
	for (let i = 0; i < value.length; i++) {
		h1 ^= value.charCodeAt(i)
		h1 = Math.imul(h1, 0x01000193)
		h2 ^= value.charCodeAt(value.length - i - 1)
		h2 = Math.imul(h2, 0x811c9dc5)
	}
	const hex = [h1, h2, h1 ^ h2, Math.imul(h1, h2)]
		.map((part) => (part >>> 0).toString(16).padStart(8, "0"))
		.join("")
	return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`
}

function isUuid(value: string): boolean {
	return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function parseCsv(text: string): string[][] {
	const rows: string[][] = []
	let row: string[] = []
	let field = ""
	let quoted = false

	for (let i = 0; i < text.length; i++) {
		const char = text[i]
		const next = text[i + 1]

		if (quoted) {
			if (char === '"' && next === '"') {
				field += '"'
				i++
			} else if (char === '"') {
				quoted = false
			} else {
				field += char
			}
			continue
		}

		if (char === '"') {
			quoted = true
		} else if (char === ",") {
			row.push(field)
			field = ""
		} else if (char === "\n") {
			row.push(field)
			rows.push(row)
			row = []
			field = ""
		} else if (char !== "\r") {
			field += char
		}
	}

	row.push(field)
	rows.push(row)
	return rows
}

function escapeCsvCell(value: string): string {
	if (/[",\n\r]/.test(value)) return `"${value.replaceAll('"', '""')}"`
	return value
}
