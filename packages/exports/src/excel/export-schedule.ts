import ExcelJS from "exceljs"
import type { ExportScheduleModel } from "../mappers/schedule-to-export-model.ts"

export async function exportScheduleToExcel(model: ExportScheduleModel): Promise<Blob> {
	const workbook = new ExcelJS.Workbook()
	const sheet = workbook.addWorksheet(model.title)

	sheet.addRow([model.title])
	const titleRow = sheet.getRow(1)
	titleRow.font = { bold: true, size: 16 }
	titleRow.alignment = { horizontal: "center" }
	sheet.mergeCells(1, 1, 1, model.days.length + 1)

	sheet.addRow([model.subtitle])
	const subtitleRow = sheet.getRow(2)
	subtitleRow.font = { size: 12, italic: true }
	subtitleRow.alignment = { horizontal: "center" }
	sheet.mergeCells(2, 1, 2, model.days.length + 1)

	sheet.addRow([])

	const headerRow = sheet.addRow([model.periodLabel, ...model.days])
	headerRow.eachCell((cell) => {
		cell.font = { bold: true, color: { argb: "FFFFFFFF" } }
		cell.fill = {
			type: "pattern",
			pattern: "solid",
			fgColor: { argb: "FF1e4d78" },
		}
		cell.alignment = { horizontal: "center", vertical: "middle" }
		cell.border = thinBorder()
	})

	for (const row of model.rows) {
		const values = [
			`${row.period + 1}`,
			...row.cells.map((cell) => {
				if (!cell.activityName) return ""
				const parts = [cell.subjectName]
				if (cell.teacherNames.length > 0) parts.push(cell.teacherNames.join(", "))
				if (cell.classGroupNames.length > 0) parts.push(cell.classGroupNames.join(", "))
				if (cell.roomName) parts.push(cell.roomName)
				return parts.join("\n")
			}),
		]
		const dataRow = sheet.addRow(values)
		dataRow.eachCell((cell) => {
			cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true }
			cell.border = thinBorder()
		})
		dataRow.height = 40
	}

	sheet.columns.forEach((col) => {
		col.width = 18
	})

	const buffer = await workbook.xlsx.writeBuffer()
	return new Blob([buffer], {
		type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	})
}

function thinBorder(): Partial<ExcelJS.Borders> {
	const side: Partial<ExcelJS.Border> = { style: "thin", color: { argb: "FFd8d5cf" } }
	return { top: side, bottom: side, left: side, right: side }
}
