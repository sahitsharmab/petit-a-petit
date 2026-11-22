import { SKILLS, getSkill } from "@/lib/content/curriculum";
import { createRng, exerciseForItem, generateExercise, pick, type GenContext } from "@/lib/content/generate";
import { TEMPLATE_BY_ID } from "@/lib/content/templates";
import type { Exercise, ExerciseType } from "@/lib/content/types";

export interface AssembleInput {
  lessonId: string;
  templateId: string;
  primarySkillId: string;
  reviewKeys: string[];
  weekNumber: number;
  seed: number;
  /** Item keys used in recent lessons (to vary content). */
  recentItemKeys?: string[];
}

const RECOGNITION: ExerciseType[] = ["multiple_choice", "fill_blank", "listening", "conjugation"];

/** Order core types from recognition to production, cycling through the skill's preferences. */
export function coreTypeSequence(skillId: string, count: number, consolidate: boolean): ExerciseType[] {
  const types = getSkill(skillId).practice.types.filter((t) => t !== "dialogue" && t !== "sentence_builder");
  const pool = types.length ? types : (["multiple_choice", "translation"] as ExerciseType[]);
  const seq: ExerciseType[] = [];
  for (let i = 0; seq.length < count; i++) seq.push(pool[i % pool.length]);
  const rank = (t: ExerciseType) => (RECOGNITION.includes(t) ? 0 : 1);
  // Consolidation days lean on production (typing) exercises.
  if (consolidate) return seq.map((t) => (t === "multiple_choice" && pool.includes("fill_blank") ? "fill_blank" : t)).sort((a, b) => rank(a) - rank(b));
  return seq.sort((a, b) => rank(a) - rank(b));
}

export function assembleLesson(input: AssembleInput): Exercise[] {
  const template = TEMPLATE_BY_ID[input.templateId];
  if (!template) throw new Error(`Unknown template ${input.templateId}`);
  const rng = createRng(input.seed);
  const used = new Set<string>(input.recentItemKeys ?? []);
  const inLesson = new Set<string>();
  const counter = { n: 0 };
  const out: Exercise[] = [];

  const ctxFor = (section: Exercise["section"]): GenContext => ({ rng, section, avoid: new Set([...used, ...inLesson]), idPrefix: input.lessonId, counter });

  const push = (ex: Exercise | null): boolean => {
    if (!ex || inLesson.has(ex.itemKey + ex.type)) return false;
    inLesson.add(ex.itemKey + ex.type);
    inLesson.add(ex.itemKey);
    out.push(ex);
    return true;
  };

  const tryTypes = (section: Exercise["section"], skillId: string, types: ExerciseType[]): boolean => {
    for (let attempt = 0; attempt < 4; attempt++) {
      for (const t of types) if (push(generateExercise(ctxFor(section), skillId, t))) return true;
    }
    return false;
  };

  for (const block of template.blocks) {
    if (block.from === "review") {
      for (const key of input.reviewKeys.slice(0, block.count)) {
        if (key.startsWith("skill:")) {
          const sid = key.slice(6);
          const types = getSkill(sid).practice.types.filter((t) => t !== "dialogue");
          tryTypes(block.section, sid, [pick(rng, types), ...types]);
        } else if (!push(exerciseForItem(ctxFor(block.section), key))) {
          // Item no longer generatable: fall back to its skill.
          const sid = key.split(":")[1];
          if (SKILLS.some((s) => s.id === sid)) tryTypes(block.section, sid, getSkill(sid).practice.types);
        }
      }
      continue;
    }
    if (block.from === "week") {
      const inWeek = SKILLS.filter((s) => s.week === input.weekNumber);
      const taught = inWeek.filter((s) => s.category !== "review");
      // A review-only week (Week 12) revises through its review skills, which mix the earlier weeks.
      const weekSkills = taught.length ? taught : inWeek.filter((s) => s.practice.includeSkills?.length);
      if (!weekSkills.length) continue;
      for (let i = 0; i < block.count; i++) {
        const s = weekSkills[i % weekSkills.length];
        tryTypes(block.section, s.id, [pick(rng, s.practice.types), ...s.practice.types]);
      }
      continue;
    }
    const sid = input.primarySkillId;
    if (block.types) {
      for (let i = 0; i < block.count; i++) {
        if (tryTypes(block.section, sid, block.types)) continue;
        // Fallbacks: build → translation; conversation → a dialogue from a nearby skill.
        if (block.types.includes("sentence_builder")) tryTypes(block.section, sid, ["translation", "fill_blank"]);
        else if (block.types.includes("dialogue")) {
          const week = getSkill(sid).week;
          const nearby = SKILLS.filter((s) => s.week <= week && s.week >= week - 2 && s.practice.types.includes("dialogue"))
            .concat(SKILLS.filter((s) => s.id === "w11-situations" || s.id === "w1-basic-sentences"));
          for (const s of nearby) if (tryTypes(block.section, s.id, ["dialogue"])) break;
        }
      }
      continue;
    }
    const seq = coreTypeSequence(sid, block.count, input.templateId === "daily-consolidate");
    for (const t of seq) tryTypes(block.section, sid, [t, ...getSkill(sid).practice.types]);
  }
  return out.map((e, i) => ({ ...e, id: `${input.lessonId}-e${i + 1}` }));
}
