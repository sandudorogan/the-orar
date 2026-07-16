import { useLocale, useMessages } from "@/app/i18n/use-i18n.ts"
import { useProject } from "@/app/project-context.tsx"
import type { DayOfWeek } from "@orar/domain"
import {
	detectConflicts,
	getAssignmentsForClassGroup,
	getAssignmentsForRoom,
	getAssignmentsForTeacher,
	timeSlotKey,
} from "@orar/domain"
import { translateDayNameShort } from "@orar/locales"
import type { TimetableCell } from "@orar/ui"
import {
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
	TimetableGrid,
} from "@orar/ui"
import { useNavigate } from "@tanstack/react-router"
import { CalendarDays, DoorOpen, GraduationCap, Lock, LockOpen, Users, X, Zap } from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"

type ViewMode = "class" | "teacher" | "classroom"

interface SelectedRef {
	activityId: string
	slotKey: string
}

export function TimetablesPage() {
	const messages = useMessages()
	const { locale } = useLocale()
	const { project, assignments, setAssignments } = useProject()
	const navigate = useNavigate()

	const [viewMode, setViewMode] = useState<ViewMode>("class")
	const [selectedId, setSelectedId] = useState<string>(() => project.classGroups[0]?.id ?? "")
	const [selected, setSelected] = useState<SelectedRef | null>(null)

	const conflictSlotKeys = useMemo(() => {
		if (assignments.length === 0) return new Set<string>()

		const conflicts = detectConflicts({
			calendar: project.calendar,
			classes: project.classes,
			classGroups: project.classGroups,
			teachers: project.teachers,
			classrooms: project.classrooms,
			activities: project.activities,
			availabilityRules: project.availabilityRules,
			assignments,
		})

		const keys = new Set<string>()
		for (const c of conflicts) {
			if (c.timeSlot) {
				keys.add(timeSlotKey(c.timeSlot))
			}
		}
		return keys
	}, [assignments, project])

	const days = project.calendar.activeDays
	const periods = project.calendar.periodsPerDay

	const dayLabels = days.map((d) => translateDayNameShort(d, locale))

	const labelToDay = useMemo(
		() => Object.fromEntries(days.map((d, i) => [dayLabels[i]!, d])) as Record<string, DayOfWeek>,
		[days, dayLabels],
	)

	const optionsFor = useCallback(
		(mode: ViewMode) => {
			switch (mode) {
				case "class":
					return project.classGroups.map((g) => {
						const cls = project.classes.find((c) => c.id === g.classId)
						return {
							id: g.id,
							label: cls ? `${cls.shortName} / ${g.shortName}` : g.shortName,
						}
					})
				case "teacher":
					return project.teachers.map((t) => ({
						id: t.id,
						label: t.name,
					}))
				case "classroom":
					return project.classrooms.map((r) => ({
						id: r.id,
						label: r.name,
					}))
			}
		},
		[project],
	)

	const entityOptions = useMemo(() => optionsFor(viewMode), [optionsFor, viewMode])

	useEffect(() => {
		if (selectedId && entityOptions.some((o) => o.id === selectedId)) return
		setSelectedId(entityOptions[0]?.id ?? "")
	}, [entityOptions, selectedId])

	const filteredAssignments = useMemo(() => {
		if (!selectedId) return []

		switch (viewMode) {
			case "class":
				return getAssignmentsForClassGroup(assignments, selectedId, project.activities)
			case "teacher":
				return getAssignmentsForTeacher(assignments, selectedId, project.activities)
			case "classroom":
				return getAssignmentsForRoom(assignments, selectedId)
		}
	}, [viewMode, selectedId, assignments, project.activities])

	function findAssignmentIndex(ref: SelectedRef): number {
		return assignments.findIndex(
			(a) => a.activityId === ref.activityId && timeSlotKey(a.timeSlot) === ref.slotKey,
		)
	}

	function handleCellClick(dayLabel: string, period: number) {
		const day = labelToDay[dayLabel]
		if (!day) return
		const clickedKey = timeSlotKey({ day, period })
		const itemsInCell = filteredAssignments.filter((a) => timeSlotKey(a.timeSlot) === clickedKey)

		if (selected && selected.slotKey !== clickedKey) {
			moveSelected(day, period)
			return
		}

		if (itemsInCell.length === 0) {
			setSelected(null)
			return
		}

		const currentIndex = selected
			? itemsInCell.findIndex((a) => a.activityId === selected.activityId)
			: -1
		const next = itemsInCell[(currentIndex + 1) % itemsInCell.length]!
		setSelected({ activityId: next.activityId, slotKey: clickedKey })
	}

	function moveSelected(day: DayOfWeek, period: number) {
		if (!selected) return
		const index = findAssignmentIndex(selected)
		if (index === -1) {
			setSelected(null)
			return
		}
		const assignment = assignments[index]!
		if (assignment.locked) return
		if (period + (assignment.duration ?? 1) > periods) return
		const next = [...assignments]
		next[index] = { ...assignment, timeSlot: { day, period } }
		setAssignments(next)
		setSelected({ activityId: assignment.activityId, slotKey: timeSlotKey({ day, period }) })
	}

	function toggleLock() {
		if (!selected) return
		const index = findAssignmentIndex(selected)
		if (index === -1) return
		const next = [...assignments]
		next[index] = { ...next[index]!, locked: !next[index]!.locked }
		setAssignments(next)
	}

	const selectedAssignment = selected ? (assignments[findAssignmentIndex(selected)] ?? null) : null
	const selectedActivity = selectedAssignment
		? (project.activities.find((a) => a.id === selectedAssignment.activityId) ?? null)
		: null

	const gridCells = useMemo(() => {
		const memoDays = project.calendar.activeDays
		const memoDayLabels = memoDays.map((d) => translateDayNameShort(d, locale))
		const dayToLabel = Object.fromEntries(memoDays.map((d, i) => [d, memoDayLabels[i]!]))
		const cells = new Map<string, TimetableCell[]>()

		for (const assignment of filteredAssignments) {
			const activity = project.activities.find((a) => a.id === assignment.activityId)
			if (!activity) continue

			const key = `${dayToLabel[assignment.timeSlot.day]}:${assignment.timeSlot.period}`
			const slotKey = timeSlotKey(assignment.timeSlot)
			const hasConflict = conflictSlotKeys.has(slotKey)

			let sublabel: string | undefined
			switch (viewMode) {
				case "class": {
					const teacherNames = activity.teacherIds
						.map((id) => project.teachers.find((t) => t.id === id)?.shortName)
						.filter(Boolean)
						.join(", ")
					sublabel = teacherNames || undefined
					break
				}
				case "teacher": {
					const groupNames = activity.classGroupIds
						.map((id) => {
							const group = project.classGroups.find((g) => g.id === id)
							if (!group) return null
							const cls = project.classes.find((c) => c.id === group.classId)
							return cls ? `${cls.shortName}/${group.shortName}` : group.shortName
						})
						.filter(Boolean)
						.join(", ")
					sublabel = groupNames || undefined
					break
				}
				case "classroom": {
					const teacherNames = activity.teacherIds
						.map((id) => project.teachers.find((t) => t.id === id)?.shortName)
						.filter(Boolean)
						.join(", ")
					sublabel = teacherNames || undefined
					break
				}
			}

			const isSelected =
				selected !== null &&
				selected.activityId === assignment.activityId &&
				selected.slotKey === slotKey

			const status = isSelected
				? ("selected" as const)
				: hasConflict
					? ("conflict" as const)
					: assignment.locked
						? ("locked" as const)
						: ("generated" as const)

			const existing = cells.get(key) ?? []
			existing.push({
				id: assignment.activityId,
				label: activity.subjectName,
				sublabel,
				status,
			})
			cells.set(key, existing)
		}

		return cells
	}, [filteredAssignments, viewMode, project, conflictSlotKeys, locale, selected])

	function handleTabChange(value: string) {
		const mode = value as ViewMode
		setViewMode(mode)
		setSelectedId(optionsFor(mode)[0]?.id ?? "")
		setSelected(null)
	}

	if (assignments.length === 0) {
		return (
			<div className="space-y-6">
				<h1 className="text-2xl font-bold text-text-primary">{messages.nav.timetables}</h1>
				<Card>
					<CardContent className="flex flex-col items-center gap-4 py-12">
						<CalendarDays className="h-12 w-12 text-text-muted" />
						<div className="text-center">
							<p className="text-text-primary font-medium">
								{messages.timetables.noScheduleGenerated}
							</p>
							<p className="text-sm text-text-muted mt-1">{messages.timetables.generateFirst}</p>
						</div>
						<Button variant="outline" onClick={() => navigate({ to: "/generate" })}>
							<Zap className="h-4 w-4" />
							{messages.nav.generate}
						</Button>
					</CardContent>
				</Card>
			</div>
		)
	}

	return (
		<div className="space-y-6">
			<h1 className="text-2xl font-bold text-text-primary">{messages.nav.timetables}</h1>

			<Tabs value={viewMode} onValueChange={handleTabChange}>
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<TabsList>
						<TabsTrigger value="class">
							<GraduationCap className="h-4 w-4" />
							{messages.timetables.byClass}
						</TabsTrigger>
						<TabsTrigger value="teacher">
							<Users className="h-4 w-4" />
							{messages.timetables.byTeacher}
						</TabsTrigger>
						<TabsTrigger value="classroom">
							<DoorOpen className="h-4 w-4" />
							{messages.timetables.byClassroom}
						</TabsTrigger>
					</TabsList>

					<Select
						value={selectedId}
						onValueChange={(v) => {
							setSelectedId(v)
							setSelected(null)
						}}
					>
						<SelectTrigger className="w-[220px]">
							<SelectValue placeholder={messages.timetables.selectEntity} />
						</SelectTrigger>
						<SelectContent>
							{entityOptions.map((opt) => (
								<SelectItem key={opt.id} value={opt.id}>
									{opt.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				{selectedAssignment && selectedActivity && (
					<div className="mt-4 flex items-center gap-3 rounded-md border border-status-selected/20 bg-status-selected-bg px-3 py-2">
						<span className="text-sm font-medium text-status-selected">
							{messages.timetables.selectedActivity}: {selectedActivity.subjectName}
						</span>
						<span className="text-xs text-text-muted">{messages.timetables.moveHint}</span>
						<div className="ml-auto flex gap-2">
							<Button size="sm" variant="outline" onClick={toggleLock}>
								{selectedAssignment.locked ? (
									<LockOpen className="h-4 w-4" />
								) : (
									<Lock className="h-4 w-4" />
								)}
								{selectedAssignment.locked ? messages.timetables.unlock : messages.timetables.lock}
							</Button>
							<Button size="sm" variant="ghost" onClick={() => setSelected(null)}>
								<X className="h-4 w-4" />
								{messages.timetables.deselect}
							</Button>
						</div>
					</div>
				)}

				<TabsContent value="class" className="mt-4">
					{selectedId ? (
						<Card>
							<CardHeader>
								<CardTitle>{entityOptions.find((o) => o.id === selectedId)?.label}</CardTitle>
							</CardHeader>
							<CardContent>
								<TimetableGrid
									days={dayLabels}
									periods={periods}
									cells={gridCells}
									periodLabel={messages.timetables.period}
									onCellClick={handleCellClick}
								/>
							</CardContent>
						</Card>
					) : (
						<EmptySelection message={messages.timetables.selectEntity} />
					)}
				</TabsContent>

				<TabsContent value="teacher" className="mt-4">
					{selectedId ? (
						<Card>
							<CardHeader>
								<CardTitle>{entityOptions.find((o) => o.id === selectedId)?.label}</CardTitle>
							</CardHeader>
							<CardContent>
								<TimetableGrid
									days={dayLabels}
									periods={periods}
									cells={gridCells}
									periodLabel={messages.timetables.period}
									onCellClick={handleCellClick}
								/>
							</CardContent>
						</Card>
					) : (
						<EmptySelection message={messages.timetables.selectEntity} />
					)}
				</TabsContent>

				<TabsContent value="classroom" className="mt-4">
					{selectedId ? (
						<Card>
							<CardHeader>
								<CardTitle>{entityOptions.find((o) => o.id === selectedId)?.label}</CardTitle>
							</CardHeader>
							<CardContent>
								<TimetableGrid
									days={dayLabels}
									periods={periods}
									cells={gridCells}
									periodLabel={messages.timetables.period}
									onCellClick={handleCellClick}
								/>
							</CardContent>
						</Card>
					) : (
						<EmptySelection message={messages.timetables.selectEntity} />
					)}
				</TabsContent>
			</Tabs>
		</div>
	)
}

function EmptySelection({ message }: { message: string }) {
	return (
		<Card>
			<CardContent className="flex items-center justify-center py-12">
				<p className="text-text-muted">{message}</p>
			</CardContent>
		</Card>
	)
}
