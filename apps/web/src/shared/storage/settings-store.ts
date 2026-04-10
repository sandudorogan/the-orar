import type { Locale } from "@orar/locales"
import { STORES, idbRequest, openDb, txReadOnly, txReadWrite } from "./indexeddb.ts"

export interface AppSettings {
	locale: Locale
	autoSave: boolean
	lastProjectId?: string
}

const SETTINGS_KEY = "app-settings"

const DEFAULT_SETTINGS: AppSettings = {
	locale: "en",
	autoSave: true,
}

export async function getSettings(): Promise<AppSettings> {
	const db = await openDb()
	const store = txReadOnly(db, STORES.settings)
	const record = await idbRequest(store.get(SETTINGS_KEY))
	return record?.value ?? DEFAULT_SETTINGS
}

export async function saveSettings(settings: AppSettings): Promise<void> {
	const db = await openDb()
	const store = txReadWrite(db, STORES.settings)
	await idbRequest(store.put({ key: SETTINGS_KEY, value: settings }))
}
