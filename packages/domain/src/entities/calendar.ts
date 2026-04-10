import { z } from "zod"

export const DayOfWeek = z.enum([
	"monday",
	"tuesday",
	"wednesday",
	"thursday",
	"friday",
	"saturday",
	"sunday",
])
export type DayOfWeek = z.infer<typeof DayOfWeek>

export const CalendarSchema = z.object({
	id: z.string().uuid(),
	name: z.string().min(1),
	activeDays: z.array(DayOfWeek).min(1),
	periodsPerDay: z.number().int().min(1).max(20),
	periodDurationMinutes: z.number().int().min(5).max(180),
	startTime: z.string().regex(/^\d{2}:\d{2}$/),
})

export type Calendar = z.infer<typeof CalendarSchema>

export function createCalendar(
	data: Pick<Calendar, "name" | "activeDays" | "periodsPerDay"> &
		Partial<Pick<Calendar, "id" | "periodDurationMinutes" | "startTime">>,
): Calendar {
	return CalendarSchema.parse({
		id: data.id ?? crypto.randomUUID(),
		name: data.name,
		activeDays: data.activeDays,
		periodsPerDay: data.periodsPerDay,
		periodDurationMinutes: data.periodDurationMinutes ?? 50,
		startTime: data.startTime ?? "08:00",
	})
}
