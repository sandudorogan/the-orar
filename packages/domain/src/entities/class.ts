import { z } from "zod"

export const ClassSchema = z.object({
	id: z.string().uuid(),
	name: z.string().min(1),
	shortName: z.string().min(1).max(10),
	year: z.number().int().min(1).optional(),
	studentCount: z.number().int().min(0).optional(),
})

export type Class = z.infer<typeof ClassSchema>

export function createClass(
	data: Pick<Class, "name" | "shortName"> & Partial<Pick<Class, "id" | "year" | "studentCount">>,
): Class {
	return ClassSchema.parse({
		id: data.id ?? crypto.randomUUID(),
		name: data.name,
		shortName: data.shortName,
		year: data.year,
		studentCount: data.studentCount,
	})
}
