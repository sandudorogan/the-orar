import { useMessages } from "@/app/i18n/use-i18n.ts"
import { Button } from "@orar/ui"
import { Link } from "@tanstack/react-router"

const GRID_ROWS = 5
const GRID_COLS = 5
const FILLED_CELLS = new Set(["1-0", "1-2", "2-1", "2-3", "3-0", "3-4", "4-2", "4-3", "0-1", "0-3"])

const DAY_LABELS = ["Lu", "Ma", "Mi", "Jo", "Vi"]

export function HeroSection() {
	const messages = useMessages()

	return (
		<section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-32">
			<div className="lg:grid lg:grid-cols-2 lg:gap-16 lg:items-center">
				<div>
					<h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-text-primary">
						{messages.landing.heroTitle}
					</h1>
					<p className="text-lg sm:text-xl text-text-secondary max-w-xl mt-6">
						{messages.landing.heroSubtitle}
					</p>
					<div className="flex flex-wrap gap-3 mt-8">
						<Button asChild>
							<Link to="/dashboard">{messages.landing.heroCta}</Link>
						</Button>
						<Button
							variant="outline"
							onClick={() =>
								document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })
							}
						>
							{messages.landing.heroSecondaryCta}
						</Button>
					</div>
				</div>

				<div className="hidden lg:flex justify-center" aria-hidden="true">
					<div className="-rotate-2 rounded-xl shadow-xl overflow-hidden border border-grid-cell-border">
						<div
							className="grid"
							style={{
								gridTemplateColumns: `repeat(${GRID_COLS}, 4rem)`,
								gridTemplateRows: `repeat(${GRID_ROWS + 1}, 2.5rem)`,
							}}
						>
							{DAY_LABELS.map((day) => (
								<div
									key={day}
									className="bg-grid-header-bg flex items-center justify-center text-xs font-medium text-white border border-grid-cell-border"
								>
									{day}
								</div>
							))}
							{Array.from({ length: GRID_ROWS }, (_, r) =>
								Array.from({ length: GRID_COLS }, (_, c) => {
									const cellKey = `${r}-${c}`
									return (
										<div
											key={cellKey}
											className={`border border-grid-cell-border ${
												FILLED_CELLS.has(cellKey) ? "bg-landing-cell-fill" : "bg-surface-card"
											}`}
										/>
									)
								}),
							)}
						</div>
					</div>
				</div>
			</div>
		</section>
	)
}
