import { describe, expect, it } from "vitest"
import { formatDate, formatNumber, formatTime } from "./intl.ts"

describe("intl formatting", () => {
	it("formats a date in en locale", () => {
		const date = new Date(2026, 0, 15) // Jan 15, 2026
		const result = formatDate(date, "en")
		expect(result).toContain("2026")
		expect(result).toContain("15")
	})

	it("formats a date in ro locale", () => {
		const date = new Date(2026, 0, 15)
		const result = formatDate(date, "ro")
		expect(result).toContain("2026")
		expect(result).toContain("15")
	})

	it("formats time in en locale", () => {
		const date = new Date(2026, 0, 15, 14, 30)
		const result = formatTime(date, "en")
		expect(result).toBeTruthy()
	})

	it("formats time in ro locale", () => {
		const date = new Date(2026, 0, 15, 14, 30)
		const result = formatTime(date, "ro")
		expect(result).toBeTruthy()
	})

	it("formats numbers with locale awareness", () => {
		const result = formatNumber(1234.5, "en")
		expect(result).toContain("1")
		expect(result).toContain("234")
	})
})
