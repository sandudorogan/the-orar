import { useLocale, useMessages } from "@/app/i18n/use-i18n.ts"
import { useProject } from "@/app/project-context.tsx"
import type { AvailabilityRule } from "@orar/domain"
import type { AvailabilityTarget as AvailabilityTargetValue } from "@orar/domain"
import type { DayOfWeek as DayOfWeekType, TimeSlot } from "@orar/domain"
import { translateDayNameShort } from "@orar/locales"
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
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
	cn,
} from "@orar/ui"
import { Plus, Trash2 } from "lucide-react"
import { useState } from "react"

export function ConstraintsPanel({ embedded = false }: { embedded?: boolean }) {
	const messages = useMessages()
	const { locale } = useLocale()
	const { project, addAvailabilityRule, deleteAvailabilityRule } = useProject()
	const [dialogOpen, setDialogOpen] = useState(false)
	const [targetType, setTargetType] = useState<AvailabilityTargetValue>("teacher")
	const [targetId, setTargetId] = useState("")
	const [ruleType, setRuleType] = useState<"unavailable" | "preferred">("unavailable")
	const [selectedSlots, setSelectedSlots] = useState<TimeSlot[]>([])

	const activeDays = project.calendar.activeDays
	const periods = Array.from({ length: project.calendar.periodsPerDay }, (_, i) => i)

	function getTargetOptions() {
		switch (targetType) {
			case "teacher":
				return project.teachers.map((t) => ({ id: t.id, label: t.name }))
			case "class":
				return project.classes.map((c) => ({ id: c.id, label: c.name }))
			case "classGroup":
				return project.classGroups.map((g) => {
					const cls = project.classes.find((c) => c.id === g.classId)
					return { id: g.id, label: cls ? `${cls.shortName}/${g.name}` : g.name }
				})
			case "classroom":
				return project.classrooms.map((r) => ({ id: r.id, label: r.name }))
		}
	}

	function toggleSlot(day: DayOfWeekType, period: number) {
		const exists = selectedSlots.find((s) => s.day === day && s.period === period)
		if (exists) {
			setSelectedSlots(selectedSlots.filter((s) => !(s.day === day && s.period === period)))
		} else {
			setSelectedSlots([...selectedSlots, { day, period }])
		}
	}

	function isSlotSelected(day: DayOfWeekType, period: number) {
		return selectedSlots.some((s) => s.day === day && s.period === period)
	}

	function handleSave() {
		if (!targetId || selectedSlots.length === 0) return
		addAvailabilityRule({
			targetType,
			targetId,
			type: ruleType,
			timeSlots: selectedSlots,
		})
		setDialogOpen(false)
		setTargetId("")
		setSelectedSlots([])
	}

	function getTargetName(rule: AvailabilityRule) {
		switch (rule.targetType) {
			case "teacher":
				return project.teachers.find((t) => t.id === rule.targetId)?.name ?? rule.targetId
			case "class":
				return project.classes.find((c) => c.id === rule.targetId)?.name ?? rule.targetId
			case "classGroup": {
				const g = project.classGroups.find((cg) => cg.id === rule.targetId)
				if (!g) return rule.targetId
				const cls = project.classes.find((c) => c.id === g.classId)
				return cls ? `${cls.shortName}/${g.name}` : g.name
			}
			case "classroom":
				return project.classrooms.find((r) => r.id === rule.targetId)?.name ?? rule.targetId
		}
	}

	const targetOptions = getTargetOptions()

	return (
		<div className="space-y-6">
			<div className={cn("flex items-center gap-4", embedded ? "justify-end" : "justify-between")}>
				{!embedded && (
					<h1 className="text-2xl font-bold text-text-primary">{messages.constraints.title}</h1>
				)}
				<Dialog
					open={dialogOpen}
					onOpenChange={(open) => {
						setDialogOpen(open)
						if (!open) {
							setTargetId("")
							setSelectedSlots([])
						}
					}}
				>
					<DialogTrigger asChild>
						<Button>
							<Plus className="h-4 w-4" />
							{messages.constraints.addRule}
						</Button>
					</DialogTrigger>
					<DialogContent className="max-w-2xl">
						<DialogHeader>
							<DialogTitle>{messages.constraints.addRule}</DialogTitle>
							<DialogDescription>{messages.constraints.title}</DialogDescription>
						</DialogHeader>
						<div className="grid gap-4 py-4">
							<div className="grid grid-cols-3 gap-4">
								<div className="grid gap-2">
									<span className="text-sm font-medium text-text-primary">
										{messages.constraints.targetType}
									</span>
									<Select
										value={targetType}
										onValueChange={(v) => {
											setTargetType(v as AvailabilityTargetValue)
											setTargetId("")
										}}
									>
										<SelectTrigger aria-label={messages.constraints.targetType}>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="teacher">{messages.entities.teacher}</SelectItem>
											<SelectItem value="class">{messages.entities.class_}</SelectItem>
											<SelectItem value="classGroup">{messages.entities.classGroup}</SelectItem>
											<SelectItem value="classroom">{messages.entities.classroom}</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div className="grid gap-2">
									<span className="text-sm font-medium text-text-primary">
										{messages.constraints.target}
									</span>
									<Select value={targetId} onValueChange={setTargetId}>
										<SelectTrigger aria-label={messages.constraints.target}>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{targetOptions.map((opt) => (
												<SelectItem key={opt.id} value={opt.id}>
													{opt.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								<div className="grid gap-2">
									<span className="text-sm font-medium text-text-primary">
										{messages.constraints.type}
									</span>
									<Select
										value={ruleType}
										onValueChange={(v) => setRuleType(v as "unavailable" | "preferred")}
									>
										<SelectTrigger aria-label={messages.constraints.type}>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="unavailable">
												{messages.availability.unavailable}
											</SelectItem>
											<SelectItem value="preferred">{messages.availability.preferred}</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>

							<fieldset className="grid gap-2">
								<legend className="text-sm font-medium text-text-primary">
									{messages.constraints.timeSlots}
								</legend>
								<div className="overflow-auto rounded-md border border-border-default">
									<table className="w-full text-sm">
										<thead>
											<tr>
												<th className="p-2 text-left text-text-secondary" />
												{activeDays.map((day) => (
													<th key={day} className="p-2 text-center text-text-secondary font-medium">
														{translateDayNameShort(day, locale)}
													</th>
												))}
											</tr>
										</thead>
										<tbody>
											{periods.map((period) => (
												<tr key={period}>
													<td className="p-2 text-text-secondary font-medium">{period + 1}</td>
													{activeDays.map((day) => (
														<td key={`${day}-${period}`} className="p-1 text-center">
															<button
																type="button"
																onClick={() => toggleSlot(day, period)}
																className={
																	isSlotSelected(day, period)
																		? ruleType === "unavailable"
																			? "h-8 w-full rounded bg-action-destructive text-action-destructive-text text-xs"
																			: "h-8 w-full rounded bg-feedback-success text-white text-xs"
																		: "h-8 w-full rounded border border-border-subtle hover:bg-action-ghost-hover text-xs"
																}
															>
																{isSlotSelected(day, period)
																	? ruleType === "unavailable"
																		? "X"
																		: "P"
																	: ""}
															</button>
														</td>
													))}
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</fieldset>
						</div>
						<DialogFooter>
							<Button onClick={handleSave}>{messages.common.save}</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>

			<Card>
				<CardContent className="p-0">
					{project.availabilityRules.length === 0 ? (
						<p className="p-6 text-center text-text-muted">{messages.constraints.noRules}</p>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>{messages.constraints.targetType}</TableHead>
									<TableHead>{messages.constraints.target}</TableHead>
									<TableHead>{messages.constraints.type}</TableHead>
									<TableHead>{messages.constraints.timeSlots}</TableHead>
									<TableHead className="w-16">{messages.common.actions}</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{project.availabilityRules.map((rule) => (
									<TableRow key={rule.id}>
										<TableCell className="capitalize">{rule.targetType}</TableCell>
										<TableCell className="font-medium">{getTargetName(rule)}</TableCell>
										<TableCell>
											<span
												className={
													rule.type === "unavailable"
														? "inline-flex items-center rounded-md bg-feedback-error-bg px-2 py-0.5 text-xs font-medium text-feedback-error"
														: "inline-flex items-center rounded-md bg-feedback-success-bg px-2 py-0.5 text-xs font-medium text-feedback-success"
												}
											>
												{rule.type === "unavailable"
													? messages.availability.unavailable
													: messages.availability.preferred}
											</span>
										</TableCell>
										<TableCell className="text-text-secondary">{rule.timeSlots.length}</TableCell>
										<TableCell>
											<Button
												variant="ghost"
												size="icon"
												onClick={() => deleteAvailabilityRule(rule.id)}
											>
												<Trash2 className="h-4 w-4 text-action-destructive" />
											</Button>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>

			{project.availabilityRules.length > 0 && (
				<AvailabilityGrid project={project} activeDays={activeDays} periods={periods} />
			)}
		</div>
	)
}

function AvailabilityGrid({
	project,
	activeDays,
	periods,
}: {
	project: ReturnType<typeof useProject>["project"]
	activeDays: DayOfWeekType[]
	periods: number[]
}) {
	const messages = useMessages()
	const { locale } = useLocale()

	function getSlotStatus(targetType: string, targetId: string, day: DayOfWeekType, period: number) {
		for (const rule of project.availabilityRules) {
			if (rule.targetType === targetType && rule.targetId === targetId) {
				if (rule.timeSlots.some((s) => s.day === day && s.period === period)) {
					return rule.type
				}
			}
		}
		return null
	}

	const teachers = project.teachers.slice(0, 10)

	if (teachers.length === 0) return null

	return (
		<Card>
			<CardHeader>
				<CardTitle>
					{messages.entities.teacher} {messages.availability.available.toLowerCase()}
				</CardTitle>
			</CardHeader>
			<CardContent className="overflow-auto">
				<table className="w-full text-xs">
					<thead>
						<tr>
							<th className="p-2 text-left text-text-secondary" />
							{activeDays.map((day) => (
								<th
									key={day}
									colSpan={periods.length}
									className="p-1 text-center text-text-secondary font-medium border-l border-border-subtle"
								>
									{translateDayNameShort(day, locale)}
								</th>
							))}
						</tr>
						<tr>
							<th className="p-1" />
							{activeDays.map((day) =>
								periods.map((p) => (
									<th
										key={`${day}-${p}`}
										className="p-1 text-center text-text-muted font-normal border-l border-border-subtle w-6"
									>
										{p + 1}
									</th>
								)),
							)}
						</tr>
					</thead>
					<tbody>
						{teachers.map((teacher) => (
							<tr key={teacher.id}>
								<td className="p-1 pr-3 text-text-primary font-medium whitespace-nowrap">
									{teacher.shortName}
								</td>
								{activeDays.map((day) =>
									periods.map((period) => {
										const status = getSlotStatus("teacher", teacher.id, day, period)
										return (
											<td
												key={`${day}-${period}`}
												className={
													status === "unavailable"
														? "p-0.5 border border-border-subtle bg-feedback-error-bg"
														: status === "preferred"
															? "p-0.5 border border-border-subtle bg-feedback-success-bg"
															: "p-0.5 border border-border-subtle"
												}
											>
												<div className="h-4 w-full" />
											</td>
										)
									}),
								)}
							</tr>
						))}
					</tbody>
				</table>
			</CardContent>
		</Card>
	)
}

export function ConstraintsPage() {
	return <ConstraintsPanel />
}
