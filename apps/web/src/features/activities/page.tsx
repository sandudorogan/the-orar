import { useMessages } from "@/app/i18n/use-i18n.ts"
import { useProject } from "@/app/project-context.tsx"
import type { Activity } from "@orar/domain"
import {
	Button,
	Card,
	CardContent,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	Input,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@orar/ui"
import { Pencil, Plus, Trash2 } from "lucide-react"
import { useRef, useState } from "react"

export function ActivitiesPage() {
	const messages = useMessages()
	const { project, addActivity, updateActivity, deleteActivity } = useProject()
	const [dialogOpen, setDialogOpen] = useState(false)
	const [editing, setEditing] = useState<Activity | null>(null)
	const [selectedTeacherIds, setSelectedTeacherIds] = useState<string[]>([])
	const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([])
	const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([])
	const formRef = useRef<HTMLFormElement>(null)

	function resetSelections() {
		setSelectedTeacherIds([])
		setSelectedGroupIds([])
		setSelectedRoomIds([])
	}

	function openCreate() {
		setEditing(null)
		resetSelections()
		setDialogOpen(true)
	}

	function openEdit(activity: Activity) {
		setEditing(activity)
		setSelectedTeacherIds(activity.teacherIds)
		setSelectedGroupIds(activity.classGroupIds)
		setSelectedRoomIds(activity.preferredRoomIds)
		setDialogOpen(true)
	}

	function handleSave(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault()
		const form = new FormData(e.currentTarget)
		const name = form.get("name") as string
		const subjectName = form.get("subjectName") as string
		const duration = Number(form.get("duration") as string) || 1
		const totalPerWeek = Number(form.get("totalPerWeek") as string) || 1

		if (selectedTeacherIds.length === 0 || selectedGroupIds.length === 0) return

		const data = {
			name,
			subjectName,
			teacherIds: selectedTeacherIds,
			classGroupIds: selectedGroupIds,
			duration,
			totalPerWeek,
			preferredRoomIds: selectedRoomIds,
		}

		if (editing) {
			updateActivity(editing.id, data)
		} else {
			addActivity(data)
		}
		setDialogOpen(false)
		setEditing(null)
		resetSelections()
	}

	function toggleSelection(id: string, list: string[], setList: (ids: string[]) => void) {
		if (list.includes(id)) {
			setList(list.filter((x) => x !== id))
		} else {
			setList([...list, id])
		}
	}

	function getTeacherNames(teacherIds: string[]) {
		return teacherIds
			.map((id) => project.teachers.find((t) => t.id === id)?.shortName)
			.filter(Boolean)
			.join(", ")
	}

	function getGroupNames(groupIds: string[]) {
		return groupIds
			.map((id) => {
				const group = project.classGroups.find((g) => g.id === id)
				if (!group) return null
				const cls = project.classes.find((c) => c.id === group.classId)
				return cls ? `${cls.shortName}/${group.shortName}` : group.shortName
			})
			.filter(Boolean)
			.join(", ")
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-bold text-text-primary">{messages.activities.title}</h1>
				<Dialog
					open={dialogOpen}
					onOpenChange={(open) => {
						setDialogOpen(open)
						if (!open) {
							setEditing(null)
							resetSelections()
						}
					}}
				>
					<DialogTrigger asChild>
						<Button onClick={openCreate}>
							<Plus className="h-4 w-4" />
							{messages.activities.addActivity}
						</Button>
					</DialogTrigger>
					<DialogContent className="max-w-2xl">
						<form ref={formRef} onSubmit={handleSave}>
							<DialogHeader>
								<DialogTitle>
									{editing ? messages.activities.editActivity : messages.activities.addActivity}
								</DialogTitle>
								<DialogDescription>{messages.entities.activity}</DialogDescription>
							</DialogHeader>
							<div className="grid gap-4 py-4">
								<div className="grid grid-cols-2 gap-4">
									<div className="grid gap-2">
										<label htmlFor="act-name" className="text-sm font-medium text-text-primary">
											{messages.common.name}
										</label>
										<Input id="act-name" name="name" defaultValue={editing?.name ?? ""} required />
									</div>
									<div className="grid gap-2">
										<label htmlFor="act-subject" className="text-sm font-medium text-text-primary">
											{messages.activities.subjectName}
										</label>
										<Input
											id="act-subject"
											name="subjectName"
											defaultValue={editing?.subjectName ?? ""}
											required
										/>
									</div>
								</div>

								<fieldset className="grid gap-2">
									<legend className="text-sm font-medium text-text-primary">
										{messages.activities.assignedTeachers}
									</legend>
									<div className="flex flex-wrap gap-2 rounded-md border border-border-default p-2 min-h-[2.5rem]">
										{project.teachers.map((teacher) => (
											<button
												key={teacher.id}
												type="button"
												onClick={() =>
													toggleSelection(teacher.id, selectedTeacherIds, setSelectedTeacherIds)
												}
												aria-pressed={selectedTeacherIds.includes(teacher.id)}
												className={
													selectedTeacherIds.includes(teacher.id)
														? "inline-flex items-center rounded-md bg-action-primary px-2.5 py-1 text-xs font-medium text-action-primary-text"
														: "inline-flex items-center rounded-md bg-surface-raised px-2.5 py-1 text-xs font-medium text-text-secondary hover:bg-action-ghost-hover"
												}
											>
												{teacher.shortName}
											</button>
										))}
										{project.teachers.length === 0 && (
											<span className="text-xs text-text-muted">{messages.common.noResults}</span>
										)}
									</div>
								</fieldset>

								<fieldset className="grid gap-2">
									<legend className="text-sm font-medium text-text-primary">
										{messages.activities.assignedGroups}
									</legend>
									<div className="flex flex-wrap gap-2 rounded-md border border-border-default p-2 min-h-[2.5rem]">
										{project.classGroups.map((group) => {
											const cls = project.classes.find((c) => c.id === group.classId)
											return (
												<button
													key={group.id}
													type="button"
													onClick={() =>
														toggleSelection(group.id, selectedGroupIds, setSelectedGroupIds)
													}
													aria-pressed={selectedGroupIds.includes(group.id)}
													className={
														selectedGroupIds.includes(group.id)
															? "inline-flex items-center rounded-md bg-action-primary px-2.5 py-1 text-xs font-medium text-action-primary-text"
															: "inline-flex items-center rounded-md bg-surface-raised px-2.5 py-1 text-xs font-medium text-text-secondary hover:bg-action-ghost-hover"
													}
												>
													{cls ? `${cls.shortName}/${group.shortName}` : group.shortName}
												</button>
											)
										})}
										{project.classGroups.length === 0 && (
											<span className="text-xs text-text-muted">{messages.common.noResults}</span>
										)}
									</div>
								</fieldset>

								<div className="grid grid-cols-2 gap-4">
									<div className="grid gap-2">
										<label htmlFor="act-duration" className="text-sm font-medium text-text-primary">
											{messages.activities.duration}
										</label>
										<Input
											id="act-duration"
											name="duration"
											type="number"
											min={1}
											max={10}
											defaultValue={editing?.duration ?? 1}
											required
										/>
									</div>
									<div className="grid gap-2">
										<label htmlFor="act-perWeek" className="text-sm font-medium text-text-primary">
											{messages.activities.totalPerWeek}
										</label>
										<Input
											id="act-perWeek"
											name="totalPerWeek"
											type="number"
											min={1}
											max={20}
											defaultValue={editing?.totalPerWeek ?? 1}
											required
										/>
									</div>
								</div>

								<fieldset className="grid gap-2">
									<legend className="text-sm font-medium text-text-primary">
										{messages.activities.preferredRooms}
									</legend>
									<div className="flex flex-wrap gap-2 rounded-md border border-border-default p-2 min-h-[2.5rem]">
										{project.classrooms.map((room) => (
											<button
												key={room.id}
												type="button"
												onClick={() =>
													toggleSelection(room.id, selectedRoomIds, setSelectedRoomIds)
												}
												aria-pressed={selectedRoomIds.includes(room.id)}
												className={
													selectedRoomIds.includes(room.id)
														? "inline-flex items-center rounded-md bg-action-primary px-2.5 py-1 text-xs font-medium text-action-primary-text"
														: "inline-flex items-center rounded-md bg-surface-raised px-2.5 py-1 text-xs font-medium text-text-secondary hover:bg-action-ghost-hover"
												}
											>
												{room.shortName}
											</button>
										))}
										{project.classrooms.length === 0 && (
											<span className="text-xs text-text-muted">{messages.common.noResults}</span>
										)}
									</div>
								</fieldset>
							</div>
							<DialogFooter>
								<Button type="submit">{messages.common.save}</Button>
							</DialogFooter>
						</form>
					</DialogContent>
				</Dialog>
			</div>

			<Card>
				<CardContent className="p-0">
					{project.activities.length === 0 ? (
						<p className="p-6 text-center text-text-muted">{messages.activities.noActivities}</p>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>{messages.common.name}</TableHead>
									<TableHead>{messages.activities.subjectName}</TableHead>
									<TableHead>{messages.activities.assignedTeachers}</TableHead>
									<TableHead>{messages.activities.assignedGroups}</TableHead>
									<TableHead>{messages.activities.duration}</TableHead>
									<TableHead>{messages.activities.totalPerWeek}</TableHead>
									<TableHead className="w-24">{messages.common.actions}</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{project.activities.map((activity) => (
									<TableRow key={activity.id}>
										<TableCell className="font-medium">{activity.name}</TableCell>
										<TableCell>{activity.subjectName}</TableCell>
										<TableCell>{getTeacherNames(activity.teacherIds) || "-"}</TableCell>
										<TableCell>{getGroupNames(activity.classGroupIds) || "-"}</TableCell>
										<TableCell>{activity.duration}</TableCell>
										<TableCell>{activity.totalPerWeek}</TableCell>
										<TableCell>
											<div className="flex gap-1">
												<Button variant="ghost" size="icon" onClick={() => openEdit(activity)}>
													<Pencil className="h-4 w-4" />
												</Button>
												<Button
													variant="ghost"
													size="icon"
													onClick={() => deleteActivity(activity.id)}
												>
													<Trash2 className="h-4 w-4 text-action-destructive" />
												</Button>
											</div>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>
		</div>
	)
}
