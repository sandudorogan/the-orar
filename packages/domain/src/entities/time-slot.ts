import { z } from "zod"
import { DayOfWeek } from "./calendar.ts"

export const TimeSlotSchema = z.object({
	day: DayOfWeek,
	period: z.number().int().min(0),
})

export type TimeSlot = z.infer<typeof TimeSlotSchema>

export function createTimeSlot(day: DayOfWeek, period: number): TimeSlot {
	return TimeSlotSchema.parse({ day, period })
}

export function timeSlotKey(slot: TimeSlot): string {
	return `${slot.day}:${slot.period}`
}

export function parseTimeSlotKey(key: string): TimeSlot {
	const [day, periodStr] = key.split(":")
	return { day: day as TimeSlot["day"], period: Number(periodStr) }
}
