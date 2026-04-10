import type { MessageCatalog } from "@orar/locales"

type NestedKeyOf<T> = T extends object
	? {
			[K in keyof T & string]: T[K] extends object ? `${K}.${NestedKeyOf<T[K]>}` : K
		}[keyof T & string]
	: never

export type MessageKey = NestedKeyOf<MessageCatalog>

export function getMessage(messages: MessageCatalog, key: MessageKey): string {
	const parts = key.split(".")
	let current: unknown = messages
	for (const part of parts) {
		if (current && typeof current === "object" && part in current) {
			current = (current as Record<string, unknown>)[part]
		} else {
			return key
		}
	}
	return typeof current === "string" ? current : key
}
