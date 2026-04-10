import type { ScheduleProject } from "@orar/domain"
import { STORES, idbRequest, openDb, txReadOnly, txReadWrite } from "./indexeddb.ts"

export async function saveProject(project: ScheduleProject): Promise<void> {
	const db = await openDb()
	const store = txReadWrite(db, STORES.projects)
	await idbRequest(store.put(project))
}

export async function getProject(id: string): Promise<ScheduleProject | undefined> {
	const db = await openDb()
	const store = txReadOnly(db, STORES.projects)
	return idbRequest(store.get(id))
}

export async function getAllProjects(): Promise<ScheduleProject[]> {
	const db = await openDb()
	const store = txReadOnly(db, STORES.projects)
	return idbRequest(store.getAll())
}

export async function deleteProject(id: string): Promise<void> {
	const db = await openDb()
	const store = txReadWrite(db, STORES.projects)
	await idbRequest(store.delete(id))
}
