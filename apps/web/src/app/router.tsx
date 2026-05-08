import { ActivitiesPage } from "@/features/activities/page.tsx"
import { ClassesPage } from "@/features/classes/page.tsx"
import { ClassroomsPage } from "@/features/classrooms/page.tsx"
import { ConstraintsPage } from "@/features/constraints/page.tsx"
import { DashboardPage } from "@/features/dashboard/page.tsx"
import { GeneratePage } from "@/features/generate/page.tsx"
import { ImportPage } from "@/features/import/page.tsx"
import { SettingsPage } from "@/features/settings/page.tsx"
import { TeachersPage } from "@/features/teachers/page.tsx"
import { TimetablesPage } from "@/features/timetables/page.tsx"
import {
	Outlet,
	createRootRoute,
	createRoute,
	createRouter,
	lazyRouteComponent,
} from "@tanstack/react-router"
import { AppLayout } from "./layout.tsx"

const rootRoute = createRootRoute({
	component: () => <Outlet />,
})

const landingRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/",
	component: lazyRouteComponent(() => import("@/features/landing/page.tsx"), "LandingPage"),
})

const appLayoutRoute = createRoute({
	getParentRoute: () => rootRoute,
	id: "app",
	component: () => (
		<AppLayout>
			<Outlet />
		</AppLayout>
	),
})

const dashboardRoute = createRoute({
	getParentRoute: () => appLayoutRoute,
	path: "/dashboard",
	component: DashboardPage,
})

const classesRoute = createRoute({
	getParentRoute: () => appLayoutRoute,
	path: "/classes",
	component: ClassesPage,
})

const teachersRoute = createRoute({
	getParentRoute: () => appLayoutRoute,
	path: "/teachers",
	component: TeachersPage,
})

const classroomsRoute = createRoute({
	getParentRoute: () => appLayoutRoute,
	path: "/classrooms",
	component: ClassroomsPage,
})

const activitiesRoute = createRoute({
	getParentRoute: () => appLayoutRoute,
	path: "/activities",
	component: ActivitiesPage,
})

const constraintsRoute = createRoute({
	getParentRoute: () => appLayoutRoute,
	path: "/constraints",
	component: ConstraintsPage,
})

const generateRoute = createRoute({
	getParentRoute: () => appLayoutRoute,
	path: "/generate",
	component: GeneratePage,
})

const timetablesRoute = createRoute({
	getParentRoute: () => appLayoutRoute,
	path: "/timetables",
	component: TimetablesPage,
})

const exportsRoute = createRoute({
	getParentRoute: () => appLayoutRoute,
	path: "/exports",
	component: lazyRouteComponent(() => import("@/features/exports/page.tsx"), "ExportsPage"),
})

const importRoute = createRoute({
	getParentRoute: () => appLayoutRoute,
	path: "/import",
	component: ImportPage,
	beforeLoad: () => {
		document.title = "Import | Orar"
	},
})

const settingsRoute = createRoute({
	getParentRoute: () => appLayoutRoute,
	path: "/settings",
	component: SettingsPage,
})

const routeTree = rootRoute.addChildren([
	landingRoute,
	appLayoutRoute.addChildren([
		dashboardRoute,
		classesRoute,
		teachersRoute,
		classroomsRoute,
		activitiesRoute,
		constraintsRoute,
		generateRoute,
		timetablesRoute,
		exportsRoute,
		importRoute,
		settingsRoute,
	]),
])

export const router = createRouter({ routeTree, basepath: "/the-orar" })

declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router
	}
}
