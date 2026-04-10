import type {
	Activity,
	AvailabilityRule,
	Calendar,
	ClassGroup,
	Classroom,
	Teacher,
	TimeSlot,
} from "@orar/domain"
import { timeSlotKey } from "@orar/domain"

export interface PreparedProblem {
	activities: PreparedActivity[]
	allSlots: TimeSlot[]
	slotCount: number
}

export interface PreparedActivity {
	activity: Activity
	duration: number
	availableSlots: TimeSlot[]
	compatibleRooms: Classroom[]
}

export function prepareProblem(
	calendar: Calendar,
	activities: Activity[],
	teachers: Teacher[],
	classGroups: ClassGroup[],
	classrooms: Classroom[],
	availabilityRules: AvailabilityRule[],
): PreparedProblem {
	const allSlots = generateAllSlots(calendar)

	const unavailableMap = buildUnavailableMap(availabilityRules)

	const prepared = activities.flatMap((activity) => {
		const parts = expandActivity(activity)
		return parts.map((duration) => {
			const availableSlots = computeAvailableSlots(
				allSlots,
				activity,
				unavailableMap,
				calendar.periodsPerDay,
				duration,
			)
			const compatibleRooms = findCompatibleRooms(activity, classrooms)
			return { activity, duration, availableSlots, compatibleRooms }
		})
	})

	prepared.sort((a, b) => a.availableSlots.length - b.availableSlots.length)

	return {
		activities: prepared,
		allSlots,
		slotCount: allSlots.length,
	}
}

function generateAllSlots(calendar: Calendar): TimeSlot[] {
	const slots: TimeSlot[] = []
	for (const day of calendar.activeDays) {
		for (let period = 0; period < calendar.periodsPerDay; period++) {
			slots.push({ day, period })
		}
	}
	return slots
}

function buildUnavailableMap(rules: AvailabilityRule[]): Map<string, Set<string>> {
	const map = new Map<string, Set<string>>()
	for (const rule of rules) {
		if (rule.type !== "unavailable") continue
		const set = map.get(rule.targetId) ?? new Set()
		for (const slot of rule.timeSlots) {
			set.add(timeSlotKey(slot))
		}
		map.set(rule.targetId, set)
	}
	return map
}

function computeAvailableSlots(
	allSlots: TimeSlot[],
	activity: Activity,
	unavailableMap: Map<string, Set<string>>,
	periodsPerDay: number,
	duration: number,
): TimeSlot[] {
	return allSlots.filter((slot) => {
		if (slot.period + duration > periodsPerDay) return false

		const key = timeSlotKey(slot)

		for (const teacherId of activity.teacherIds) {
			if (unavailableMap.get(teacherId)?.has(key)) return false
		}

		for (const groupId of activity.classGroupIds) {
			if (unavailableMap.get(groupId)?.has(key)) return false
		}

		return true
	})
}

function findCompatibleRooms(activity: Activity, classrooms: Classroom[]): Classroom[] {
	if (activity.preferredRoomIds.length > 0) {
		const preferred = classrooms.filter((r) => activity.preferredRoomIds.includes(r.id))
		if (preferred.length > 0) return preferred
	}

	if (activity.roomTags.length > 0) {
		return classrooms.filter((r) => activity.roomTags.some((tag) => r.tags.includes(tag)))
	}

	return classrooms
}

function expandActivity(activity: Activity): number[] {
	if (activity.splitConfig.isSplit && activity.splitConfig.parts?.length) {
		return activity.splitConfig.parts
	}
	return Array(activity.totalPerWeek).fill(activity.duration) as number[]
}
