import { useMessages } from "@/app/i18n/use-i18n.ts"
import { useProject } from "@/app/project-context.tsx"
import type { Class, ClassGroup } from "@orar/domain"
import {
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
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
import { useState } from "react"

export function ClassesPage() {
	const messages = useMessages()
	const {
		project,
		addClass,
		updateClass,
		deleteClass,
		addClassGroup,
		updateClassGroup,
		deleteClassGroup,
	} = useProject()
	const [selectedClassId, setSelectedClassId] = useState<string | null>(null)
	const [classDialogOpen, setClassDialogOpen] = useState(false)
	const [editingClass, setEditingClass] = useState<Class | null>(null)
	const [groupDialogOpen, setGroupDialogOpen] = useState(false)
	const [editingGroup, setEditingGroup] = useState<ClassGroup | null>(null)

	const selectedClass = project.classes.find((c) => c.id === selectedClassId)
	const groupsForSelected = project.classGroups.filter((g) => g.classId === selectedClassId)

	function handleSaveClass(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault()
		const form = new FormData(e.currentTarget)
		const name = form.get("name") as string
		const shortName = form.get("shortName") as string
		const year = form.get("year") as string
		const studentCount = form.get("studentCount") as string

		const data = {
			name,
			shortName,
			year: year ? Number(year) : undefined,
			studentCount: studentCount ? Number(studentCount) : undefined,
		}

		if (editingClass) {
			updateClass(editingClass.id, data)
		} else {
			addClass(data)
		}
		setClassDialogOpen(false)
		setEditingClass(null)
	}

	function handleSaveGroup(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault()
		if (!selectedClassId) return
		const form = new FormData(e.currentTarget)
		const name = form.get("name") as string
		const shortName = form.get("shortName") as string
		const studentCount = form.get("studentCount") as string

		if (editingGroup) {
			updateClassGroup(editingGroup.id, {
				name,
				shortName,
				studentCount: studentCount ? Number(studentCount) : undefined,
			})
		} else {
			addClassGroup({
				classId: selectedClassId,
				name,
				shortName,
				studentCount: studentCount ? Number(studentCount) : undefined,
			})
		}
		setGroupDialogOpen(false)
		setEditingGroup(null)
	}

	function openEditClass(cls: Class) {
		setEditingClass(cls)
		setClassDialogOpen(true)
	}

	function openEditGroup(group: ClassGroup) {
		setEditingGroup(group)
		setGroupDialogOpen(true)
	}

	function getGroupCount(classId: string) {
		return project.classGroups.filter((g) => g.classId === classId).length
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-bold text-text-primary">{messages.classes.title}</h1>
				<Dialog
					open={classDialogOpen}
					onOpenChange={(open) => {
						setClassDialogOpen(open)
						if (!open) setEditingClass(null)
					}}
				>
					<DialogTrigger asChild>
						<Button>
							<Plus className="h-4 w-4" />
							{messages.classes.addClass}
						</Button>
					</DialogTrigger>
					<DialogContent>
						<form onSubmit={handleSaveClass}>
							<DialogHeader>
								<DialogTitle>
									{editingClass ? messages.classes.editClass : messages.classes.addClass}
								</DialogTitle>
								<DialogDescription>{messages.entities.class_}</DialogDescription>
							</DialogHeader>
							<div className="grid gap-4 py-4">
								<div className="grid gap-2">
									<label htmlFor="class-name" className="text-sm font-medium text-text-primary">
										{messages.common.name}
									</label>
									<Input
										id="class-name"
										name="name"
										defaultValue={editingClass?.name ?? ""}
										required
									/>
								</div>
								<div className="grid gap-2">
									<label
										htmlFor="class-shortName"
										className="text-sm font-medium text-text-primary"
									>
										{messages.common.shortName}
									</label>
									<Input
										id="class-shortName"
										name="shortName"
										maxLength={10}
										defaultValue={editingClass?.shortName ?? ""}
										required
									/>
								</div>
								<div className="grid grid-cols-2 gap-4">
									<div className="grid gap-2">
										<label htmlFor="class-year" className="text-sm font-medium text-text-primary">
											{messages.classes.year}
										</label>
										<Input
											id="class-year"
											name="year"
											type="number"
											min={1}
											defaultValue={editingClass?.year ?? ""}
										/>
									</div>
									<div className="grid gap-2">
										<label
											htmlFor="class-studentCount"
											className="text-sm font-medium text-text-primary"
										>
											{messages.classes.studentCount}
										</label>
										<Input
											id="class-studentCount"
											name="studentCount"
											type="number"
											min={0}
											defaultValue={editingClass?.studentCount ?? ""}
										/>
									</div>
								</div>
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
					{project.classes.length === 0 ? (
						<p className="p-6 text-center text-text-muted">{messages.classes.noClasses}</p>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>{messages.common.name}</TableHead>
									<TableHead>{messages.common.shortName}</TableHead>
									<TableHead>{messages.classes.year}</TableHead>
									<TableHead>{messages.classes.groupCount}</TableHead>
									<TableHead className="w-24">{messages.common.actions}</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{project.classes.map((cls) => (
									<TableRow
										key={cls.id}
										className="cursor-pointer"
										data-state={cls.id === selectedClassId ? "selected" : undefined}
										onClick={() => setSelectedClassId(cls.id)}
									>
										<TableCell className="font-medium">{cls.name}</TableCell>
										<TableCell>{cls.shortName}</TableCell>
										<TableCell>{cls.year ?? "-"}</TableCell>
										<TableCell>{getGroupCount(cls.id)}</TableCell>
										<TableCell>
											<div className="flex gap-1">
												<Button
													variant="ghost"
													size="icon"
													onClick={(e) => {
														e.stopPropagation()
														openEditClass(cls)
													}}
												>
													<Pencil className="h-4 w-4" />
												</Button>
												<Button
													variant="ghost"
													size="icon"
													onClick={(e) => {
														e.stopPropagation()
														deleteClass(cls.id)
													}}
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

			<Card>
				<CardHeader className="flex-row items-center justify-between space-y-0">
					<CardTitle>
						{messages.classes.groups}
						{selectedClass && ` - ${selectedClass.name}`}
					</CardTitle>
					{selectedClassId && (
						<Dialog
							open={groupDialogOpen}
							onOpenChange={(open) => {
								setGroupDialogOpen(open)
								if (!open) setEditingGroup(null)
							}}
						>
							<DialogTrigger asChild>
								<Button size="sm">
									<Plus className="h-4 w-4" />
									{messages.classes.addGroup}
								</Button>
							</DialogTrigger>
							<DialogContent>
								<form onSubmit={handleSaveGroup}>
									<DialogHeader>
										<DialogTitle>
											{editingGroup ? messages.classes.editGroup : messages.classes.addGroup}
										</DialogTitle>
										<DialogDescription>{messages.entities.classGroup}</DialogDescription>
									</DialogHeader>
									<div className="grid gap-4 py-4">
										<div className="grid gap-2">
											<label htmlFor="group-name" className="text-sm font-medium text-text-primary">
												{messages.common.name}
											</label>
											<Input
												id="group-name"
												name="name"
												defaultValue={editingGroup?.name ?? ""}
												required
											/>
										</div>
										<div className="grid gap-2">
											<label
												htmlFor="group-shortName"
												className="text-sm font-medium text-text-primary"
											>
												{messages.common.shortName}
											</label>
											<Input
												id="group-shortName"
												name="shortName"
												maxLength={10}
												defaultValue={editingGroup?.shortName ?? ""}
												required
											/>
										</div>
										<div className="grid gap-2">
											<label
												htmlFor="group-studentCount"
												className="text-sm font-medium text-text-primary"
											>
												{messages.classes.studentCount}
											</label>
											<Input
												id="group-studentCount"
												name="studentCount"
												type="number"
												min={0}
												defaultValue={editingGroup?.studentCount ?? ""}
											/>
										</div>
									</div>
									<DialogFooter>
										<Button type="submit">{messages.common.save}</Button>
									</DialogFooter>
								</form>
							</DialogContent>
						</Dialog>
					)}
				</CardHeader>
				<CardContent className="p-0">
					{!selectedClassId ? (
						<p className="p-6 text-center text-text-muted">{messages.classes.selectClass}</p>
					) : groupsForSelected.length === 0 ? (
						<p className="p-6 text-center text-text-muted">{messages.classes.noGroups}</p>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>{messages.common.name}</TableHead>
									<TableHead>{messages.common.shortName}</TableHead>
									<TableHead>{messages.classes.studentCount}</TableHead>
									<TableHead className="w-24">{messages.common.actions}</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{groupsForSelected.map((group) => (
									<TableRow key={group.id}>
										<TableCell className="font-medium">{group.name}</TableCell>
										<TableCell>{group.shortName}</TableCell>
										<TableCell>{group.studentCount ?? "-"}</TableCell>
										<TableCell>
											<div className="flex gap-1">
												<Button variant="ghost" size="icon" onClick={() => openEditGroup(group)}>
													<Pencil className="h-4 w-4" />
												</Button>
												<Button
													variant="ghost"
													size="icon"
													onClick={() => deleteClassGroup(group.id)}
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
