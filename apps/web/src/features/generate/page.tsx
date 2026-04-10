import { useMessages } from "@/app/i18n/use-i18n.ts"
import { useProject } from "@/app/project-context.tsx"
import { GenerationClient } from "@/shared/generation/worker-client.ts"
import type { Assignment, Conflict } from "@orar/domain"
import { detectConflicts } from "@orar/domain"
import type { SolverConfig, SolverResponse } from "@orar/solver"
import { DEFAULT_SOLVER_CONFIG } from "@orar/solver"
import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Input,
	cn,
} from "@orar/ui"
import {
	AlertTriangle,
	CheckCircle,
	Clock,
	Loader2,
	Play,
	ShieldAlert,
	ShieldCheck,
	Square,
	Zap,
} from "lucide-react"
import { useCallback, useRef, useState } from "react"

type GenerationStatus = "idle" | "running" | "completed" | "failed" | "cancelled"

interface GenerationState {
	status: GenerationStatus
	progress: number
	placedCount: number
	totalCount: number
	fitness: number | null
	assignments: Assignment[]
	conflicts: Conflict[]
	errorMessage: string | null
}

const initialState: GenerationState = {
	status: "idle",
	progress: 0,
	placedCount: 0,
	totalCount: 0,
	fitness: null,
	assignments: [],
	conflicts: [],
	errorMessage: null,
}

export function GeneratePage() {
	const messages = useMessages()
	const { project, setAssignments: setGlobalAssignments } = useProject()
	const clientRef = useRef<GenerationClient | null>(null)

	const [state, setState] = useState<GenerationState>(initialState)
	const [config, setConfig] = useState<SolverConfig>({ ...DEFAULT_SOLVER_CONFIG })

	const handleResponse = useCallback(
		(response: SolverResponse) => {
			switch (response.type) {
				case "progress":
					setState((prev) => ({
						...prev,
						progress: response.progress,
						placedCount: response.placedCount,
						totalCount: response.totalCount,
					}))
					break
				case "partial":
					setState((prev) => ({
						...prev,
						assignments: response.assignments,
						fitness: response.fitness,
					}))
					break
				case "complete": {
					const conflicts = detectConflicts({
						calendar: project.calendar,
						classes: project.classes,
						classGroups: project.classGroups,
						teachers: project.teachers,
						classrooms: project.classrooms,
						activities: project.activities,
						availabilityRules: project.availabilityRules,
						assignments: response.assignments,
					})
					setGlobalAssignments(response.assignments)
					setState((prev) => ({
						...prev,
						status: "completed",
						assignments: response.assignments,
						fitness: response.fitness,
						placedCount: response.assignments.length,
						progress: 1,
						conflicts,
					}))
					break
				}
				case "failed":
					setState((prev) => ({
						...prev,
						status: "failed",
						errorMessage: response.reason,
					}))
					break
				case "cancelled":
					setState((prev) => ({
						...prev,
						status: "cancelled",
					}))
					break
			}
		},
		[project, setGlobalAssignments],
	)

	function handleStart() {
		setState({ ...initialState, status: "running" })
		const client = new GenerationClient()
		clientRef.current = client
		client.start(project, handleResponse, config)
	}

	function handleCancel() {
		clientRef.current?.cancel()
		clientRef.current = null
		setState((prev) => ({ ...prev, status: "cancelled" }))
	}

	const isRunning = state.status === "running"
	const isComplete = state.status === "completed"
	const progressPercent = Math.round(state.progress * 100)
	const hardConflicts = state.conflicts.filter((c) => c.severity === "hard")
	const softConflicts = state.conflicts.filter((c) => c.severity === "soft")

	return (
		<div className="space-y-6">
			<h1 className="text-2xl font-bold text-text-primary">{messages.nav.generate}</h1>

			<div className="grid gap-6 lg:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Zap className="h-5 w-5 text-text-secondary" />
							{messages.scheduling.configuration}
						</CardTitle>
						<CardDescription>
							{messages.scheduling.attempts}: {config.maxAttempts}
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid gap-2">
							<label htmlFor="gen-attempts" className="text-sm font-medium text-text-primary">
								{messages.scheduling.attempts}
							</label>
							<Input
								id="gen-attempts"
								type="number"
								min={1}
								max={50}
								value={config.maxAttempts}
								onChange={(e) =>
									setConfig((c) => ({
										...c,
										maxAttempts: Number(e.target.value) || 1,
									}))
								}
								disabled={isRunning}
							/>
						</div>

						<div className="grid gap-2">
							<label htmlFor="gen-timeout" className="text-sm font-medium text-text-primary">
								{messages.scheduling.timeoutSeconds}
							</label>
							<div className="flex items-center gap-3">
								<input
									id="gen-timeout"
									type="range"
									min={10}
									max={300}
									step={10}
									value={config.timeoutMs / 1000}
									onChange={(e) =>
										setConfig((c) => ({
											...c,
											timeoutMs: Number(e.target.value) * 1000,
										}))
									}
									disabled={isRunning}
									className="flex-1 accent-action-primary"
								/>
								<span className="text-sm text-text-secondary min-w-[3rem] text-right">
									{config.timeoutMs / 1000}s
								</span>
							</div>
						</div>

						<div className="flex gap-2 pt-2">
							{isRunning ? (
								<Button variant="destructive" onClick={handleCancel}>
									<Square className="h-4 w-4" />
									{messages.scheduling.stopGeneration}
								</Button>
							) : (
								<Button onClick={handleStart}>
									<Play className="h-4 w-4" />
									{messages.scheduling.runGeneration}
								</Button>
							)}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							{messages.scheduling.progress}
							<StatusBadge status={state.status} messages={messages} />
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<div className="flex items-center justify-between text-sm">
								<span className="text-text-secondary">
									{state.placedCount} / {state.totalCount}
								</span>
								<span className="text-text-primary font-medium">{progressPercent}%</span>
							</div>
							<div className="h-2.5 rounded-full bg-surface-sunken overflow-hidden">
								<div
									className={cn(
										"h-full rounded-full transition-all duration-300",
										state.status === "failed" ? "bg-status-conflict" : "bg-action-primary",
									)}
									style={{ width: `${progressPercent}%` }}
								/>
							</div>
						</div>

						{isRunning && (
							<div className="flex items-center gap-2 text-sm text-text-secondary">
								<Loader2 className="h-4 w-4 animate-spin" />
								{messages.scheduling.generating}
							</div>
						)}

						{state.fitness !== null && (
							<div className="grid grid-cols-2 gap-3 pt-2">
								<div className="rounded-lg border border-border-subtle p-3">
									<div className="text-xs text-text-muted">{messages.scheduling.fitnessScore}</div>
									<div className="text-lg font-bold text-text-primary">
										{state.fitness.toFixed(1)}
									</div>
								</div>
								<div className="rounded-lg border border-border-subtle p-3">
									<div className="text-xs text-text-muted">{messages.scheduling.placed}</div>
									<div className="text-lg font-bold text-text-primary">
										{state.placedCount}
										<span className="text-sm font-normal text-text-muted">
											{" "}
											/ {state.totalCount}
										</span>
									</div>
								</div>
							</div>
						)}

						{state.errorMessage && (
							<div className="rounded-md bg-feedback-error-bg px-3 py-2 text-sm text-feedback-error">
								{state.errorMessage}
							</div>
						)}
					</CardContent>
				</Card>
			</div>

			{isComplete && state.conflicts.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<AlertTriangle className="h-5 w-5 text-status-conflict" />
							{messages.scheduling.conflicts}
						</CardTitle>
						<CardDescription>
							{hardConflicts.length} {messages.scheduling.hardConflicts}
							{" / "}
							{softConflicts.length} {messages.scheduling.softViolations}
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							{state.conflicts.map((conflict) => (
								<ConflictRow
									key={conflict.id}
									conflict={conflict}
									project={project}
									messages={messages}
								/>
							))}
						</div>
					</CardContent>
				</Card>
			)}

			{isComplete && state.conflicts.length === 0 && (
				<Card>
					<CardContent className="flex items-center gap-3 py-6">
						<CheckCircle className="h-5 w-5 text-status-generated" />
						<span className="text-sm text-text-primary">{messages.scheduling.noConflicts}</span>
					</CardContent>
				</Card>
			)}
		</div>
	)
}

