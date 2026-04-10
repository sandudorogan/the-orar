import { type Locale, type MessageCatalog, defaultLocale } from "@orar/locales"
import { type ReactNode, createContext, useCallback, useEffect, useState } from "react"
import { loadCatalog } from "./load-locale.ts"

export interface I18nContextValue {
	locale: Locale
	messages: MessageCatalog
	setLocale: (locale: Locale) => void
	isLoading: boolean
}

export const I18nContext = createContext<I18nContextValue | null>(null)

interface I18nProviderProps {
	initialLocale?: Locale
	initialMessages: MessageCatalog
	children: ReactNode
}

export function I18nProvider({ initialLocale, initialMessages, children }: I18nProviderProps) {
	const [locale, setLocaleState] = useState<Locale>(initialLocale ?? defaultLocale)
	const [messages, setMessages] = useState<MessageCatalog>(initialMessages)
	const [isLoading, setIsLoading] = useState(false)

	const setLocale = useCallback((newLocale: Locale) => {
		setIsLoading(true)
		setLocaleState(newLocale)
	}, [])

	useEffect(() => {
		if (!isLoading) return
		let cancelled = false
		loadCatalog(locale).then((catalog) => {
			if (!cancelled) {
				setMessages(catalog)
				setIsLoading(false)
				document.documentElement.lang = locale
			}
		})
		return () => {
			cancelled = true
		}
	}, [locale, isLoading])

	return (
		<I18nContext.Provider value={{ locale, messages, setLocale, isLoading }}>
			{children}
		</I18nContext.Provider>
	)
}
