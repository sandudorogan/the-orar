import { z } from "zod"

export const ActivitySchema = z.object({
	id: z.string().uuid(),
	name: z.string().min(1),
	subjectName: z.string().min(1),
	teacherIds: z.array(z.string().uuid()).min(1),
	classGroupIds: z.array(z.string().uuid()).min(1),
	duration: z.number().int().min(1).max(10),
	totalPerWeek: z.number().int().min(1).max(20),
	splitConfig: z
		.object({
			isSplit: z.boolean(),
			parts: z.array(z.number().int().min(1)).optional(),
		})
		.default({ isSplit: false }),
	preferredRoomIds: z.array(z.string().uuid()).default([]),
	roomTags: z.array(z.string()).default([]),
})

export type Activity = z.infer<typeof ActivitySchema>

export function createActivity(
	data: Pick<Activity, "name" | "subjectName" | "teacherIds" | "classGroupIds"> &
		Partial<
			Pick<
				Activity,
				"id" | "duration" | "totalPerWeek" | "splitConfig" | "preferredRoomIds" | "roomTags"
			>
		>,
): Activity {
	return ActivitySchema.parse({
		id: data.id ?? crypto.randomUUID(),
		name: data.name,
		subjectName: data.subjectName,
		teacherIds: data.teacherIds,
		classGroupIds: data.classGroupIds,
		duration: data.duration ?? 1,
		totalPerWeek: data.totalPerWeek ?? 1,
		splitConfig: data.splitConfig ?? { isSplit: false },
		preferredRoomIds: data.preferredRoomIds ?? [],
		roomTags: data.roomTags ?? [],
	})
}

export function expandSplitActivity(activity: Activity): number[] {
	if (!activity.splitConfig.isSplit || !activity.splitConfig.parts?.length) {
		return Array(activity.totalPerWeek).fill(activity.duration) as number[]
	}
	return activity.splitConfig.parts
}
