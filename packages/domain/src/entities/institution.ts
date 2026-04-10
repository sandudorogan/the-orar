import { z } from "zod"

export const InstitutionSchema = z.object({
	id: z.string().uuid(),
	name: z.string().min(1),
	type: z.enum(["school", "university"]),
	createdAt: z.string().datetime(),
	updatedAt: z.string().datetime(),
})

export type Institution = z.infer<typeof InstitutionSchema>

export function createInstitution(
	data: Pick<Institution, "name" | "type"> & Partial<Pick<Institution, "id">>,
): Institution {
	const now = new Date().toISOString()
	return InstitutionSchema.parse({
		id: data.id ?? crypto.randomUUID(),
		name: data.name,
		type: data.type,
		createdAt: now,
		updatedAt: now,
	})
}
