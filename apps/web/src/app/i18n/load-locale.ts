import type { Locale, MessageCatalog } from "@orar/locales"

const catalogLoaders: Record<Locale, () => Promise<{ default: MessageCatalog }>> = {
	en: () => import("@orar/locales/catalogs/en" as string) as Promise<{ default: MessageCatalog }>,
	ro: () => import("@orar/locales/catalogs/ro" as string) as Promise<{ default: MessageCatalog }>,
}

const catalogCache = new Map<Locale, MessageCatalog>()

export async function loadCatalog(locale: Locale): Promise<MessageCatalog> {
	const cached = catalogCache.get(locale)
	if (cached) return cached

	const mod = await catalogLoaders[locale]()
	catalogCache.set(locale, mod.default)
	return mod.default
}
