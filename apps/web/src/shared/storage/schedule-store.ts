import type { Assignment } from "@orar/domain"
import { STORES, idbRequest, openDb, txReadOnly, txReadWrite } from "./indexeddb.ts"

interface ScheduleRecord {
	id: string
	projectId: string
	assignments: Assignment[]
}

export async function saveAssignments(projectId: string, assignments: Assignment[]): Promise<void> {
	const db = await openDb()
	const store = txReadWrite(db, STORES.schedules)
	const record: ScheduleRecord = { id: projectId, projectId, assignments }
	await idbRequest(store.put(record))
}

export async function getAssignments(projectId: string): Promise<Assignment[]> {
	const db = await openDb()
	const store = txReadOnly(db, STORES.schedules)
	const record = await idbRequest<ScheduleRecord | undefined>(store.get(projectId))
	return record?.assignments ?? []
}
