import { I18nProvider } from "@/app/i18n/provider.tsx"
import { ProjectProvider } from "@/app/project-context.tsx"
import en from "@orar/locales/catalogs/en"
import type { ReactNode } from "react"

export function Providers({ children }: { children: ReactNode }) {
	return (
		<I18nProvider initialMessages={en}>
			<ProjectProvider>{children}</ProjectProvider>
		</I18nProvider>
	)
}
