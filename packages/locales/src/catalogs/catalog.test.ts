import { describe, expect, it } from "vitest"
import type { MessageCatalog } from "../message-types.ts"
import en from "./en.ts"
import es from "./es.ts"
import pt from "./pt.ts"
import ro from "./ro.ts"
import ru from "./ru.ts"

function getAllKeys(obj: object, prefix = ""): string[] {
	const keys: string[] = []
	for (const [key, value] of Object.entries(obj)) {
		const fullKey = prefix ? `${prefix}.${key}` : key
		if (typeof value === "object" && value !== null) {
			keys.push(...getAllKeys(value as object, fullKey))
		} else {
			keys.push(fullKey)
		}
	}
	return keys.sort()
}

function assertNoEmptyValues(obj: object, path = "") {
	for (const [key, value] of Object.entries(obj)) {
		const fullPath = path ? `${path}.${key}` : key
		if (typeof value === "string") {
			expect(value.trim(), `Empty value at ${fullPath}`).not.toBe("")
		} else if (typeof value === "object" && value !== null) {
			assertNoEmptyValues(value as object, fullPath)
		}
	}
}

const catalogs: Record<string, MessageCatalog> = { en, ro, es, pt, ru }

describe("locale catalogs", () => {
	it("en catalog has all required keys", () => {
		const keys = getAllKeys(en)
		expect(keys.length).toBeGreaterThan(0)
	})

	for (const [locale, catalog] of Object.entries(catalogs)) {
		if (locale === "en") continue

		it(`${locale} catalog has identical key set to en`, () => {
			expect(getAllKeys(catalog)).toEqual(getAllKeys(en))
		})

		it(`no empty values in ${locale} catalog`, () => {
			assertNoEmptyValues(catalog)
		})
	}

	it("no empty values in en catalog", () => {
		assertNoEmptyValues(en)
	})
})
