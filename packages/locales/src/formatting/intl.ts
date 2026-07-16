import type { Locale } from "../language-registry.ts"

export function formatDate(date: Date, locale: Locale): string {
	return new Intl.DateTimeFormat(locale, {
		year: "numeric",
		month: "long",
		day: "numeric",
	}).format(date)
}

export function formatTime(date: Date, locale: Locale): string {
	return new Intl.DateTimeFormat(locale, {
		hour: "2-digit",
		minute: "2-digit",
	}).format(date)
}

export function formatNumber(value: number, locale: Locale): string {
	return new Intl.NumberFormat(locale).format(value)
}

export function formatDayOfWeek(date: Date, locale: Locale): string {
	return new Intl.DateTimeFormat(locale, { weekday: "long" }).format(date)
}

export function formatShortDate(date: Date, locale: Locale): string {
	return new Intl.DateTimeFormat(locale, {
		month: "short",
		day: "numeric",
	}).format(date)
}

const DAY_INDEX: Record<string, number> = {
	monday: 1,
	tuesday: 2,
	wednesday: 3,
	thursday: 4,
	friday: 5,
	saturday: 6,
	sunday: 0,
}

export function translateDayName(day: string, locale: Locale): string {
	const index = DAY_INDEX[day.toLowerCase()]
	if (index === undefined) return day.charAt(0).toUpperCase() + day.slice(1)
	const date = new Date(2024, 0, 7 + index)
	const name = new Intl.DateTimeFormat(locale, { weekday: "long" }).format(date)
	return name.charAt(0).toUpperCase() + name.slice(1)
}

export function translateDayNameShort(day: string, locale: Locale): string {
	const index = DAY_INDEX[day.toLowerCase()]
	if (index === undefined) return day
	const date = new Date(2024, 0, 7 + index)
	const name = new Intl.DateTimeFormat(locale, { weekday: "short" }).format(date)
	return name.charAt(0).toUpperCase() + name.slice(1)
}
