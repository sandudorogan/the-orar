/**
 * Verifies that export-only dependencies (docx, exceljs) are not
 * eagerly imported from non-export application code.
 *
 * Run: bun run scripts/bundle-check.ts
 */
import { Glob } from "bun"

const FORBIDDEN_IMPORTS = ["docx", "exceljs"]
const SCAN_DIRS = ["apps/web/src", "packages/domain/src", "packages/solver/src", "packages/ui/src"]
const ALLOWED_DIRS = ["packages/exports"]

const violations: string[] = []

for (const dir of SCAN_DIRS) {
	const glob = new Glob("**/*.{ts,tsx}")
	for await (const path of glob.scan({ cwd: dir })) {
		const fullPath = `${dir}/${path}`
		const content = await Bun.file(fullPath).text()
		for (const lib of FORBIDDEN_IMPORTS) {
			const patterns = [
				new RegExp(`from\\s+["']${lib}["']`),
				new RegExp(`import\\(\\s*["']${lib}["']\\s*\\)`),
				new RegExp(`require\\(\\s*["']${lib}["']\\s*\\)`),
			]
			for (const pattern of patterns) {
				if (pattern.test(content)) {
					violations.push(`${fullPath}: imports "${lib}" (must only be in ${ALLOWED_DIRS.join(", ")})`)
				}
			}
		}
	}
}

if (violations.length > 0) {
	console.error("Bundle policy violations found:")
	for (const v of violations) {
		console.error(`  - ${v}`)
	}
	process.exit(1)
} else {
	console.log("Bundle check passed: no forbidden eager imports found.")
}
