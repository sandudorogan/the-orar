import { describe, expect, it } from "vitest"
import type { MessageCatalog } from "./message-types.ts"

describe("message-types", () => {
	it("type-checks a valid catalog shape", () => {
		const catalog: MessageCatalog = {
			common: {
				save: "Save",
				cancel: "Cancel",
				delete: "Delete",
				edit: "Edit",
				create: "Create",
				search: "Search",
				loading: "Loading...",
				noResults: "No results",
				confirm: "Confirm",
				back: "Back",
			},
			nav: {
				dashboard: "Dashboard",
				classes: "Classes",
				teachers: "Teachers",
				classrooms: "Classrooms",
				activities: "Activities",
				constraints: "Constraints",
				generate: "Generate",
				timetables: "Timetables",
				exports: "Exports",
				settings: "Settings",
			},
			entities: {
				institution: "Institution",
				class_: "Class",
				classGroup: "Class Group",
				teacher: "Teacher",
				classroom: "Classroom",
				activity: "Activity",
				schedule: "Schedule",
				timeSlot: "Time Slot",
			},
			scheduling: {
				conflict: "Conflict",
				unplaced: "Unplaced",
				locked: "Locked",
				generated: "Generated",
				generating: "Generating...",
				runGeneration: "Run Generation",
				stopGeneration: "Stop",
				attempts: "Attempts",
				progress: "Progress",
			},
			availability: {
				available: "Available",
				unavailable: "Unavailable",
				preferred: "Preferred",
			},
			exports: {
				exportDocx: "Export DOCX",
				exportExcel: "Export Excel",
				perTeacher: "Per Teacher",
				perClass: "Per Class",
				perClassroom: "Per Classroom",
				institutionPack: "Institution Pack",
			},
			settings: {
				language: "Language",
				theme: "Theme",
				autoSave: "Auto-save",
			},
		}
		expect(catalog.common.save).toBe("Save")
		expect(catalog.nav.dashboard).toBe("Dashboard")
	})
})
