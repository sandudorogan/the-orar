import { getAllProjects, saveProject } from "@/shared/storage/project-store.ts"
import { getAssignments, saveAssignments } from "@/shared/storage/schedule-store.ts"
import type {
	Activity,
	Assignment,
	AvailabilityRule,
	Class,
	ClassGroup,
	Classroom,
	ScheduleProject,
	Teacher,
} from "@orar/domain"
import {
	createActivity,
	createAvailabilityRule,
	createCalendar,
	createClass,
	createClassGroup,
	createClassroom,
	createInstitution,
	createScheduleProject,
	createTeacher,
} from "@orar/domain"
import {
	type ReactNode,
	createContext,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
} from "react"

interface ProjectContextValue {
	project: ScheduleProject
	isLoading: boolean
	assignments: Assignment[]
	setAssignments: (assignments: Assignment[]) => void

	addClass: (
		data: Pick<Class, "name" | "shortName"> & Partial<Pick<Class, "year" | "studentCount">>,
	) => void
	updateClass: (id: string, data: Partial<Omit<Class, "id">>) => void
	deleteClass: (id: string) => void

	addClassGroup: (
		data: Pick<ClassGroup, "classId" | "name" | "shortName"> &
			Partial<Pick<ClassGroup, "studentCount">>,
	) => void
	updateClassGroup: (id: string, data: Partial<Omit<ClassGroup, "id">>) => void
	deleteClassGroup: (id: string) => void

	addTeacher: (
		data: Pick<Teacher, "name" | "shortName"> &
			Partial<Pick<Teacher, "email" | "maxHoursPerDay" | "maxHoursPerWeek">>,
	) => void
	updateTeacher: (id: string, data: Partial<Omit<Teacher, "id">>) => void
	deleteTeacher: (id: string) => void

	addClassroom: (
		data: Pick<Classroom, "name" | "shortName"> &
			Partial<Pick<Classroom, "capacity" | "building" | "tags">>,
	) => void
	updateClassroom: (id: string, data: Partial<Omit<Classroom, "id">>) => void
	deleteClassroom: (id: string) => void

	addActivity: (
		data: Pick<Activity, "name" | "subjectName" | "teacherIds" | "classGroupIds"> &
			Partial<
				Pick<
					Activity,
					"duration" | "totalPerWeek" | "splitConfig" | "preferredRoomIds" | "roomTags"
				>
			>,
	) => void
	updateActivity: (id: string, data: Partial<Omit<Activity, "id">>) => void
	deleteActivity: (id: string) => void

	addAvailabilityRule: (
		data: Pick<AvailabilityRule, "targetType" | "targetId" | "type" | "timeSlots">,
	) => void
	updateAvailabilityRule: (id: string, data: Partial<Omit<AvailabilityRule, "id">>) => void
	deleteAvailabilityRule: (id: string) => void

	replaceProject: (project: ScheduleProject, assignments?: Assignment[]) => void
}

const ProjectContext = createContext<ProjectContextValue | null>(null)

function createDefaultProject(): ScheduleProject {
	const institution = createInstitution({ name: "My School", type: "school" })
	const calendar = createCalendar({
		name: "Default Calendar",
		activeDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
		periodsPerDay: 7,
	})
	return createScheduleProject({
		name: "My Schedule",
		calendar,
		institution,
		institutionId: institution.id,
	})
}

