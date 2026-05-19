import { useMessages } from "@/app/i18n/use-i18n.ts"
import { useProject } from "@/app/project-context.tsx"
import { ActivitiesPanel } from "@/features/activities/page.tsx"
import { ClassesPanel } from "@/features/classes/page.tsx"
import { ClassroomsPanel } from "@/features/classrooms/page.tsx"
import { ConstraintsPanel } from "@/features/constraints/page.tsx"
import { ImportPanel } from "@/features/import/import-panel.tsx"
import { isProjectSetupEmpty, isProjectSetupReady } from "@/features/setup/project-setup.ts"
import { SETUP_TABS, type SetupTab, parseSetupTab } from "@/features/setup/setup-tabs.ts"
import { TeachersPanel } from "@/features/teachers/page.tsx"
import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
	cn,
} from "@orar/ui"
import { useNavigate, useSearch } from "@tanstack/react-router"
import {
	BookOpen,
	CheckCircle2,
	Circle,
	DoorOpen,
	FileUp,
	GraduationCap,
	ShieldCheck,
	Users,
	Zap,
} from "lucide-react"
import { type ReactNode, useEffect } from "react"

interface StepConfig {
	tab: SetupTab
	label: string
	icon: ReactNode
	count: number
	complete: boolean
	optional?: boolean
}

export function SetupPage() {
	const messages = useMessages()
	const { project } = useProject()
	const { tab, manual } = useSearch({ from: "/app/setup" })
	const navigate = useNavigate()

	const isEmpty = isProjectSetupEmpty(project)
	const setupReady = isProjectSetupReady(project)
	const hasClassGroups = project.classGroups.length > 0
	const showManualTabs = !isEmpty || manual
	const activeTab = isEmpty && !manual ? "import" : tab

	const steps: StepConfig[] = [
		{
			tab: "import",
			label: messages.nav.import,
			icon: <FileUp className="h-4 w-4" />,
			count: 0,
			complete: !isEmpty,
			optional: !isEmpty,
		},
		{
			tab: "classes",
			label: messages.nav.classes,
			icon: <GraduationCap className="h-4 w-4" />,
			count: project.classes.length,
			complete: project.classes.length > 0 && hasClassGroups,
		},
		{
			tab: "teachers",
			label: messages.nav.teachers,
			icon: <Users className="h-4 w-4" />,
			count: project.teachers.length,
			complete: project.teachers.length > 0,
		},
		{
			tab: "classrooms",
			label: messages.nav.classrooms,
			icon: <DoorOpen className="h-4 w-4" />,
			count: project.classrooms.length,
			complete: project.classrooms.length > 0,
		},
		{
			tab: "activities",
			label: messages.nav.activities,
			icon: <BookOpen className="h-4 w-4" />,
			count: project.activities.length,
			complete: project.activities.length > 0,
		},
		{
			tab: "constraints",
			label: messages.nav.constraints,
			icon: <ShieldCheck className="h-4 w-4" />,
			count: project.availabilityRules.length,
			complete: true,
			optional: true,
		},
	]

	const manualSteps = steps.filter((step) => step.tab !== "import")
	const requiredSteps = manualSteps.filter((step) => !step.optional)
	const requiredComplete = requiredSteps.every((step) => step.complete)

	function selectTab(nextTab: SetupTab) {
		const enteringManual = isEmpty && nextTab !== "import"
		navigate({
			to: "/setup",
			search: {
				tab: nextTab,
				manual: manual || enteringManual,
			},
		})
	}

	function startManual() {
		navigate({ to: "/setup", search: { tab: "classes", manual: true } })
	}

	useEffect(() => {
		if (isEmpty && !manual && tab !== "import") {
			navigate({ to: "/setup", search: { tab: "import", manual: false }, replace: true })
		}
	}, [isEmpty, manual, tab, navigate])

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<h1 className="text-2xl font-bold text-text-primary">
						{isEmpty ? messages.setup.emptyTitle : messages.setup.title}
					</h1>
					<p className="mt-1 max-w-2xl text-sm text-text-secondary">
						{isEmpty ? messages.setup.emptyDescription : messages.setup.description}
					</p>
				</div>
				{!isEmpty && (
					<Button
						variant={setupReady ? "default" : "outline"}
						onClick={() => navigate({ to: "/generate" })}
						disabled={!setupReady}
					>
						<Zap className="h-4 w-4" />
						{messages.setup.generateCta}
					</Button>
				)}
			</div>

			{!isEmpty && (
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-base">{messages.setup.progressTitle}</CardTitle>
						<CardDescription>
							{requiredComplete
								? messages.setup.readyDescription
								: messages.setup.progressDescription}
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
							{manualSteps.map((step) => (
								<button
									key={step.tab}
									type="button"
									onClick={() => selectTab(step.tab)}
									className={cn(
										"flex items-center gap-3 rounded-lg border p-3 text-left transition-colors",
										activeTab === step.tab
											? "border-action-primary bg-action-primary/5"
											: "border-border-subtle hover:border-border-default hover:bg-surface-subtle",
									)}
								>
									{step.complete ? (
										<CheckCircle2 className="h-5 w-5 shrink-0 text-status-generated" />
									) : (
										<Circle className="h-5 w-5 shrink-0 text-text-muted" />
									)}
									<div className="min-w-0 flex-1">
										<div className="flex items-center gap-2">
											{step.icon}
											<span className="truncate text-sm font-medium text-text-primary">
												{step.label}
											</span>
										</div>
										<p className="mt-0.5 text-xs text-text-secondary">
											{step.optional
												? messages.setup.optionalStep
												: step.complete
													? messages.setup.stepComplete
													: messages.setup.stepIncomplete}
											{step.count > 0 && ` · ${step.count}`}
										</p>
									</div>
								</button>
							))}
						</div>
					</CardContent>
				</Card>
			)}

			<Tabs value={activeTab} onValueChange={(value) => selectTab(parseSetupTab(value))}>
				{showManualTabs && (
					<TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
						{SETUP_TABS.map((setupTab) => {
							const step = steps.find((s) => s.tab === setupTab)
							return (
								<TabsTrigger key={setupTab} value={setupTab} className="gap-1.5">
									{step?.icon}
									{step?.label}
								</TabsTrigger>
							)
						})}
					</TabsList>
				)}

				<TabsContent value="import" className={showManualTabs ? "mt-6" : undefined}>
					<ImportPanel embedded onStartManual={startManual} />
				</TabsContent>
				{showManualTabs && (
					<>
						<TabsContent value="classes" className="mt-6">
							<ClassesPanel embedded />
						</TabsContent>
						<TabsContent value="teachers" className="mt-6">
							<TeachersPanel embedded />
						</TabsContent>
						<TabsContent value="classrooms" className="mt-6">
							<ClassroomsPanel embedded />
						</TabsContent>
						<TabsContent value="activities" className="mt-6">
							<ActivitiesPanel embedded />
						</TabsContent>
						<TabsContent value="constraints" className="mt-6">
							<ConstraintsPanel embedded />
						</TabsContent>
					</>
				)}
			</Tabs>
		</div>
	)
}
