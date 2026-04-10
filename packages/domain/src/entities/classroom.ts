import { z } from "zod"

export const ClassroomSchema = z.object({
	id: z.string().uuid(),
	name: z.string().min(1),
	shortName: z.string().min(1).max(10),
	capacity: z.number().int().min(0).optional(),
	building: z.string().optional(),
	tags: z.array(z.string()).default([]),
})

export type Classroom = z.infer<typeof ClassroomSchema>

export function createClassroom(
	data: Pick<Classroom, "name" | "shortName"> &
		Partial<Pick<Classroom, "id" | "capacity" | "building" | "tags">>,
): Classroom {
	return ClassroomSchema.parse({
		id: data.id ?? crypto.randomUUID(),
		name: data.name,
		shortName: data.shortName,
		capacity: data.capacity,
		building: data.building,
		tags: data.tags ?? [],
	})
}
