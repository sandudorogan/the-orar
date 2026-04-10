import {
	AlignmentType,
	BorderStyle,
	Document,
	HeadingLevel,
	Packer,
	Paragraph,
	Table,
	TableCell,
	TableRow,
	TextRun,
	WidthType,
} from "docx"
import type { ExportScheduleModel } from "../mappers/schedule-to-export-model.ts"

export async function exportScheduleToDocx(model: ExportScheduleModel): Promise<Blob> {
	const headerCells = [createHeaderCell(""), ...model.days.map((day) => createHeaderCell(day))]

	const dataRows = model.rows.map((row) => {
		const periodCell = createHeaderCell(`${row.period + 1}`)
		const cells = row.cells.map((cell) => {
			const lines: string[] = []
			if (cell.activityName) {
				lines.push(cell.subjectName)
				if (cell.teacherNames.length > 0) lines.push(cell.teacherNames.join(", "))
				if (cell.classGroupNames.length > 0) lines.push(cell.classGroupNames.join(", "))
				if (cell.roomName) lines.push(cell.roomName)
			}
			return createDataCell(lines.join("\n"))
		})
		return new TableRow({ children: [periodCell, ...cells] })
	})

	const table = new Table({
		rows: [new TableRow({ children: headerCells }), ...dataRows],
		width: { size: 100, type: WidthType.PERCENTAGE },
	})

	const doc = new Document({
		sections: [
			{
				children: [
					new Paragraph({
						text: model.title,
						heading: HeadingLevel.HEADING_1,
						alignment: AlignmentType.CENTER,
					}),
					new Paragraph({
						text: model.subtitle,
						heading: HeadingLevel.HEADING_2,
						alignment: AlignmentType.CENTER,
						spacing: { after: 200 },
					}),
					table,
				],
			},
		],
	})

	return Packer.toBlob(doc)
}

function createHeaderCell(text: string): TableCell {
	return new TableCell({
		children: [
			new Paragraph({
				children: [new TextRun({ text, bold: true, size: 20 })],
				alignment: AlignmentType.CENTER,
			}),
		],
		shading: { fill: "1e4d78" },
		borders: cellBorders(),
	})
}

function createDataCell(text: string): TableCell {
	return new TableCell({
		children: [
			new Paragraph({
				children: [new TextRun({ text, size: 18 })],
				alignment: AlignmentType.CENTER,
			}),
		],
		borders: cellBorders(),
	})
}

function cellBorders() {
	const border = { style: BorderStyle.SINGLE, size: 1, color: "d8d5cf" }
	return { top: border, bottom: border, left: border, right: border }
}
