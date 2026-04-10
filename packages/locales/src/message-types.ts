export interface MessageCatalog {
	common: {
		save: string
		cancel: string
		delete: string
		edit: string
		create: string
		search: string
		loading: string
		noResults: string
		confirm: string
		back: string
	}
	nav: {
		dashboard: string
		classes: string
		teachers: string
		classrooms: string
		activities: string
		constraints: string
		generate: string
		timetables: string
		exports: string
		settings: string
	}
	entities: {
		institution: string
		class_: string
		classGroup: string
		teacher: string
		classroom: string
		activity: string
		schedule: string
		timeSlot: string
	}
	scheduling: {
		conflict: string
		unplaced: string
		locked: string
		generated: string
		generating: string
		runGeneration: string
		stopGeneration: string
		attempts: string
		progress: string
	}
	availability: {
		available: string
		unavailable: string
		preferred: string
	}
	exports: {
		exportDocx: string
		exportExcel: string
		perTeacher: string
		perClass: string
		perClassroom: string
		institutionPack: string
	}
	settings: {
		language: string
		theme: string
		autoSave: string
	}
}
