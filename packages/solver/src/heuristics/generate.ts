import type { Assignment, TimeSlot } from "@orar/domain"
import { timeSlotKeysForSpan } from "@orar/domain"
import type { PreparedActivity, PreparedProblem } from "../preprocessing/prepare.ts"

export interface GenerationResult {
	assignments: Assignment[]
	fitness: number
	placedCount: number
	totalCount: number
}

export interface GenerationOptions {
	seed?: number
}

export function generate(
	problem: PreparedProblem,
	onProgress?: (placed: number, total: number) => void,
	shouldCancel?: () => boolean,
	options: GenerationOptions = {},
): GenerationResult {
	const total = problem.activities.length
	const assignments: Assignment[] = []
	const random = options.seed === undefined ? Math.random : createSeededRandom(options.seed)

	const teacherSlotUsed = new Map<string, Set<string>>()
	const groupSlotUsed = new Map<string, Set<string>>()
	const roomSlotUsed = new Map<string, Set<string>>()

	let placed = 0
	let softPenalty = 0

	for (const prepared of problem.activities) {
		if (shouldCancel?.()) break

		const slot = pickBestSlot(prepared, teacherSlotUsed, groupSlotUsed, roomSlotUsed, random)
		if (!slot) {
			softPenalty += 100
			continue
		}

		const room = pickRoom(prepared, slot, roomSlotUsed)

		const assignment: Assignment = {
			activityId: prepared.activity.id,
			timeSlot: slot,
			roomId: room?.id,
			locked: false,
			duration: prepared.duration,
		}
		assignments.push(assignment)

		const spanKeys = timeSlotKeysForSpan(slot, prepared.duration)
		for (const teacherId of prepared.activity.teacherIds) {
			const used = teacherSlotUsed.get(teacherId) ?? new Set()
			for (const k of spanKeys) used.add(k)
			teacherSlotUsed.set(teacherId, used)
		}
		for (const groupId of prepared.activity.classGroupIds) {
			const used = groupSlotUsed.get(groupId) ?? new Set()
			for (const k of spanKeys) used.add(k)
			groupSlotUsed.set(groupId, used)
		}
		if (room) {
			const used = roomSlotUsed.get(room.id) ?? new Set()
			for (const k of spanKeys) used.add(k)
			roomSlotUsed.set(room.id, used)
		}

		placed++
		onProgress?.(placed, total)
	}

	const fitness = (placed / Math.max(total, 1)) * 100 - softPenalty * 0.01
	return { assignments, fitness: Math.max(0, fitness), placedCount: placed, totalCount: total }
}

function pickBestSlot(
	prepared: PreparedActivity,
	teacherUsed: Map<string, Set<string>>,
	groupUsed: Map<string, Set<string>>,
	roomUsed: Map<string, Set<string>>,
	random: () => number,
): TimeSlot | null {
	const candidates = prepared.availableSlots.filter((slot) => {
		const spanKeys = timeSlotKeysForSpan(slot, prepared.duration)

		for (const key of spanKeys) {
			for (const teacherId of prepared.activity.teacherIds) {
				if (teacherUsed.get(teacherId)?.has(key)) return false
			}
			for (const groupId of prepared.activity.classGroupIds) {
				if (groupUsed.get(groupId)?.has(key)) return false
			}
		}

		return true
	})

	if (candidates.length === 0) return null

	const scored = candidates.map((slot) => {
		let score = 0
		const spanKeys = timeSlotKeysForSpan(slot, prepared.duration)

		if (prepared.compatibleRooms.some((r) => !spanKeys.some((k) => roomUsed.get(r.id)?.has(k)))) {
			score += 10
		}

		score -= countUsedNeighbors(slot, prepared.activity.teacherIds, teacherUsed) * 2

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

function createSeededRandom(seed: number): () => number {
	let state = seed >>> 0
	return () => {
		state = (Math.imul(state, 1664525) + 1013904223) >>> 0
		return state / 0x100000000
	}
}
