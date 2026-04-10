import { useLocale, useMessages } from "@/app/i18n/use-i18n.ts"
import { useProject } from "@/app/project-context.tsx"
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Tabs, TabsContent, TabsList, TabsTrigger } from "@orar/ui"
import { FileDown, FileSpreadsheet, FileText, Loader2, Package } from "lucide-react"
import { useCallback, useState } from "react"

type ExportTarget = "teacher" | "class" | "classroom"
type ExportFormat = "docx" | "excel"

export function ExportsPage() {
	const messages = useMessages()
	const { locale } = useLocale()
	const { project, assignments } = useProject()
	const [exporting, setExporting] = useState(false)

	const handleExport = useCallback(
		async (target: ExportTarget, format: ExportFormat) => {
			if (!assignments.length) return
			setExporting(true)

			try {
				const { buildTeacherExportModel, buildClassGroupExportModel, buildClassroomExportModel } =
					await import("@orar/exports")

				const models = []
				if (target === "teacher") {
					for (const teacher of project.teachers) {
						models.push(
							buildTeacherExportModel(
								teacher,
								project.calendar,
								assignments,
								project.activities,
								project.classGroups,
								project.classrooms,
								locale,
							),
						)
					}
				} else if (target === "class") {
					for (const group of project.classGroups) {
						models.push(
							buildClassGroupExportModel(
								group,
								project.calendar,
								assignments,
								project.activities,
								project.teachers,
								project.classrooms,
								locale,
							),
						)
					}
				} else {
					for (const room of project.classrooms) {
						models.push(
							buildClassroomExportModel(
								room,
								project.calendar,
								assignments,
								project.activities,
								project.teachers,
								project.classGroups,
								locale,
							),
						)
					}
				}

				for (const model of models) {
					let blob: Blob
					let ext: string
					if (format === "docx") {
						const { exportScheduleToDocx } = await import("@orar/exports")
						blob = await exportScheduleToDocx(model)
						ext = "docx"
					} else {
						const { exportScheduleToExcel } = await import("@orar/exports")
						blob = await exportScheduleToExcel(model)
						ext = "xlsx"
					}
					downloadBlob(blob, `${model.title}.${ext}`)
				}
			} finally {
				setExporting(false)
			}
		},
		[assignments, project],
	)

	const handleInstitutionPack = useCallback(
		async (format: ExportFormat) => {
			if (!assignments.length) return
			setExporting(true)

			try {
				const { buildTeacherExportModel, buildClassGroupExportModel, buildClassroomExportModel } =
					await import("@orar/exports")

				const allModels = [
					...project.teachers.map((t) =>
						buildTeacherExportModel(t, project.calendar, assignments, project.activities, project.classGroups, project.classrooms, locale),
					),
					...project.classGroups.map((g) =>
						buildClassGroupExportModel(g, project.calendar, assignments, project.activities, project.teachers, project.classrooms, locale),
					),
					...project.classrooms.map((r) =>
						buildClassroomExportModel(r, project.calendar, assignments, project.activities, project.teachers, project.classGroups, locale),
					),
				]

				for (const model of allModels) {
					let blob: Blob
					let ext: string
					if (format === "docx") {
						const { exportScheduleToDocx } = await import("@orar/exports")
						blob = await exportScheduleToDocx(model)
						ext = "docx"
					} else {
						const { exportScheduleToExcel } = await import("@orar/exports")
						blob = await exportScheduleToExcel(model)
						ext = "xlsx"
					}
					downloadBlob(blob, `${model.title}.${ext}`)
				}
			} finally {
				setExporting(false)
			}
		},
		[assignments, project],
	)

	const hasSchedule = assignments.length > 0

	return (
		<div className="space-y-6">
			<h1 className="text-2xl font-bold text-text-primary">{messages.nav.exports}</h1>

			{!hasSchedule && (
				<Card>
					<CardContent className="py-8 text-center">
						<p className="text-text-muted">{messages.timetables.noScheduleGenerated}</p>
					</CardContent>
				</Card>
			)}

			{hasSchedule && (
				<Tabs defaultValue="teacher">
					<TabsList>
						<TabsTrigger value="teacher">{messages.exports.perTeacher}</TabsTrigger>
						<TabsTrigger value="class">{messages.exports.perClass}</TabsTrigger>
						<TabsTrigger value="classroom">{messages.exports.perClassroom}</TabsTrigger>
						<TabsTrigger value="institution">{messages.exports.institutionPack}</TabsTrigger>
					</TabsList>

					<TabsContent value="teacher">
						<ExportCard
							title={messages.exports.perTeacher}
							description={`${project.teachers.length} ${messages.nav.teachers.toLowerCase()}`}
							exporting={exporting}
							onDocx={() => handleExport("teacher", "docx")}
							onExcel={() => handleExport("teacher", "excel")}
							messages={messages}
						/>
					</TabsContent>

					<TabsContent value="class">
						<ExportCard
							title={messages.exports.perClass}
							description={`${project.classGroups.length} ${messages.nav.classes.toLowerCase()}`}
							exporting={exporting}
							onDocx={() => handleExport("class", "docx")}
							onExcel={() => handleExport("class", "excel")}
							messages={messages}
						/>
					</TabsContent>

					<TabsContent value="classroom">
						<ExportCard
							title={messages.exports.perClassroom}
							description={`${project.classrooms.length} ${messages.nav.classrooms.toLowerCase()}`}
							exporting={exporting}
							onDocx={() => handleExport("classroom", "docx")}
							onExcel={() => handleExport("classroom", "excel")}
							messages={messages}
						/>
					</TabsContent>

					<TabsContent value="institution">
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Package className="h-5 w-5" />
									{messages.exports.institutionPack}
								</CardTitle>
								<CardDescription>
									{messages.nav.teachers}, {messages.nav.classes}, {messages.nav.classrooms}
								</CardDescription>
							</CardHeader>
							<CardContent className="flex gap-3">
								<Button
									onClick={() => handleInstitutionPack("docx")}
									disabled={exporting}
								>
									{exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
									{messages.exports.exportDocx}
								</Button>
								<Button
									variant="outline"
									onClick={() => handleInstitutionPack("excel")}
									disabled={exporting}
								>
									{exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
									{messages.exports.exportExcel}
								</Button>
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>
			)}
		</div>
	)
}

interface ExportCardProps {
	title: string
	description: string
	exporting: boolean
	onDocx: () => void
	onExcel: () => void
	messages: ReturnType<typeof useMessages>
}

function ExportCard({ title, description, exporting, onDocx, onExcel, messages }: ExportCardProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<FileDown className="h-5 w-5" />
					{title}
				</CardTitle>
				<CardDescription>{description}</CardDescription>
			</CardHeader>
			<CardContent className="flex gap-3">
				<Button onClick={onDocx} disabled={exporting}>
					{exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
					{messages.exports.exportDocx}
				</Button>
				<Button variant="outline" onClick={onExcel} disabled={exporting}>
					{exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
					{messages.exports.exportExcel}
				</Button>
			</CardContent>
		</Card>
	)
}

function downloadBlob(blob: Blob, filename: string) {
	const url = URL.createObjectURL(blob)
	const a = document.createElement("a")
	a.href = url
	a.download = filename
	a.click()
	URL.revokeObjectURL(url)
}
