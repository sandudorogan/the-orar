import { z } from "zod"

export const ClassGroupSchema = z.object({
	id: z.string().uuid(),
	classId: z.string().uuid(),
	name: z.string().min(1),
	shortName: z.string().min(1).max(10),
	studentCount: z.number().int().min(0).optional(),
})

export type ClassGroup = z.infer<typeof ClassGroupSchema>

export function createClassGroup(
	data: Pick<ClassGroup, "classId" | "name" | "shortName"> &
		Partial<Pick<ClassGroup, "id" | "studentCount">>,
): ClassGroup {
	return ClassGroupSchema.parse({
		id: data.id ?? crypto.randomUUID(),
		classId: data.classId,
		name: data.name,
		shortName: data.shortName,
		studentCount: data.studentCount,
	})
}
