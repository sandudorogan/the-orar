import { z } from "zod"
import type { Activity } from "../entities/activity.ts"
import type { Assignment } from "../entities/assignment.ts"
import type { AvailabilityRule } from "../entities/availability-rule.ts"
import type { Calendar } from "../entities/calendar.ts"
import type { ClassGroup } from "../entities/class-group.ts"
import type { Class } from "../entities/class.ts"
import type { Classroom } from "../entities/classroom.ts"
import type { Teacher } from "../entities/teacher.ts"
import type { TimeSlot } from "../entities/time-slot.ts"

export interface ScheduleContext {
	calendar: Calendar
	classes: Class[]
	classGroups: ClassGroup[]
	teachers: Teacher[]
	classrooms: Classroom[]
	activities: Activity[]
	availabilityRules: AvailabilityRule[]
	assignments: Assignment[]
}

export const ConstraintWeight = z.enum(["hard", "soft"])
export type ConstraintWeight = z.infer<typeof ConstraintWeight>

export interface ConstraintViolation {
	constraintId: string
	constraintType: string
	weight: ConstraintWeight
	activityIds: string[]
	timeSlot?: TimeSlot
	description: string
}

export interface Constraint {
	id: string
	type: string
	weight: ConstraintWeight
	evaluate(context: ScheduleContext): ConstraintViolation[]
}
