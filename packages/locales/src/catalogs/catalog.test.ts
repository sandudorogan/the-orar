import { describe, expect, it } from "vitest"
import en from "./en.ts"
import ro from "./ro.ts"

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

describe("locale catalogs", () => {
	it("en catalog has all required keys", () => {
		const keys = getAllKeys(en)
		expect(keys.length).toBeGreaterThan(0)
	})

	it("ro catalog has all required keys", () => {
		const keys = getAllKeys(ro)
		expect(keys.length).toBeGreaterThan(0)
	})

	it("en and ro catalogs have identical key sets", () => {
		const enKeys = getAllKeys(en)
		const roKeys = getAllKeys(ro)
		expect(enKeys).toEqual(roKeys)
	})

	it("no empty values in en catalog", () => {
		const check = (obj: object, path = "") => {
			for (const [key, value] of Object.entries(obj)) {
				const fullPath = path ? `${path}.${key}` : key
				if (typeof value === "string") {
					expect(value.trim(), `Empty value at ${fullPath}`).not.toBe("")
				} else if (typeof value === "object" && value !== null) {
					check(value as object, fullPath)
				}
			}
		}
		check(en)
	})

	it("no empty values in ro catalog", () => {
		const check = (obj: object, path = "") => {
			for (const [key, value] of Object.entries(obj)) {
				const fullPath = path ? `${path}.${key}` : key
				if (typeof value === "string") {
					expect(value.trim(), `Empty value at ${fullPath}`).not.toBe("")
				} else if (typeof value === "object" && value !== null) {
					check(value as object, fullPath)
				}
			}
		}
		check(ro)
	})
})
