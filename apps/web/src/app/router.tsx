import { DashboardPage } from "@/features/dashboard/page.tsx"
import { GeneratePage } from "@/features/generate/page.tsx"
import { SettingsPage } from "@/features/settings/page.tsx"
import { SetupPage } from "@/features/setup/page.tsx"
import { type SetupTab, parseSetupTab } from "@/features/setup/setup-tabs.ts"
import { TimetablesPage } from "@/features/timetables/page.tsx"
import {
	Link,
	Outlet,
	createRootRoute,
	createRoute,
	createRouter,
	lazyRouteComponent,
	redirect,
} from "@tanstack/react-router"
import { AppLayout } from "./layout.tsx"

function NotFound() {
	document.title = "Page Not Found | Orar"
	return (
		<div className="flex min-h-screen flex-col items-center justify-center bg-surface-page px-4 text-center">
			<h1 className="text-text-primary text-6xl font-bold">404</h1>
			<p className="text-text-secondary mt-4 text-lg">This page doesn't exist.</p>
			<div className="mt-8 flex gap-4">
				<Link to="/" className="text-action-primary hover:text-action-primary-hover underline">
					Home
				</Link>
				<Link
					to="/dashboard"
					className="text-action-primary hover:text-action-primary-hover underline"
				>
					Dashboard
				</Link>
			</div>
		</div>
	)
}

function redirectToSetupTab(tab: SetupTab) {
	return () => {
		throw redirect({ to: "/setup", search: { tab, manual: false } })
	}
}

const rootRoute = createRootRoute({
	component: () => <Outlet />,
	notFoundComponent: NotFound,
})

const landingRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/",
	component: lazyRouteComponent(() => import("@/features/landing/page.tsx"), "LandingPage"),
	beforeLoad: () => {
		document.title = "Orar — School Scheduling, Solved"
	},
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
	beforeLoad: () => {
		document.title = "Dashboard | Orar"
	},
})

const setupRoute = createRoute({
	getParentRoute: () => appLayoutRoute,
	path: "/setup",
	validateSearch: (search: Record<string, unknown>) => ({
		tab: parseSetupTab(search.tab),
		manual: search.manual === true || search.manual === "1",
	}),
	component: SetupPage,
	beforeLoad: () => {
		document.title = "Project setup | Orar"
	},
})

const classesRoute = createRoute({
	getParentRoute: () => appLayoutRoute,
	path: "/classes",
	beforeLoad: redirectToSetupTab("classes"),
})

const teachersRoute = createRoute({
	getParentRoute: () => appLayoutRoute,
	path: "/teachers",
	beforeLoad: redirectToSetupTab("teachers"),
})

const classroomsRoute = createRoute({
	getParentRoute: () => appLayoutRoute,
	path: "/classrooms",
	beforeLoad: redirectToSetupTab("classrooms"),
})

const activitiesRoute = createRoute({
	getParentRoute: () => appLayoutRoute,
	path: "/activities",
	beforeLoad: redirectToSetupTab("activities"),
})

const constraintsRoute = createRoute({
	getParentRoute: () => appLayoutRoute,
	path: "/constraints",
	beforeLoad: redirectToSetupTab("constraints"),
})

const importRoute = createRoute({
	getParentRoute: () => appLayoutRoute,
	path: "/import",
	beforeLoad: redirectToSetupTab("import"),
})

const generateRoute = createRoute({
	getParentRoute: () => appLayoutRoute,
	path: "/generate",
	component: GeneratePage,
	beforeLoad: () => {
		document.title = "Generate | Orar"
	},
})

const timetablesRoute = createRoute({
	getParentRoute: () => appLayoutRoute,
	path: "/timetables",
	component: TimetablesPage,
	beforeLoad: () => {
		document.title = "Timetables | Orar"
	},
})

const exportsRoute = createRoute({
	getParentRoute: () => appLayoutRoute,
	path: "/exports",
	component: lazyRouteComponent(() => import("@/features/exports/page.tsx"), "ExportsPage"),
	beforeLoad: () => {
		document.title = "Exports | Orar"
	},
})

const settingsRoute = createRoute({
	getParentRoute: () => appLayoutRoute,
	path: "/settings",
	component: SettingsPage,
	beforeLoad: () => {
		document.title = "Settings | Orar"
	},
})

const routeTree = rootRoute.addChildren([
	landingRoute,
	appLayoutRoute.addChildren([
		dashboardRoute,
		setupRoute,
		classesRoute,
		teachersRoute,
		classroomsRoute,
		activitiesRoute,
		constraintsRoute,
		importRoute,
		generateRoute,
		timetablesRoute,
		exportsRoute,
		settingsRoute,
	]),
])

export const router = createRouter({ routeTree, basepath: "/the-orar" })

declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router
	}
}
