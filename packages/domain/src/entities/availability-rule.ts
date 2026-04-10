import { z } from "zod"
import { TimeSlotSchema } from "./time-slot.ts"

export const AvailabilityType = z.enum(["unavailable", "preferred"])
export type AvailabilityType = z.infer<typeof AvailabilityType>

export const AvailabilityTarget = z.enum(["teacher", "class", "classGroup", "classroom"])
export type AvailabilityTarget = z.infer<typeof AvailabilityTarget>

export const AvailabilityRuleSchema = z.object({
	id: z.string().uuid(),
	targetType: AvailabilityTarget,
	targetId: z.string().uuid(),
	type: AvailabilityType,
	timeSlots: z.array(TimeSlotSchema).min(1),
})

export type AvailabilityRule = z.infer<typeof AvailabilityRuleSchema>

export function createAvailabilityRule(
	data: Pick<AvailabilityRule, "targetType" | "targetId" | "type" | "timeSlots"> &
		Partial<Pick<AvailabilityRule, "id">>,
): AvailabilityRule {
	return AvailabilityRuleSchema.parse({
		id: data.id ?? crypto.randomUUID(),
		...data,
	})
}
