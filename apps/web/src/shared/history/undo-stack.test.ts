import { describe, expect, it } from "vitest"
import { emptyUndoState, recordChange, redoChange, undoChange } from "./undo-stack.ts"

describe("undo-stack", () => {
	it("undoes to the previous value and redoes back", () => {
		let state = emptyUndoState<number>()
		state = recordChange(state, 1)
		state = recordChange(state, 2)

		const undone = undoChange(state, 3)
		expect(undone?.value).toBe(2)

		const redone = redoChange(undone!.state, undone!.value)
		expect(redone?.value).toBe(3)
	})

	it("returns null when there is nothing to undo or redo", () => {
		const state = emptyUndoState<number>()
		expect(undoChange(state, 1)).toBeNull()
		expect(redoChange(state, 1)).toBeNull()
	})

	it("clears the redo stack on a new change", () => {
		let state = emptyUndoState<number>()
		state = recordChange(state, 1)
		const undone = undoChange(state, 2)
		const next = recordChange(undone!.state, undone!.value)
		expect(redoChange(next, 99)).toBeNull()
	})

	it("caps the undo depth at 50", () => {
		let state = emptyUndoState<number>()
		for (let i = 0; i < 60; i++) state = recordChange(state, i)
		expect(state.past).toHaveLength(50)
		expect(state.past[0]).toBe(10)
	})
})