function StatusBadge({
	status,
	messages,
}: {
	status: GenerationStatus
	messages: ReturnType<typeof useMessages>
}) {
	const styles: Record<GenerationStatus, string> = {
		idle: "bg-surface-raised text-text-muted",
		running: "bg-status-selected-bg text-status-selected",
		completed: "bg-status-generated-bg text-status-generated",
		failed: "bg-status-conflict-bg text-status-conflict",
		cancelled: "bg-status-unplaced-bg text-status-unplaced",
	}

	const labels: Record<GenerationStatus, string> = {
		idle: messages.scheduling.pending,
		running: messages.scheduling.running,
		completed: messages.scheduling.completed,
		failed: messages.scheduling.failed,
		cancelled: messages.scheduling.cancelled,
	}

	return (
		<span
			className={cn(
				"inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
				styles[status],
			)}
		>
			{labels[status]}
		</span>
	)
}

function ConflictRow({
	conflict,
	project,
	messages,
}: {
	conflict: Conflict
	project: ReturnType<typeof useProject>["project"]
	messages: ReturnType<typeof useMessages>
}) {
	const isHard = conflict.severity === "hard"
	const activityNames = conflict.activityIds
		.map((id) => project.activities.find((a) => a.id === id)?.name)
		.filter(Boolean)
		.join(", ")

	const timeLabel = conflict.timeSlot
		? `${conflict.timeSlot.day} P${conflict.timeSlot.period + 1}`
		: null

	return (
		<div
			className={cn(
				"flex items-start gap-3 rounded-md border px-3 py-2.5",
				isHard
					? "border-status-conflict/20 bg-status-conflict-bg"
					: "border-border-subtle bg-surface-card",
			)}
		>
			{isHard ? (
				<ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-status-conflict" />
			) : (
				<ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-text-muted" />
			)}
			<div className="flex-1 min-w-0">
				<div className="flex items-center gap-2">
					<span
						className={cn(
							"inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium",
							isHard
								? "bg-status-conflict text-white"
								: "bg-status-unplaced-bg text-status-unplaced",
						)}
					>
						{isHard ? messages.scheduling.hard : messages.scheduling.soft}
					</span>
					<span className="text-xs text-text-muted capitalize">
						{conflict.type.replace(/-/g, " ")}
					</span>
					{timeLabel && (
						<span className="flex items-center gap-1 text-xs text-text-muted">
							<Clock className="h-3 w-3" />
							{timeLabel}
						</span>
					)}
				</div>
				<p className="mt-1 text-sm text-text-primary">{conflict.description}</p>
				{activityNames && (
					<p className="mt-0.5 text-xs text-text-secondary truncate">{activityNames}</p>
				)}
			</div>
		</div>
	)
}
