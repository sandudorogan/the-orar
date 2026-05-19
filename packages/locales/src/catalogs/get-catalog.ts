import type { Locale } from "../language-registry.ts"
import type { MessageCatalog } from "../message-types.ts"
import en from "./en.ts"
import es from "./es.ts"
import pt from "./pt.ts"
import ro from "./ro.ts"
import ru from "./ru.ts"

const catalogs: Record<Locale, MessageCatalog> = { en, ro, es, pt, ru }

export function getCatalog(locale: Locale): MessageCatalog {
	return catalogs[locale]
}
