import { useMessages } from "@/app/i18n/use-i18n.ts"
import { useProject } from "@/app/project-context.tsx"
import type { Classroom } from "@orar/domain"
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
	cn,
} from "@orar/ui"
import { Pencil, Plus, Trash2 } from "lucide-react"
import { useState } from "react"

export function ClassroomsPanel({ embedded = false }: { embedded?: boolean }) {
	const messages = useMessages()
	const { project, addClassroom, updateClassroom, deleteClassroom } = useProject()
	const [dialogOpen, setDialogOpen] = useState(false)
	const [editing, setEditing] = useState<Classroom | null>(null)

	function handleSave(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault()
		const form = new FormData(e.currentTarget)
		const name = form.get("name") as string
		const shortName = form.get("shortName") as string
		const capacity = form.get("capacity") as string
		const building = (form.get("building") as string) || undefined
		const tagsRaw = form.get("tags") as string

		const data = {
			name,
			shortName,
			capacity: capacity ? Number(capacity) : undefined,
			building,
			tags: tagsRaw
				? tagsRaw
						.split(",")
						.map((t) => t.trim())
						.filter(Boolean)
				: [],
		}

		if (editing) {
			updateClassroom(editing.id, data)
		} else {
			addClassroom(data)
		}
		setDialogOpen(false)
		setEditing(null)
	}

	function openEdit(classroom: Classroom) {
		setEditing(classroom)
		setDialogOpen(true)
	}

	return (
		<div className="space-y-6">
			<div className={cn("flex items-center gap-4", embedded ? "justify-end" : "justify-between")}>
				{!embedded && (
					<h1 className="text-2xl font-bold text-text-primary">{messages.classrooms.title}</h1>
				)}
				<Dialog
					open={dialogOpen}
					onOpenChange={(open) => {
						setDialogOpen(open)
						if (!open) setEditing(null)
					}}
				>
					<DialogTrigger asChild>
						<Button>
							<Plus className="h-4 w-4" />
							{messages.classrooms.addClassroom}
						</Button>
					</DialogTrigger>
					<DialogContent>
						<form onSubmit={handleSave}>
							<DialogHeader>
								<DialogTitle>
									{editing ? messages.classrooms.editClassroom : messages.classrooms.addClassroom}
								</DialogTitle>
								<DialogDescription>{messages.entities.classroom}</DialogDescription>
							</DialogHeader>
							<div className="grid gap-4 py-4">
								<div className="grid gap-2">
									<label htmlFor="room-name" className="text-sm font-medium text-text-primary">
										{messages.common.name}
									</label>
									<Input id="room-name" name="name" defaultValue={editing?.name ?? ""} required />
								</div>
								<div className="grid gap-2">
									<label htmlFor="room-shortName" className="text-sm font-medium text-text-primary">
										{messages.common.shortName}
									</label>
									<Input
										id="room-shortName"
										name="shortName"
										maxLength={10}
										defaultValue={editing?.shortName ?? ""}
										required
									/>
								</div>
								<div className="grid grid-cols-2 gap-4">
									<div className="grid gap-2">
										<label
											htmlFor="room-capacity"
											className="text-sm font-medium text-text-primary"
										>
											{messages.classrooms.capacity}
										</label>
										<Input
											id="room-capacity"
											name="capacity"
											type="number"
											min={0}
											defaultValue={editing?.capacity ?? ""}
										/>
									</div>
									<div className="grid gap-2">
										<label
											htmlFor="room-building"
											className="text-sm font-medium text-text-primary"
										>
											{messages.classrooms.building}
										</label>
										<Input
											id="room-building"
											name="building"
											defaultValue={editing?.building ?? ""}
										/>
									</div>
								</div>
								<div className="grid gap-2">
									<label htmlFor="room-tags" className="text-sm font-medium text-text-primary">
										{messages.classrooms.tags}
									</label>
									<Input
										id="room-tags"
										name="tags"
										placeholder="lab, projector, computers"
										defaultValue={editing?.tags?.join(", ") ?? ""}
									/>
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
					{project.classrooms.length === 0 ? (
						<p className="p-6 text-center text-text-muted">{messages.classrooms.noClassrooms}</p>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>{messages.common.name}</TableHead>
									<TableHead>{messages.common.shortName}</TableHead>
									<TableHead>{messages.classrooms.capacity}</TableHead>
									<TableHead>{messages.classrooms.building}</TableHead>
									<TableHead>{messages.classrooms.tags}</TableHead>
									<TableHead className="w-24">{messages.common.actions}</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{project.classrooms.map((room) => (
									<TableRow key={room.id}>
										<TableCell className="font-medium">{room.name}</TableCell>
										<TableCell>{room.shortName}</TableCell>
										<TableCell>{room.capacity ?? "-"}</TableCell>
										<TableCell>{room.building ?? "-"}</TableCell>
										<TableCell>
											{room.tags.length > 0 ? (
												<div className="flex flex-wrap gap-1">
													{room.tags.map((tag) => (
														<span
															key={tag}
															className="inline-flex items-center rounded-md bg-action-secondary px-2 py-0.5 text-xs text-action-secondary-text"
														>
															{tag}
														</span>
													))}
												</div>
											) : (
												"-"
											)}
										</TableCell>
										<TableCell>
											<div className="flex gap-1">
												<Button variant="ghost" size="icon" onClick={() => openEdit(room)}>
													<Pencil className="h-4 w-4" />
												</Button>
												<Button
													variant="ghost"
													size="icon"
													onClick={() => deleteClassroom(room.id)}
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

export function ClassroomsPage() {
	return <ClassroomsPanel />
}
