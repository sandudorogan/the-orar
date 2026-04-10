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
