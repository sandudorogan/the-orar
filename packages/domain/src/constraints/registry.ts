import type { Constraint, ConstraintViolation, ScheduleContext } from "./types.ts"

export class ConstraintRegistry {
	private constraints: Map<string, Constraint> = new Map()

	register(constraint: Constraint): void {
		this.constraints.set(constraint.id, constraint)
	}

	unregister(id: string): void {
		this.constraints.delete(id)
	}

	get(id: string): Constraint | undefined {
		return this.constraints.get(id)
	}

	getAll(): Constraint[] {
		return Array.from(this.constraints.values())
	}

	evaluateAll(context: ScheduleContext): ConstraintViolation[] {
		const violations: ConstraintViolation[] = []
		for (const constraint of this.constraints.values()) {
			violations.push(...constraint.evaluate(context))
		}
		return violations
	}

	evaluateHard(context: ScheduleContext): ConstraintViolation[] {
		return this.evaluateAll(context).filter((v) => v.weight === "hard")
	}

	evaluateSoft(context: ScheduleContext): ConstraintViolation[] {
		return this.evaluateAll(context).filter((v) => v.weight === "soft")
	}
}

export function createDefaultRegistry(): ConstraintRegistry {
	const registry = new ConstraintRegistry()
	registry.register(createNoTeacherOverlap())
	registry.register(createNoClassOverlap())
	registry.register(createNoRoomOverlap())
	registry.register(createTeacherAvailability())
	registry.register(createClassAvailability())
	registry.register(createClassroomAvailability())
	return registry
}

import { createClassAvailability } from "./class-availability.ts"
import { createClassroomAvailability } from "./classroom-availability.ts"
import { createNoClassOverlap } from "./no-overlap.ts"
import { createNoRoomOverlap } from "./no-overlap.ts"
import { createNoTeacherOverlap } from "./no-overlap.ts"
import { createTeacherAvailability } from "./teacher-availability.ts"
