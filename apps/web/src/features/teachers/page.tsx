import { useMessages } from "@/app/i18n/use-i18n.ts"
import { useProject } from "@/app/project-context.tsx"
import type { Teacher } from "@orar/domain"
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

export function TeachersPanel({ embedded = false }: { embedded?: boolean }) {
	const messages = useMessages()
	const { project, addTeacher, updateTeacher, deleteTeacher } = useProject()
	const [dialogOpen, setDialogOpen] = useState(false)
	const [editing, setEditing] = useState<Teacher | null>(null)

	function handleSave(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault()
		const form = new FormData(e.currentTarget)
		const name = form.get("name") as string
		const shortName = form.get("shortName") as string
		const email = (form.get("email") as string) || undefined
		const maxHoursPerDay = form.get("maxHoursPerDay") as string
		const maxHoursPerWeek = form.get("maxHoursPerWeek") as string

		const data = {
			name,
			shortName,
			email,
			maxHoursPerDay: maxHoursPerDay ? Number(maxHoursPerDay) : undefined,
			maxHoursPerWeek: maxHoursPerWeek ? Number(maxHoursPerWeek) : undefined,
		}

		if (editing) {
			updateTeacher(editing.id, data)
		} else {
			addTeacher(data)
		}
		setDialogOpen(false)
		setEditing(null)
	}

	function openEdit(teacher: Teacher) {
		setEditing(teacher)
		setDialogOpen(true)
	}

	return (
		<div className="space-y-6">
			<div className={cn("flex items-center gap-4", embedded ? "justify-end" : "justify-between")}>
				{!embedded && (
					<h1 className="text-2xl font-bold text-text-primary">{messages.teachers.title}</h1>
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
							{messages.teachers.addTeacher}
						</Button>
					</DialogTrigger>
					<DialogContent>
						<form onSubmit={handleSave}>
							<DialogHeader>
								<DialogTitle>
									{editing ? messages.teachers.editTeacher : messages.teachers.addTeacher}
								</DialogTitle>
								<DialogDescription>{messages.entities.teacher}</DialogDescription>
							</DialogHeader>
							<div className="grid gap-4 py-4">
								<div className="grid gap-2">
									<label htmlFor="teacher-name" className="text-sm font-medium text-text-primary">
										{messages.common.name}
									</label>
									<Input
										id="teacher-name"
										name="name"
										defaultValue={editing?.name ?? ""}
										required
									/>
								</div>
								<div className="grid gap-2">
									<label
										htmlFor="teacher-shortName"
										className="text-sm font-medium text-text-primary"
									>
										{messages.common.shortName}
									</label>
									<Input
										id="teacher-shortName"
										name="shortName"
										maxLength={10}
										defaultValue={editing?.shortName ?? ""}
										required
									/>
								</div>
								<div className="grid gap-2">
									<label htmlFor="teacher-email" className="text-sm font-medium text-text-primary">
										{messages.teachers.email}
									</label>
									<Input
										id="teacher-email"
										name="email"
										type="email"
										defaultValue={editing?.email ?? ""}
									/>
								</div>
								<div className="grid grid-cols-2 gap-4">
									<div className="grid gap-2">
										<label
											htmlFor="teacher-maxDay"
											className="text-sm font-medium text-text-primary"
										>
											{messages.teachers.maxHoursDay}
										</label>
										<Input
											id="teacher-maxDay"
											name="maxHoursPerDay"
											type="number"
											min={1}
											max={20}
											defaultValue={editing?.maxHoursPerDay ?? ""}
										/>
									</div>
									<div className="grid gap-2">
										<label
											htmlFor="teacher-maxWeek"
											className="text-sm font-medium text-text-primary"
										>
											{messages.teachers.maxHoursWeek}
										</label>
										<Input
											id="teacher-maxWeek"
											name="maxHoursPerWeek"
											type="number"
											min={1}
											max={60}
											defaultValue={editing?.maxHoursPerWeek ?? ""}
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
					{project.teachers.length === 0 ? (
						<p className="p-6 text-center text-text-muted">{messages.teachers.noTeachers}</p>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>{messages.common.name}</TableHead>
									<TableHead>{messages.common.shortName}</TableHead>
									<TableHead>{messages.teachers.email}</TableHead>
									<TableHead>{messages.teachers.maxHoursDay}</TableHead>
									<TableHead>{messages.teachers.maxHoursWeek}</TableHead>
									<TableHead className="w-24">{messages.common.actions}</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{project.teachers.map((teacher) => (
									<TableRow key={teacher.id}>
										<TableCell className="font-medium">{teacher.name}</TableCell>
										<TableCell>{teacher.shortName}</TableCell>
										<TableCell>{teacher.email ?? "-"}</TableCell>
										<TableCell>{teacher.maxHoursPerDay ?? "-"}</TableCell>
										<TableCell>{teacher.maxHoursPerWeek ?? "-"}</TableCell>
										<TableCell>
											<div className="flex gap-1">
												<Button variant="ghost" size="icon" onClick={() => openEdit(teacher)}>
													<Pencil className="h-4 w-4" />
												</Button>
												<Button
													variant="ghost"
													size="icon"
													onClick={() => deleteTeacher(teacher.id)}
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

export function TeachersPage() {
	return <TeachersPanel />
}
