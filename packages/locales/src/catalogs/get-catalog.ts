import type { MessageCatalog } from "../message-types.ts"
import type { Locale } from "../language-registry.ts"
import en from "./en.ts"
import ro from "./ro.ts"

const catalogs: Record<Locale, MessageCatalog> = { en, ro }

export function getCatalog(locale: Locale): MessageCatalog {
	return catalogs[locale]
}
