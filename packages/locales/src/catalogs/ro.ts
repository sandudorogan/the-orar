import type { MessageCatalog } from "../message-types.ts"

const ro: MessageCatalog = {
	common: {
		save: "Salveaza",
		cancel: "Anuleaza",
		delete: "Sterge",
		edit: "Editeaza",
		create: "Creeaza",
		search: "Cauta",
		loading: "Se incarca...",
		noResults: "Niciun rezultat",
		confirm: "Confirma",
		back: "Inapoi",
	},
	nav: {
		dashboard: "Panou",
		classes: "Clase",
		teachers: "Profesori",
		classrooms: "Sali de clasa",
		activities: "Activitati",
		constraints: "Restrictii",
		generate: "Genereaza",
		timetables: "Orare",
		exports: "Exporturi",
		settings: "Setari",
	},
	entities: {
		institution: "Institutie",
		class_: "Clasa",
		classGroup: "Grupa",
		teacher: "Profesor",
		classroom: "Sala de clasa",
		activity: "Activitate",
		schedule: "Orar",
		timeSlot: "Interval orar",
	},
	scheduling: {
		conflict: "Conflict",
		unplaced: "Neplasata",
		locked: "Blocata",
		generated: "Generat",
		generating: "Se genereaza...",
		runGeneration: "Porneste generarea",
		stopGeneration: "Opreste",
		attempts: "Incercari",
		progress: "Progres",
	},
	availability: {
		available: "Disponibil",
		unavailable: "Indisponibil",
		preferred: "Preferat",
	},
	exports: {
		exportDocx: "Exporta DOCX",
		exportExcel: "Exporta Excel",
		perTeacher: "Per Profesor",
		perClass: "Per Clasa",
		perClassroom: "Per Sala",
		institutionPack: "Pachet Institutional",
	},
	settings: {
		language: "Limba",
		theme: "Tema",
		autoSave: "Salvare automata",
	},
}

export default ro