export function ProjectProvider({ children }: { children: ReactNode }) {
	const [project, setProject] = useState<ScheduleProject | null>(null)
	const [assignments, setAssignments] = useState<Assignment[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

	useEffect(() => {
		void navigator.storage?.persist?.()
		getAllProjects().then(async (projects) => {
			const existing = projects[0]
			if (existing) {
				setProject(existing)
				const stored = await getAssignments(existing.id)
				if (stored.length > 0) setAssignments(stored)
			} else {
				const newProject = createDefaultProject()
				setProject(newProject)
				saveProject(newProject)
			}
			setIsLoading(false)
		})
	}, [])

	const updateProject = useCallback((updater: (prev: ScheduleProject) => ScheduleProject) => {
		setProject((prev) => {
			if (!prev) return prev
			const next = { ...updater(prev), updatedAt: new Date().toISOString() }
			if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
			saveTimeoutRef.current = setTimeout(() => {
				saveProject(next)
			}, 300)
			return next
		})
	}, [])

	const addClass = useCallback(
		(data: Pick<Class, "name" | "shortName"> & Partial<Pick<Class, "year" | "studentCount">>) => {
			const cls = createClass(data)
			updateProject((p) => ({ ...p, classes: [...p.classes, cls] }))
		},
		[updateProject],
	)

	const updateClass = useCallback(
		(id: string, data: Partial<Omit<Class, "id">>) => {
			updateProject((p) => ({
				...p,
				classes: p.classes.map((c) => (c.id === id ? { ...c, ...data } : c)),
			}))
		},
		[updateProject],
	)

	const deleteClass = useCallback(
		(id: string) => {
			updateProject((p) => ({
				...p,
				classes: p.classes.filter((c) => c.id !== id),
				classGroups: p.classGroups.filter((g) => g.classId !== id),
			}))
		},
		[updateProject],
	)

	const addClassGroup = useCallback(
		(
			data: Pick<ClassGroup, "classId" | "name" | "shortName"> &
				Partial<Pick<ClassGroup, "studentCount">>,
		) => {
			const group = createClassGroup(data)
			updateProject((p) => ({ ...p, classGroups: [...p.classGroups, group] }))
		},
		[updateProject],
	)

	const updateClassGroup = useCallback(
		(id: string, data: Partial<Omit<ClassGroup, "id">>) => {
			updateProject((p) => ({
				...p,
				classGroups: p.classGroups.map((g) => (g.id === id ? { ...g, ...data } : g)),
			}))
		},
		[updateProject],
	)

	const deleteClassGroup = useCallback(
		(id: string) => {
			updateProject((p) => ({
				...p,
				classGroups: p.classGroups.filter((g) => g.id !== id),
			}))
		},
		[updateProject],
	)

	const addTeacher = useCallback(
		(
			data: Pick<Teacher, "name" | "shortName"> &
				Partial<Pick<Teacher, "email" | "maxHoursPerDay" | "maxHoursPerWeek">>,
		) => {
			const teacher = createTeacher(data)
			updateProject((p) => ({ ...p, teachers: [...p.teachers, teacher] }))
		},
		[updateProject],
	)

	const updateTeacher = useCallback(
		(id: string, data: Partial<Omit<Teacher, "id">>) => {
			updateProject((p) => ({
				...p,
				teachers: p.teachers.map((t) => (t.id === id ? { ...t, ...data } : t)),
			}))
		},
		[updateProject],
	)

	const deleteTeacher = useCallback(
		(id: string) => {
			updateProject((p) => ({
				...p,
				teachers: p.teachers.filter((t) => t.id !== id),
			}))
		},
		[updateProject],
	)

	const addClassroom = useCallback(
		(
			data: Pick<Classroom, "name" | "shortName"> &
				Partial<Pick<Classroom, "capacity" | "building" | "tags">>,
		) => {
			const classroom = createClassroom(data)
			updateProject((p) => ({ ...p, classrooms: [...p.classrooms, classroom] }))
		},
		[updateProject],
	)

	const updateClassroom = useCallback(
		(id: string, data: Partial<Omit<Classroom, "id">>) => {
			updateProject((p) => ({
				...p,
				classrooms: p.classrooms.map((r) => (r.id === id ? { ...r, ...data } : r)),
			}))
		},
		[updateProject],
	)

	const deleteClassroom = useCallback(
		(id: string) => {
			updateProject((p) => ({
				...p,
				classrooms: p.classrooms.filter((r) => r.id !== id),
			}))
		},
		[updateProject],
	)

	const addActivity = useCallback(
		(
			data: Pick<Activity, "name" | "subjectName" | "teacherIds" | "classGroupIds"> &
				Partial<
					Pick<
						Activity,
						"duration" | "totalPerWeek" | "splitConfig" | "preferredRoomIds" | "roomTags"
					>
				>,
		) => {
			const activity = createActivity(data)
			updateProject((p) => ({ ...p, activities: [...p.activities, activity] }))
		},
		[updateProject],
	)

	const updateActivity = useCallback(
		(id: string, data: Partial<Omit<Activity, "id">>) => {
			updateProject((p) => ({
				...p,
				activities: p.activities.map((a) => (a.id === id ? { ...a, ...data } : a)),
			}))
		},
		[updateProject],
	)

	const deleteActivity = useCallback(
		(id: string) => {
			updateProject((p) => ({
				...p,
				activities: p.activities.filter((a) => a.id !== id),
			}))
		},
		[updateProject],
	)

	const addAvailabilityRule = useCallback(
		(data: Pick<AvailabilityRule, "targetType" | "targetId" | "type" | "timeSlots">) => {
			const rule = createAvailabilityRule(data)
			updateProject((p) => ({ ...p, availabilityRules: [...p.availabilityRules, rule] }))
		},
		[updateProject],
	)

	const updateAvailabilityRule = useCallback(
		(id: string, data: Partial<Omit<AvailabilityRule, "id">>) => {
			updateProject((p) => ({
				...p,
				availabilityRules: p.availabilityRules.map((r) => (r.id === id ? { ...r, ...data } : r)),
			}))
		},
		[updateProject],
	)

	const deleteAvailabilityRule = useCallback(
		(id: string) => {
			updateProject((p) => ({
				...p,
				availabilityRules: p.availabilityRules.filter((r) => r.id !== id),
			}))
		},
		[updateProject],
	)

	const persistAssignments = useCallback(
		(next: Assignment[]) => {
			setAssignments(next)
			if (project) saveAssignments(project.id, next)
		},
		[project],
	)

	const replaceProject = useCallback(
		(newProject: ScheduleProject, nextAssignments?: Assignment[]) => {
			setProject(newProject)
			setAssignments(nextAssignments ?? [])
			saveProject(newProject)
			saveAssignments(newProject.id, nextAssignments ?? [])
		},
		[],
	)

	if (isLoading || !project) {
		return null
	}

	return (
		<ProjectContext.Provider
			value={{
				project,
				isLoading,
				assignments,
				setAssignments: persistAssignments,
				addClass,
				updateClass,
				deleteClass,
				addClassGroup,
				updateClassGroup,
				deleteClassGroup,
				addTeacher,
				updateTeacher,
				deleteTeacher,
				addClassroom,
				updateClassroom,
				deleteClassroom,
				addActivity,
				updateActivity,
				deleteActivity,
				addAvailabilityRule,
				updateAvailabilityRule,
				deleteAvailabilityRule,
				replaceProject,
			}}
		>
			{children}
		</ProjectContext.Provider>
	)
}

export function useProject() {
	const ctx = useContext(ProjectContext)
	if (!ctx) {
		throw new Error("useProject must be used within a ProjectProvider")
	}
	return ctx
}
