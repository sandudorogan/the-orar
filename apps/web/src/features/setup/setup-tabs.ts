export const SETUP_TABS = [
	"classes",
	"teachers",
	"classrooms",
	"activities",
	"constraints",
	"import",
] as const

export type SetupTab = (typeof SETUP_TABS)[number]

export function isSetupTab(value: string): value is SetupTab {
	return (SETUP_TABS as readonly string[]).includes(value)
}

export function parseSetupTab(value: unknown): SetupTab {
	return typeof value === "string" && isSetupTab(value) ? value : "classes"
}
