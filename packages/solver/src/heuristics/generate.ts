import type { Assignment, TimeSlot } from "@orar/domain"
import { timeSlotKeysForSpan } from "@orar/domain"
import type { PreparedActivity, PreparedProblem } from "../preprocessing/prepare.ts"

export interface GenerationResult {
	assignments: Assignment[]
	fitness: number
	placedCount: number
	totalCount: number
	unplacedActivityIds: string[]
}

export interface GenerationOptions {
	seed?: number
	lockedAssignments?: Assignment[]
}

interface SlotUsage {
	teacher: Map<string, Set<string>>
	group: Map<string, Set<string>>
	classWhole: Map<string, Set<string>>
	classAny: Map<string, Set<string>>
	room: Map<string, Set<string>>
	activityDays: Map<string, Set<string>>
}

export function generate(
	problem: PreparedProblem,
	onProgress?: (placed: number, total: number) => void,
	shouldCancel?: () => boolean,
	options: GenerationOptions = {},
): GenerationResult {
	const assignments: Assignment[] = []
	const unplacedActivityIds: string[] = []
	const random = options.seed === undefined ? Math.random : createSeededRandom(options.seed)

	const usage: SlotUsage = {
		teacher: new Map(),
		group: new Map(),
		classWhole: new Map(),
		classAny: new Map(),
		room: new Map(),
		activityDays: new Map(),
	}

	const lockedAssignments = options.lockedAssignments ?? []
	const activitiesById = new Map(problem.activities.map((p) => [p.activity.id, p.activity]))
	for (const locked of lockedAssignments) {
		const activity = activitiesById.get(locked.activityId)
		if (!activity) continue
		const spanKeys = timeSlotKeysForSpan(locked.timeSlot, locked.duration ?? 1)
		for (const teacherId of activity.teacherIds) addUsed(usage.teacher, teacherId, spanKeys)
		for (const groupId of activity.classGroupIds) {
			addUsed(usage.group, groupId, spanKeys)
			const group = problem.groupsById.get(groupId)
			if (!group) continue
			addUsed(usage.classAny, group.classId, spanKeys)
			if (group.isWholeClass) addUsed(usage.classWhole, group.classId, spanKeys)
		}
		if (locked.roomId) addUsed(usage.room, locked.roomId, spanKeys)
		const days = usage.activityDays.get(locked.activityId) ?? new Set()
		days.add(locked.timeSlot.day)
		usage.activityDays.set(locked.activityId, days)
	}

	const lockedCounts = new Map<string, number>()
	for (const locked of lockedAssignments) {
		lockedCounts.set(locked.activityId, (lockedCounts.get(locked.activityId) ?? 0) + 1)
	}
	const remaining: PreparedActivity[] = []
	for (const prepared of problem.activities) {
		const count = lockedCounts.get(prepared.activity.id) ?? 0
		if (count > 0) {
			lockedCounts.set(prepared.activity.id, count - 1)
			continue
		}
		remaining.push(prepared)
	}

	const total = remaining.length
	let placed = 0
	let softPenalty = 0

	for (const prepared of remaining) {
		if (shouldCancel?.()) break

		const slot = pickBestSlot(prepared, problem, usage, random)
		if (!slot) {
			softPenalty += 100
			unplacedActivityIds.push(prepared.activity.id)
			continue
		}

		const room = pickRoom(prepared, slot, usage.room)

		assignments.push({
			activityId: prepared.activity.id,
			timeSlot: slot,
			roomId: room?.id,
			locked: false,
			duration: prepared.duration,
		})

		markUsed(prepared, problem, usage, slot, room?.id)

		placed++
		onProgress?.(placed, total)
	}

	const fitness = (placed / Math.max(total, 1)) * 100 - softPenalty * 0.01
	return {
		assignments,
		fitness: Math.max(0, fitness),
		placedCount: placed,
		totalCount: total,
		unplacedActivityIds,
	}
}

