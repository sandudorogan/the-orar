import { z } from "zod"

export const TeacherSchema = z.object({
	id: z.string().uuid(),
	name: z.string().min(1),
	shortName: z.string().min(1).max(10),
	email: z.string().email().optional(),
	maxHoursPerDay: z.number().int().min(1).max(20).optional(),
	maxHoursPerWeek: z.number().int().min(1).max(60).optional(),
})

export type Teacher = z.infer<typeof TeacherSchema>

export function createTeacher(
	data: Pick<Teacher, "name" | "shortName"> &
		Partial<Pick<Teacher, "id" | "email" | "maxHoursPerDay" | "maxHoursPerWeek">>,
): Teacher {
	return TeacherSchema.parse({
		id: data.id ?? crypto.randomUUID(),
		name: data.name,
		shortName: data.shortName,
		email: data.email,
		maxHoursPerDay: data.maxHoursPerDay,
		maxHoursPerWeek: data.maxHoursPerWeek,
	})
}
