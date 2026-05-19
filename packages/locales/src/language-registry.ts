export type Locale = "en" | "ro" | "es" | "pt" | "ru"

export interface LocaleConfig {
	code: Locale
	name: string
	nativeName: string
	dir: "ltr" | "rtl"
}

const localeConfigs: Record<Locale, LocaleConfig> = {
	en: {
		code: "en",
		name: "English",
		nativeName: "English",
		dir: "ltr",
	},
	ro: {
		code: "ro",
		name: "Romanian",
		nativeName: "Română",
		dir: "ltr",
	},
	es: {
		code: "es",
		name: "Spanish",
		nativeName: "Español",
		dir: "ltr",
	},
	pt: {
		code: "pt",
		name: "Portuguese",
		nativeName: "Português",
		dir: "ltr",
	},
	ru: {
		code: "ru",
		name: "Russian",
		nativeName: "Русский",
		dir: "ltr",
	},
}

export const supportedLocales: Locale[] = Object.keys(localeConfigs) as Locale[]
export const defaultLocale: Locale = "en"

export function isValidLocale(code: string): code is Locale {
	return code in localeConfigs
}

export function getLocaleConfig(locale: Locale): LocaleConfig {
	return localeConfigs[locale]
}

export { getCatalog } from "./catalogs/get-catalog.ts"
