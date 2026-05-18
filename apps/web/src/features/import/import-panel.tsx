import { useMessages } from "@/app/i18n/use-i18n.ts"
import { useProject } from "@/app/project-context.tsx"
import {
	ORAR_CSV_AI_PROMPT,
	ORAR_CSV_HEADER,
	type OrarCsvImportResult,
	OrarCsvValidationError,
	buildProjectFromOrarCsv,
} from "@orar/domain"
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@orar/ui"
import { AlertCircle, CheckCircle2, Clipboard, FileUp, Upload } from "lucide-react"
import { useRef, useState } from "react"

export function ImportPanel({ embedded = false }: { embedded?: boolean }) {
	const messages = useMessages()
	const { replaceProject } = useProject()
	const fileInputRef = useRef<HTMLInputElement>(null)
	const [csvText, setCsvText] = useState("")
	const [result, setResult] = useState<OrarCsvImportResult | null>(null)
	const [errors, setErrors] = useState<string[]>([])
	const [copied, setCopied] = useState(false)
	const [imported, setImported] = useState(false)

	function validate(text = csvText) {
		setImported(false)
		try {
			const parsed = buildProjectFromOrarCsv(text)
			setResult(parsed)
			setErrors([])
		} catch (error) {
			setResult(null)
			if (error instanceof OrarCsvValidationError) {
				setErrors(error.errors.map((e) => `row ${e.row}, column ${e.column}: ${e.message}`))
			} else {
				setErrors([error instanceof Error ? error.message : String(error)])
			}
		}
	}

	function readFile(file: File) {
		const reader = new FileReader()
		reader.onload = (event) => {
			const text = String(event.target?.result ?? "")
			setCsvText(text)
			validate(text)
		}
		reader.readAsText(file)
	}

	function handleDrop(event: React.DragEvent<HTMLDivElement>) {
		event.preventDefault()
		const file = event.dataTransfer.files[0]
		if (file) readFile(file)
	}

	async function copyPrompt() {
		await navigator.clipboard.writeText(ORAR_CSV_AI_PROMPT)
		setCopied(true)
		window.setTimeout(() => setCopied(false), 1800)
	}

	function replaceCurrentProject() {
		if (!result) return
		replaceProject(result.project, result.assignments)
		setImported(true)
	}

	return (
		<div className="space-y-6">
			{!embedded && (
				<div>
					<h1 className="text-2xl font-bold text-text-primary">{messages.importCsv.title}</h1>
					<p className="mt-1 max-w-3xl text-sm text-text-secondary">
						{messages.importCsv.description}
					</p>
				</div>
			)}

			{embedded && (
				<p className="max-w-3xl text-sm text-text-secondary">{messages.importCsv.description}</p>
			)}

			<div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
				<div className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<FileUp className="h-5 w-5" />
								{messages.importCsv.dropTitle}
							</CardTitle>
							<CardDescription>{messages.importCsv.dropDescription}</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div
								onDragOver={(event) => event.preventDefault()}
								onDrop={handleDrop}
								className="flex min-h-32 flex-col items-center justify-center rounded-md border border-dashed border-border-strong bg-surface-subtle p-6 text-center"
							>
								<Upload className="mb-3 h-8 w-8 text-text-muted" />
								<Button
									type="button"
									variant="outline"
									onClick={() => fileInputRef.current?.click()}
								>
									{messages.importCsv.selectFile}
								</Button>
								<input
									ref={fileInputRef}
									type="file"
									accept=".csv,text/csv"
									className="hidden"
									onChange={(event) => {
										const file = event.target.files?.[0]
										if (file) readFile(file)
										event.target.value = ""
									}}
								/>
							</div>

							<label className="block space-y-2">
								<span className="text-sm font-medium text-text-primary">
									{messages.importCsv.pasteLabel}
								</span>
								<textarea
									value={csvText}
									onChange={(event) => {
										setCsvText(event.target.value)
										setResult(null)
										setImported(false)
									}}
									className="min-h-64 w-full resize-y rounded-md border border-border-default bg-surface-panel p-3 font-mono text-xs text-text-primary outline-none focus:border-action-primary"
									spellCheck={false}
								/>
							</label>

							<div className="flex flex-wrap gap-3">
								<Button type="button" onClick={() => validate()} disabled={!csvText.trim()}>
									<CheckCircle2 className="h-4 w-4" />
									{messages.importCsv.validate}
								</Button>
								<Button type="button" variant="outline" onClick={copyPrompt}>
									<Clipboard className="h-4 w-4" />
									{copied ? messages.importCsv.promptCopied : messages.importCsv.copyPrompt}
								</Button>
							</div>
						</CardContent>
					</Card>

					{errors.length > 0 && (
						<Card className="border-status-conflict">
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<AlertCircle className="h-5 w-5 text-status-conflict" />
									{messages.importCsv.invalidTitle}
								</CardTitle>
								<CardDescription>{messages.importCsv.invalidDescription}</CardDescription>
							</CardHeader>
							<CardContent>
								<ul className="space-y-2 text-sm text-text-primary">
									{errors.map((error) => (
										<li
											key={error}
											className="rounded-md bg-surface-subtle px-3 py-2 font-mono text-xs"
										>
											{error}
										</li>
									))}
								</ul>
							</CardContent>
						</Card>
					)}

					{result && (
						<Card>
							<CardHeader>
								<CardTitle>{messages.importCsv.previewTitle}</CardTitle>
								<CardDescription>{messages.importCsv.replaceWarning}</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
									<PreviewStat label={messages.importCsv.classes} value={result.summary.classes} />
									<PreviewStat
										label={messages.importCsv.groups}
										value={result.summary.classGroups}
									/>
									<PreviewStat
										label={messages.importCsv.teachers}
										value={result.summary.teachers}
									/>
									<PreviewStat
										label={messages.importCsv.classrooms}
										value={result.summary.classrooms}
									/>
									<PreviewStat
										label={messages.importCsv.activities}
										value={result.summary.activities}
									/>
									<PreviewStat
										label={messages.importCsv.availability}
										value={result.summary.availabilityRules}
									/>
									<PreviewStat
										label={messages.importCsv.assignments}
										value={result.summary.assignments}
									/>
								</div>

								{result.warnings.length > 0 && (
									<div className="space-y-2">
										<p className="text-sm font-medium text-text-primary">
											{messages.importCsv.warnings}
										</p>
										<ul className="space-y-1 text-sm text-text-secondary">
											{result.warnings.map((warning) => (
												<li key={warning}>{warning}</li>
											))}
										</ul>
									</div>
								)}

								<div className="flex items-center gap-3">
									<Button type="button" onClick={replaceCurrentProject}>
										{messages.importCsv.replaceProject}
									</Button>
									{imported && (
										<span className="text-sm font-medium text-status-generated">
											{messages.importCsv.imported}
										</span>
									)}
								</div>
							</CardContent>
						</Card>
					)}
				</div>

				<Card>
					<CardHeader>
						<CardTitle>{messages.importCsv.formatTitle}</CardTitle>
					</CardHeader>
					<CardContent>
						<pre className="overflow-auto rounded-md bg-surface-subtle p-3 text-xs text-text-secondary">
							{ORAR_CSV_HEADER}
						</pre>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}

function PreviewStat({ label, value }: { label: string; value: number }) {
	return (
		<div className="rounded-md border border-border-default bg-surface-subtle p-3">
			<p className="text-xs font-medium uppercase text-text-muted">{label}</p>
			<p className="mt-1 text-2xl font-semibold text-text-primary">{value}</p>
		</div>
	)
}
