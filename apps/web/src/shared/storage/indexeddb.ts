const DB_NAME = "orar"
const DB_VERSION = 2

export const STORES = {
	projects: "projects",
	schedules: "schedules",
	generationRuns: "generationRuns",
	settings: "settings",
} as const

export function openDb(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, DB_VERSION)

		request.onupgradeneeded = (event) => {
			const db = (event.target as IDBOpenDBRequest).result
			const oldVersion = event.oldVersion

			if (oldVersion < 1) {
				db.createObjectStore(STORES.projects, { keyPath: "id" })
				const schedules = db.createObjectStore(STORES.schedules, { keyPath: "id" })
				schedules.createIndex("projectId", "projectId", { unique: false })
				const runs = db.createObjectStore(STORES.generationRuns, { keyPath: "id" })
				runs.createIndex("projectId", "projectId", { unique: false })
				db.createObjectStore(STORES.settings, { keyPath: "key" })
			}

			if (oldVersion < 2) {
				if (db.objectStoreNames.contains("history")) {
					db.deleteObjectStore("history")
				}
			}
		}

		request.onblocked = () => {
			reject(new Error("Database upgrade blocked by another open tab"))
		}

		request.onsuccess = () => resolve(request.result)
		request.onerror = () => reject(request.error)
	})
}

export function txReadOnly(db: IDBDatabase, storeName: string): IDBObjectStore {
	return db.transaction(storeName, "readonly").objectStore(storeName)
}

export function txReadWrite(db: IDBDatabase, storeName: string): IDBObjectStore {
	return db.transaction(storeName, "readwrite").objectStore(storeName)
}

export function idbRequest<T>(request: IDBRequest<T>): Promise<T> {
	return new Promise((resolve, reject) => {
		request.onsuccess = () => resolve(request.result)
		request.onerror = () => reject(request.error)
	})
}