function markUsed(
	prepared: PreparedActivity,
	problem: PreparedProblem,
	usage: SlotUsage,
	slot: TimeSlot,
	roomId: string | undefined,
): void {
	const spanKeys = timeSlotKeysForSpan(slot, prepared.duration)
	for (const teacherId of prepared.activity.teacherIds) {
		addUsed(usage.teacher, teacherId, spanKeys)
	}
	for (const groupId of prepared.activity.classGroupIds) {
		addUsed(usage.group, groupId, spanKeys)
		const group = problem.groupsById.get(groupId)
		if (!group) continue
		addUsed(usage.classAny, group.classId, spanKeys)
		if (group.isWholeClass) addUsed(usage.classWhole, group.classId, spanKeys)
	}
	if (roomId) addUsed(usage.room, roomId, spanKeys)

	const days = usage.activityDays.get(prepared.activity.id) ?? new Set()
	days.add(slot.day)
	usage.activityDays.set(prepared.activity.id, days)
}

function addUsed(map: Map<string, Set<string>>, id: string, keys: string[]): void {
	const used = map.get(id) ?? new Set()
	for (const k of keys) used.add(k)
	map.set(id, used)
}

function pickBestSlot(
	prepared: PreparedActivity,
	problem: PreparedProblem,
	usage: SlotUsage,
	random: () => number,
): TimeSlot | null {
	const candidates = prepared.availableSlots.filter((slot) => {
		const spanKeys = timeSlotKeysForSpan(slot, prepared.duration)

		for (const key of spanKeys) {
			for (const teacherId of prepared.activity.teacherIds) {
				if (usage.teacher.get(teacherId)?.has(key)) return false
			}
			for (const groupId of prepared.activity.classGroupIds) {
				if (usage.group.get(groupId)?.has(key)) return false
				const group = problem.groupsById.get(groupId)
				if (!group) continue
				if (usage.classWhole.get(group.classId)?.has(key)) return false
				if (group.isWholeClass && usage.classAny.get(group.classId)?.has(key)) return false
			}
		}

		for (const teacherId of prepared.activity.teacherIds) {
			const limit = problem.teachersById.get(teacherId)?.maxHoursPerDay
			if (limit === undefined) continue
			const used = usage.teacher.get(teacherId)
			if (used && countDayPeriods(used, slot.day) + prepared.duration > limit) return false
		}

		return true
	})

	if (candidates.length === 0) return null

	const scored = candidates.map((slot) => {
		let score = 0
		const spanKeys = timeSlotKeysForSpan(slot, prepared.duration)

		if (prepared.compatibleRooms.some((r) => !spanKeys.some((k) => usage.room.get(r.id)?.has(k)))) {
			score += 10
		}

		score -= countUsedNeighbors(slot, prepared.activity.teacherIds, usage.teacher) * 2

		if (usage.activityDays.get(prepared.activity.id)?.has(slot.day)) {
			score -= 5
		}

		return { slot, score }
	})

	scored.sort((a, b) => b.score - a.score)

	const topN = Math.min(3, scored.length)
	const pick = Math.floor(random() * topN)
	return scored[pick]!.slot
}

function pickRoom(
	prepared: PreparedActivity,
	slot: TimeSlot,
	roomUsed: Map<string, Set<string>>,
): { id: string } | undefined {
	const spanKeys = timeSlotKeysForSpan(slot, prepared.duration)
	for (const room of prepared.compatibleRooms) {
		const used = roomUsed.get(room.id)
		if (!used || !spanKeys.some((k) => used.has(k))) {
			return room
		}
	}
	return undefined
}

function countUsedNeighbors(
	slot: TimeSlot,
	entityIds: string[],
	usedMap: Map<string, Set<string>>,
): number {
	let count = 0
	for (const id of entityIds) {
		const used = usedMap.get(id)
		if (!used) continue
		const prev = `${slot.day}:${slot.period - 1}`
		const next = `${slot.day}:${slot.period + 1}`
		if (used.has(prev)) count++
		if (used.has(next)) count++
	}
	return count
}

function countDayPeriods(used: Set<string>, day: string): number {
	let count = 0
	const prefix = `${day}:`
	for (const key of used) {
		if (key.startsWith(prefix)) count++
	}
	return count
}

function createSeededRandom(seed: number): () => number {
	let state = seed >>> 0
	return () => {
		state = (Math.imul(state, 1664525) + 1013904223) >>> 0
		return state / 0x100000000
	}
}
