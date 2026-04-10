import { useMessages } from "@/app/i18n/use-i18n.ts"
import { useProject } from "@/app/project-context.tsx"
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@orar/ui"
import { useNavigate } from "@tanstack/react-router"
import { BookOpen, DoorOpen, GraduationCap, Plus, ShieldCheck, Users } from "lucide-react"

export function DashboardPage() {
	const messages = useMessages()
	const { project } = useProject()
	const navigate = useNavigate()

	const stats = [
		{
			label: messages.dashboard.totalClasses,
			value: project.classes.length,
			icon: <GraduationCap className="h-5 w-5 text-text-secondary" />,
		},
		{
			label: messages.dashboard.totalTeachers,
			value: project.teachers.length,
			icon: <Users className="h-5 w-5 text-text-secondary" />,
		},
		{
			label: messages.dashboard.totalClassrooms,
			value: project.classrooms.length,
			icon: <DoorOpen className="h-5 w-5 text-text-secondary" />,
		},
		{
			label: messages.dashboard.totalActivities,
			value: project.activities.length,
			icon: <BookOpen className="h-5 w-5 text-text-secondary" />,
		},
		{
			label: messages.dashboard.totalConstraints,
			value: project.availabilityRules.length,
			icon: <ShieldCheck className="h-5 w-5 text-text-secondary" />,
		},
	]

	const quickActions = [
		{ label: messages.dashboard.addClass, path: "/classes" as const },
		{ label: messages.dashboard.addTeacher, path: "/teachers" as const },
		{ label: messages.dashboard.addClassroom, path: "/classrooms" as const },
		{ label: messages.dashboard.addActivity, path: "/activities" as const },
	]

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold text-text-primary">{messages.common.welcome}</h1>
				<p className="text-text-secondary mt-1">{project.name}</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>{messages.dashboard.projectOverview}</CardTitle>
					<CardDescription>{project.institution.name}</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
						{stats.map((stat) => (
							<div
								key={stat.label}
								className="flex flex-col items-center gap-1 rounded-lg border border-border-subtle p-4"
							>
								{stat.icon}
								<span className="text-2xl font-bold text-text-primary">{stat.value}</span>
								<span className="text-xs text-text-secondary">{stat.label}</span>
							</div>
						))}
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>{messages.common.quickActions}</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex flex-wrap gap-3">
						{quickActions.map((action) => (
							<Button
								key={action.path}
								variant="outline"
								onClick={() => navigate({ to: action.path })}
							>
								<Plus className="h-4 w-4" />
								{action.label}
							</Button>
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
