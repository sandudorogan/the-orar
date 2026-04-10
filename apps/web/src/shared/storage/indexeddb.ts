const DB_NAME = "orar"
const DB_VERSION = 1

export const STORES = {
	projects: "projects",
	schedules: "schedules",
	generationRuns: "generationRuns",
	settings: "settings",
	history: "history",
} as const

export function openDb(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, DB_VERSION)

		request.onupgradeneeded = (event) => {
			const db = (event.target as IDBOpenDBRequest).result

			if (!db.objectStoreNames.contains(STORES.projects)) {
				db.createObjectStore(STORES.projects, { keyPath: "id" })
			}
			if (!db.objectStoreNames.contains(STORES.schedules)) {
				const store = db.createObjectStore(STORES.schedules, { keyPath: "id" })
				store.createIndex("projectId", "projectId", { unique: false })
			}
			if (!db.objectStoreNames.contains(STORES.generationRuns)) {
				const store = db.createObjectStore(STORES.generationRuns, { keyPath: "id" })
				store.createIndex("projectId", "projectId", { unique: false })
			}
			if (!db.objectStoreNames.contains(STORES.settings)) {
				db.createObjectStore(STORES.settings, { keyPath: "key" })
			}
			if (!db.objectStoreNames.contains(STORES.history)) {
				const store = db.createObjectStore(STORES.history, { keyPath: "id", autoIncrement: true })
				store.createIndex("projectId", "projectId", { unique: false })
				store.createIndex("timestamp", "timestamp", { unique: false })
			}
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
