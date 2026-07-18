# LKW Planner Agent Guide

This repository is an experimental transporter scheduling planner. Prefer understanding and improving the current design over preserving old APIs: compatibility is not a goal yet.

## Architecture

- `src/types.ts` and `src/roadmap.ts` define planner inputs and road costs.
- `src/planners/annealing_shared.ts` owns the canonical schedule representation and JS scoring model. Scores and costs are integer euro cents; time is tracked separately in minutes.
- `src/planners/annealing_baseline.ts` is the simple reference solver. Other JS variants explore alternative search strategies.
- `src/planners/annealing_wasm.ts` implements the performance-sensitive solver with the local WASM DSL.
- `src/wasm/` is the DSL/compiler: `ast.ts` builds typed AST values, `analyze.ts` discovers dependencies and layouts memory, and `codegen.ts` emits WASM. Keep these layers cleanly separated.
- `src/view/` renders and controls the browser UI; `src/workers.ts` provides worker execution.

## Philosophy

- Minimize conceptual complexity and generated/minified code size, not characters per line. Remove duplication and boilerplate when an abstraction genuinely makes the model smaller.
- Keep the DSL close to WASM semantics. Values should compose naturally; locals, globals, arrays, packed structs, functions, and control flow should expose their real behavior.
- Prefer compile-time TypeScript macros and recursively discovered helpers over adding special compiler concepts. Do not hide expensive JS callbacks inside hot WASM paths.
- Performance changes need measurements. Preserve readable helpers when inlining or specialization has no measurable benefit.
- Packed structs are at most 64 bits. Integer variables are signed `i32`/`i64`; narrow signed/unsigned types are memory storage formats that load into `i32`.
- Runtime bounds checks are optional user-level instrumentation and should be disabled for performance measurements.

## Quality assurance

- Treat `scoreRoute` in `annealing_shared.ts` as the scoring authority. WASM and optimized solvers must report exactly the same score for the schedule they return.
- Run `bun test tests/wasm.test.ts` after DSL, code-generation, packed-struct, or WASM-planner changes.
- Use `bun x tsc --noEmit` for type checking. At the time of writing, `src/view/requestView.ts` has unrelated existing unresolved-global errors; do not mistake those for failures introduced elsewhere.
- Benchmark deterministic, identical planner inputs and equal search work. Record solution score as well as search time: a faster solver that changes the search distribution may produce different quality.
- Keep debug checks and validation available, but exclude compilation, setup, and readback consistently when comparing search-loop performance.
