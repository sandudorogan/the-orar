import type { ScheduleProject } from "@orar/domain"
import { STORES, idbRequest, openDb, txReadOnly, txReadWrite } from "./indexeddb.ts"

export interface HistorySnapshot {
	id?: number
	projectId: string
	timestamp: string
	data: ScheduleProject
}

const MAX_SNAPSHOTS_PER_PROJECT = 50

export async function saveSnapshot(project: ScheduleProject): Promise<void> {
	const db = await openDb()
	const store = txReadWrite(db, STORES.history)
	await idbRequest(
		store.add({
			projectId: project.id,
			timestamp: new Date().toISOString(),
			data: project,
		}),
	)
	await pruneOldSnapshots(project.id)
}

export async function getSnapshots(projectId: string): Promise<HistorySnapshot[]> {
	const db = await openDb()
	const store = txReadOnly(db, STORES.history)
	const index = store.index("projectId")
	return idbRequest(index.getAll(projectId))
}

async function pruneOldSnapshots(projectId: string): Promise<void> {
	const snapshots = await getSnapshots(projectId)
	if (snapshots.length <= MAX_SNAPSHOTS_PER_PROJECT) return

	const toRemove = snapshots
		.sort((a, b) => a.timestamp.localeCompare(b.timestamp))
		.slice(0, snapshots.length - MAX_SNAPSHOTS_PER_PROJECT)

	const db = await openDb()
	const store = txReadWrite(db, STORES.history)
	for (const snap of toRemove) {
		if (snap.id != null) {
			await idbRequest(store.delete(snap.id))
		}
	}
}
