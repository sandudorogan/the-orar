import { cn } from "../lib/utils.ts"
import { ScrollArea, ScrollBar } from "../primitives/scroll-area.tsx"

export interface TimetableCell {
	id: string
	label: string
	sublabel?: string
	status: "generated" | "locked" | "conflict" | "unplaced" | "selected"
}

export interface TimetableGridProps {
	days: string[]
	periods: number
	cells: Map<string, TimetableCell[]>
	onCellClick?: (day: string, period: number) => void
	periodLabel?: string
}

const statusStyles: Record<TimetableCell["status"], string> = {
	generated: "bg-status-generated-bg text-status-generated border-status-generated/20",
	locked: "bg-status-locked-bg text-status-locked border-status-locked/20",
	conflict: "bg-status-conflict-bg text-status-conflict border-status-conflict/20",
	unplaced: "bg-status-unplaced-bg text-status-unplaced border-status-unplaced/20",
	selected: "bg-status-selected-bg text-status-selected border-status-selected/20",
}

function periodKeys(count: number): string[] {
	return Array.from({ length: count }, (_, i) => `period-${i}`)
}

export function TimetableGrid({
	days,
	periods,
	cells,
	onCellClick,
	periodLabel = "Period",
}: TimetableGridProps) {
	const keys = periodKeys(periods)

	return (
		<ScrollArea className="w-full">
			<div className="min-w-[640px]">
				<table className="w-full border-collapse">
					<thead>
						<tr>
							<th className="bg-grid-header-bg text-grid-header-text px-3 py-2 text-left text-xs font-semibold min-w-[4rem] border border-grid-cell-border">
								{periodLabel}
							</th>
							{days.map((day) => (
								<th
									key={day}
									className="bg-grid-header-bg text-grid-header-text px-3 py-2 text-center text-xs font-semibold min-w-[var(--grid-cell-min-width)] border border-grid-cell-border"
								>
									{day}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{keys.map((rowKey, periodIndex) => (
							<tr key={rowKey}>
								<td className="bg-surface-raised px-3 py-2 text-center text-xs font-medium text-text-secondary border border-grid-cell-border min-w-[4rem]">
									{periodIndex + 1}
								</td>
								{days.map((day) => {
									const key = `${day}:${periodIndex}`
									const cellItems = cells.get(key) ?? []

									return (
										<td
											key={key}
											className={cn(
												"border border-grid-cell-border p-1 min-h-[var(--grid-cell-min-height)] min-w-[var(--grid-cell-min-width)] align-top",
												onCellClick && "cursor-pointer hover:bg-grid-cell-hover",
											)}
											onClick={() => onCellClick?.(day, periodIndex)}
											onKeyDown={(e) => {
												if (e.key === "Enter" || e.key === " ") {
													onCellClick?.(day, periodIndex)
												}
											}}
											tabIndex={onCellClick ? 0 : undefined}
											role={onCellClick ? "button" : undefined}
										>
											<div className="flex flex-col gap-0.5">
												{cellItems.map((item) => (
													<div
														key={item.id}
														className={cn(
															"rounded-sm px-1.5 py-1 text-xs border",
															statusStyles[item.status],
														)}
													>
														<div className="font-medium leading-tight truncate">{item.label}</div>
														{item.sublabel && (
															<div className="text-[10px] leading-tight opacity-75 truncate">
																{item.sublabel}
															</div>
														)}
													</div>
												))}
											</div>
										</td>
									)
								})}
							</tr>
						))}
					</tbody>
				</table>
			</div>
			<ScrollBar orientation="horizontal" />
		</ScrollArea>
	)
}
