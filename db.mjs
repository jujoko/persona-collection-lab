import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export async function insertCharacter(character) {
  const { error } = await supabase.from("characters").upsert({
    id: character.id,
    prompt: character.prompt,
    generated_name: character.generated_name,
    free_text_length: character.free_text_length,
    has_embedding: !!character.external_embedding,
    raw: character
  }, { onConflict: "id", ignoreDuplicates: true });
  if (error) throw error;
}

export async function insertSimulation(simulation) {
  const { error } = await supabase.from("simulations").upsert({
    id: simulation.character_id + "_" + Date.now(),
    character_id: simulation.character_id,
    ending_id: simulation.ending?.id ?? null,
    survived: simulation.ending?.survived ?? null,
    raw: simulation
  }, { onConflict: "id", ignoreDuplicates: true });
  if (error) throw error;
}

export async function insertFeedback(feedback) {
  const { error } = await supabase.from("feedback").upsert({
    id: feedback.character_id + "_" + feedback.event_id + "_" + Date.now(),
    character_id: feedback.character_id,
    event_id: feedback.event_id,
    action: feedback.action,
    feedback_signal: feedback.feedback_signal,
    raw: feedback
  }, { onConflict: "id", ignoreDuplicates: true });
  if (error) throw error;
}

export async function exportAll() {
  const [c, s, f] = await Promise.all([
    supabase.from("characters").select("*"),
    supabase.from("simulations").select("*"),
    supabase.from("feedback").select("*")
  ]);
  return {
    characters: c.data ?? [],
    simulations: s.data ?? [],
    feedback: f.data ?? []
  };
}
