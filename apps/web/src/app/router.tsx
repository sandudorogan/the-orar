import { ActivitiesPage } from "@/features/activities/page.tsx"
import { ClassesPage } from "@/features/classes/page.tsx"
import { ClassroomsPage } from "@/features/classrooms/page.tsx"
import { ConstraintsPage } from "@/features/constraints/page.tsx"
import { DashboardPage } from "@/features/dashboard/page.tsx"
import { ExportsPage } from "@/features/exports/page.tsx"
import { GeneratePage } from "@/features/generate/page.tsx"
import { SettingsPage } from "@/features/settings/page.tsx"
import { TeachersPage } from "@/features/teachers/page.tsx"
import { TimetablesPage } from "@/features/timetables/page.tsx"
import { Outlet, createRootRoute, createRoute, createRouter } from "@tanstack/react-router"
import { AppLayout } from "./layout.tsx"

const rootRoute = createRootRoute({
	component: () => (
		<AppLayout>
			<Outlet />
		</AppLayout>
	),
})

const dashboardRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/",
	component: DashboardPage,
})

const classesRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/classes",
	component: ClassesPage,
})

const teachersRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/teachers",
	component: TeachersPage,
})

const classroomsRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/classrooms",
	component: ClassroomsPage,
})

const activitiesRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/activities",
	component: ActivitiesPage,
})

const constraintsRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/constraints",
	component: ConstraintsPage,
})

const generateRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/generate",
	component: GeneratePage,
})

const timetablesRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/timetables",
	component: TimetablesPage,
})

const exportsRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/exports",
	component: ExportsPage,
})

const settingsRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/settings",
	component: SettingsPage,
})

const routeTree = rootRoute.addChildren([
	dashboardRoute,
	classesRoute,
	teachersRoute,
	classroomsRoute,
	activitiesRoute,
	constraintsRoute,
	generateRoute,
	timetablesRoute,
	exportsRoute,
	settingsRoute,
])

export const router = createRouter({ routeTree })

declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router
	}
}
