export interface UndoState<T> {
	past: T[]
	future: T[]
}

export const UNDO_LIMIT = 50

export function emptyUndoState<T>(): UndoState<T> {
	return { past: [], future: [] }
}

export function recordChange<T>(state: UndoState<T>, previous: T): UndoState<T> {
	const past = [...state.past, previous]
	if (past.length > UNDO_LIMIT) past.shift()
	return { past, future: [] }
}

export function undoChange<T>(
	state: UndoState<T>,
	current: T,
): { state: UndoState<T>; value: T } | null {
	const previous = state.past[state.past.length - 1]
	if (previous === undefined) return null
	return {
		state: { past: state.past.slice(0, -1), future: [...state.future, current] },
		value: previous,
	}
}

export function redoChange<T>(
	state: UndoState<T>,
	current: T,
): { state: UndoState<T>; value: T } | null {
	const next = state.future[state.future.length - 1]
	if (next === undefined) return null
	return {
		state: { past: [...state.past, current], future: state.future.slice(0, -1) },
		value: next,
	}
}
