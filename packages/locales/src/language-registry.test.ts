import { describe, expect, it } from "vitest"
import {
	type Locale,
	defaultLocale,
	getLocaleConfig,
	isValidLocale,
	supportedLocales,
} from "./language-registry.ts"

describe("language-registry", () => {
	it("has en as the default locale", () => {
		expect(defaultLocale).toBe("en")
	})

	it("supports at least 2 locales", () => {
		expect(supportedLocales.length).toBeGreaterThanOrEqual(2)
	})

	it("includes en and ro", () => {
		expect(supportedLocales).toContain("en")
		expect(supportedLocales).toContain("ro")
	})

	it("validates known locales", () => {
		expect(isValidLocale("en")).toBe(true)
		expect(isValidLocale("ro")).toBe(true)
	})

	it("rejects unknown locales", () => {
		expect(isValidLocale("xx")).toBe(false)
		expect(isValidLocale("")).toBe(false)
	})

	it("returns config for each supported locale", () => {
		for (const locale of supportedLocales) {
			const config = getLocaleConfig(locale)
			expect(config).toBeDefined()
			expect(config.code).toBe(locale)
			expect(config.name).toBeTruthy()
			expect(config.nativeName).toBeTruthy()
			expect(config.dir).toBe("ltr")
		}
	})
})
