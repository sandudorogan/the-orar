import { z } from "zod"
import { ActivitySchema } from "./activity.ts"
import { AvailabilityRuleSchema } from "./availability-rule.ts"
import { CalendarSchema } from "./calendar.ts"
import { ClassGroupSchema } from "./class-group.ts"
import { ClassSchema } from "./class.ts"
import { ClassroomSchema } from "./classroom.ts"
import { InstitutionSchema } from "./institution.ts"
import { TeacherSchema } from "./teacher.ts"

export const ScheduleProjectSchema = z.object({
	id: z.string().uuid(),
	institutionId: z.string().uuid(),
	name: z.string().min(1),
	calendar: CalendarSchema,
	institution: InstitutionSchema,
	classes: z.array(ClassSchema).default([]),
	classGroups: z.array(ClassGroupSchema).default([]),
	teachers: z.array(TeacherSchema).default([]),
	classrooms: z.array(ClassroomSchema).default([]),
	activities: z.array(ActivitySchema).default([]),
	availabilityRules: z.array(AvailabilityRuleSchema).default([]),
	createdAt: z.string().datetime(),
	updatedAt: z.string().datetime(),
})

export type ScheduleProject = z.infer<typeof ScheduleProjectSchema>

export function createScheduleProject(
	data: Pick<ScheduleProject, "name" | "calendar" | "institution"> &
		Partial<Pick<ScheduleProject, "id" | "institutionId">>,
): ScheduleProject {
	const now = new Date().toISOString()
	return ScheduleProjectSchema.parse({
		id: data.id ?? crypto.randomUUID(),
		institutionId: data.institutionId ?? data.institution.id,
		name: data.name,
		calendar: data.calendar,
		institution: data.institution,
		classes: [],
		classGroups: [],
		teachers: [],
		classrooms: [],
		activities: [],
		availabilityRules: [],
		createdAt: now,
		updatedAt: now,
	})
}
