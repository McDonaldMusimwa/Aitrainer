Good next step, and it plugs cleanly into what's already built. A few thoughts before you commit to an approach:

Where it lives: extend the existing agent service rather than the main backend — it already has the provider abstraction (demo/ollama/gemini) and is the right boundary for "talk to an LLM." Add a new endpoint like POST /v1/plan that takes the AssessmentDetail payload (which you already have, fully built) as input.

How it should generate output: use Gemini's structured-output/JSON mode, validated against Pydantic schemas on the way back — not free-text parsing. That way a hallucinated or malformed field fails validation loudly instead of silently corrupting a saved workout plan.

Sync vs async: plan generation will take a few real seconds of LLM latency, so I'd follow the pattern your own AiAssessment model already establishes — create the plan row as PENDING, kick off generation in the background, flip to COMPLETED/FAILED. The client polls rather than the request hanging open.

The real gap: TrainingPlan, TrainingWeek, Workout, WorkoutExercise, and NutritionPlan don't exist as backend models yet — they were only named in the original design doc as "add after onboarding works." That's a real modeling pass, similar in size to what we just did for Assessment, before the AI has anywhere concrete to write its output.

One decision worth making upfront: should the AI pick exercises from a fixed, curated exercise library (safer — it can never suggest something incompatible with a user's equipment or an active HealthConstraint), or generate exercise names freely (more flexible, more hallucination-prone, harder to build consistent UI around)? Given how much weight your schema already puts on separating user-reported facts from AI observations, I'd lean toward a curated library — but that's a real product call, not just a technical one.

Want me to start with the TrainingPlan/NutritionPlan schemas, or sketch the agent's plan-generation endpoint first?