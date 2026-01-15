"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { toPng } from "html-to-image";

/* ========================================================================== */
/*                             MATCHING LOGIC                                 */
/* ========================================================================== */

/**
 * Important design:
 * - Q1–Q4 create an INTERNAL Customer Code (A/B/C/D). Customers never see it.
 * - Q5–Q8 create the CUSTOMER-FACING Instructor Match (Structured/Coaching/Free Spirit/Patient).
 */

type AnswerKey = "A" | "B" | "C" | "D";

type ParentType = "supersonic" | "high_maintenance" | "extra_attention" | "budget";
type ParentCode = "A" | "B" | "C" | "D";

type InstructorType = "structured" | "coaching" | "free_spirit" | "patient";

type MatchState = {
  // Parent / customer expectations (internal code)
  q1?: AnswerKey;
  q2?: AnswerKey;
  q3?: AnswerKey;
  q4?: AnswerKey;

  // Swimmer learning style (instructor match)
  q5?: AnswerKey;
  q6?: AnswerKey;
  q7?: AnswerKey;
  q8?: AnswerKey;
};

const PARENT_QUESTIONS = [
  {
    id: "q1",
    title: "What matters most to you about swim lessons?",
    options: [
      { key: "A", text: "How quickly my child becomes water-safe and more independent" },
      { key: "B", text: "Instructor experience, curriculum, and lesson structure" },
      { key: "C", text: "An instructor who really understands my child" },
      { key: "D", text: "Pricing, value, and discounts or promotions" },
    ] as { key: AnswerKey; text: string }[],
  },
  {
    id: "q2",
    title: "How would you describe your communication style with staff?",
    options: [
      { key: "A", text: "Quick and direct, I am juggling a lot" },
      { key: "B", text: "I ask detailed questions and like to stay informed" },
      { key: "C", text: "I share a lot about my child and how things are going" },
      { key: "D", text: "Straightforward and focused on logistics" },
    ] as { key: AnswerKey; text: string }[],
  },
  {
    id: "q3",
    title: "Which best describes your situation right now?",
    options: [
      { key: "A", text: "Busy schedule with multiple activities" },
      { key: "B", text: "First-time swim parent or very hands-on" },
      { key: "C", text: "My child needs extra reassurance or accommodations" },
      { key: "D", text: "We are cost-conscious and planning carefully" },
    ] as { key: AnswerKey; text: string }[],
  },
  {
    id: "q4",
    title: "If you had a concern, what would you most likely ask first?",
    options: [
      { key: "A", text: "How long until we see progress?" },
      { key: "B", text: "Can you explain the instructor approach or curriculum?" },
      { key: "C", text: "Can we talk through what I am noticing with my child?" },
      { key: "D", text: "Are there options that improve the value or pricing?" },
    ] as { key: AnswerKey; text: string }[],
  },
] as const;

const SWIMMER_QUESTIONS = [
  {
    id: "q5",
    title: "My swimmer learns best when lessons feel like...",
    options: [
      { key: "A", text: "A consistent routine each week with clear steps" }, // Structured
      { key: "B", text: "A challenge with goals and a coach vibe" }, // Coaching
      { key: "C", text: "Fun-first and low pressure, confidence comes first" }, // Free Spirit
      { key: "D", text: "Encouraging and upbeat, with gentle pushing when ready" }, // Patient
    ] as { key: AnswerKey; text: string }[],
  },
  {
    id: "q6",
    title: "When my swimmer is nervous, they respond best to...",
    options: [
      { key: "A", text: "A calm plan and small, steady steps" }, // Structured
      { key: "B", text: "Motivating coaching like, you got this, try it" }, // Coaching
      { key: "C", text: "Play and comfort until they choose to try" }, // Free Spirit
      { key: "D", text: "Positive reinforcement, games, and small wins" }, // Patient
    ] as { key: AnswerKey; text: string }[],
  },
  {
    id: "q7",
    title: "What keeps my swimmer most engaged?",
    options: [
      { key: "A", text: "Knowing exactly what comes next" }, // Structured
      { key: "B", text: "Beating their last goal and leveling up" }, // Coaching
      { key: "C", text: "Having fun in the water and staying relaxed" }, // Free Spirit
      { key: "D", text: "Feeling proud with lots of encouragement" }, // Patient
    ] as { key: AnswerKey; text: string }[],
  },
  {
    id: "q8",
    title: "How would you like us to push progress?",
    options: [
      { key: "A", text: "Steady pace, consistency matters most" }, // Structured
      { key: "B", text: "Faster pace when they can handle it" }, // Coaching
      { key: "C", text: "Gentle pace, confidence first" }, // Free Spirit
      { key: "D", text: "Faster pace, but only with lots of encouragement" }, // Patient
    ] as { key: AnswerKey; text: string }[],
  },
] as const;

const PARENT_MAP: Record<AnswerKey, ParentType> = {
  A: "supersonic",
  B: "high_maintenance",
  C: "extra_attention",
  D: "budget",
};

const PARENT_CODE: Record<ParentType, ParentCode> = {
  supersonic: "A",
  high_maintenance: "B",
  extra_attention: "C",
  budget: "D",
};

const INSTRUCTOR_MAP: Record<AnswerKey, InstructorType> = {
  A: "structured",
  B: "coaching",
  C: "free_spirit",
  D: "patient",
};

const INSTRUCTOR_DISPLAY: Record<
  InstructorType,
  { name: string; headline: string; summary: string; bullets: string[] }
> = {
  structured: {
    name: "Structured Sam / Steven",
    headline: "Consistent, routine-based learning",
    summary:
      "Great for swimmers who love predictable lessons, clear steps, and steady progress with a calm, structured approach.",
    bullets: ["Consistent routine each week", "Clear skill progression", "Great for detail-focused families"],
  },
  coaching: {
    name: "Coaching Carly / Cameron",
    headline: "Goal-driven coaching and momentum",
    summary:
      "Great for swimmers who like a challenge and families who want progress with strong goals, milestones, and motivation.",
    bullets: ["Milestone-driven instruction", "Higher pace when ready", "Great for goal-focused swimmers"],
  },
  free_spirit: {
    name: "Free Spirit Franny / Frank",
    headline: "Play-based and low pressure",
    summary:
      "Great for swimmers who need confidence first. Lessons stay fun and light, while skills build naturally over time.",
    bullets: ["Fun-first confidence building", "Low-pressure progress", "Great for cautious swimmers"],
  },
  patient: {
    name: "Patient Pat / Patty",
    headline: "Encouraging and confidence-building",
    summary:
      "Great for swimmers who thrive with praise, reassurance, and an upbeat style that gently pushes progress at the right time.",
    bullets: ["Warm encouragement", "Great for anxious swimmers", "Progress with positive reinforcement"],
  },
};

function computeParentScores(state: MatchState) {
  const scores: Record<ParentType, number> = {
    supersonic: 0,
    high_maintenance: 0,
    extra_attention: 0,
    budget: 0,
  };

  // Keep your existing weights, they are fine for internal customer classification
  const w = { q1: 40, q2: 30, q3: 20, q4: 10 };

  if (state.q1) scores[PARENT_MAP[state.q1]] += w.q1;
  if (state.q2) scores[PARENT_MAP[state.q2]] += w.q2;
  if (state.q3) scores[PARENT_MAP[state.q3]] += w.q3;
  if (state.q4) scores[PARENT_MAP[state.q4]] += w.q4;

  return scores;
}

function pickParentWinner(state: MatchState) {
  const scores = computeParentScores(state);
  const answers = [state.q1, state.q2, state.q3, state.q4];
  if (answers.some((a) => !a)) return { winner: undefined as ParentType | undefined, scores };

  const sorted = (Object.entries(scores) as [ParentType, number][]).sort((a, b) => b[1] - a[1]);
  return { winner: sorted[0][0], scores };
}

function computeInstructorScores(state: MatchState) {
  const scores: Record<InstructorType, number> = {
    structured: 0,
    coaching: 0,
    free_spirit: 0,
    patient: 0,
  };

  // Slightly favor the progress preference question (q8) so it has a bit more influence
  const w = { q5: 25, q6: 25, q7: 20, q8: 30 };

  if (state.q5) scores[INSTRUCTOR_MAP[state.q5]] += w.q5;
  if (state.q6) scores[INSTRUCTOR_MAP[state.q6]] += w.q6;
  if (state.q7) scores[INSTRUCTOR_MAP[state.q7]] += w.q7;
  if (state.q8) scores[INSTRUCTOR_MAP[state.q8]] += w.q8;

  return scores;
}

function pickInstructorMatch(state: MatchState) {
  const scores = computeInstructorScores(state);
  const answers = [state.q5, state.q6, state.q7, state.q8];
  if (answers.some((a) => !a)) return { primary: undefined as InstructorType | undefined, secondary: undefined as InstructorType | undefined, scores };

  const sorted = (Object.entries(scores) as [InstructorType, number][]).sort((a, b) => b[1] - a[1]);
  const primary = sorted[0][0];

  // Secondary appears only if close enough to be meaningful
  const topScore = sorted[0][1];
  const second = sorted[1][0];
  const secondScore = sorted[1][1];

  const includeSecondary = topScore - secondScore <= 20; // tweakable
  return { primary, secondary: includeSecondary ? second : undefined, scores };
}

/* ========================================================================== */
/*                               LEVEL FINDER                                 */
/* ========================================================================== */

type LevelKey =
  | "PARENTTOT"
  | "TODDLER_TRANSITION"
  | "BEGINNER_1"
  | "BEGINNER_2"
  | "BEGINNER_3"
  | "BEGINNER_4"
  | "INTERMEDIATE_1"
  | "INTERMEDIATE_2"
  | "INTERMEDIATE_3"
  | "ADVANCED_1"
  | "ADVANCED_2"
  | "ADULT_1"
  | "ADULT_2";

const LEVELS: Record<LevelKey, { title: string; ratio: string; description: string }> = {
  PARENTTOT: {
    title: "PARENTTOT - Intro to Water (4 mo. to 36 mo.)",
    ratio: "6:1 Ratio",
    description: "Parent and child build comfort and foundational skills together, with a path to independent lessons when ready.",
  },
  TODDLER_TRANSITION: {
    title: "TODDLER TRANSITION - Water Comfort and Water Safety Basics (24 mo. to 36 mo.)",
    ratio: "3:1 Ratio",
    description: "Swimmers learn fundamental safety and comfort skills in a parent-free group format, with repetition and encouragement.",
  },
  BEGINNER_1: {
    title: "BEGINNER 1 - Introduction to Water Safety and Swimming Foundations",
    ratio: "4:1 Ratio",
    description: "Fun-focused fundamentals: body position and kicking to build a strong swimming foundation.",
  },
  BEGINNER_2: {
    title: "BEGINNER 2 - Water Safety and Swimming Foundations",
    ratio: "4:1 Ratio",
    description: "SSP journey begins: essential water safety and confidence in self-rescue and independent swimming.",
  },
  BEGINNER_3: {
    title: "BEGINNER 3 - Water Safety and Basic Strokes",
    ratio: "4:1 Ratio",
    description: "Refines safety skills and begins combining them with basic strokes and propulsion skills.",
  },
  BEGINNER_4: {
    title: "BEGINNER 4 - Water Safety and Stroke Development",
    ratio: "4:1 Ratio",
    description: "Swimmers are ready to pass SSP Test and develop freestyle side breathing and backstroke further.",
  },
  INTERMEDIATE_1: {
    title: "INTERMEDIATE 1 - Freestyle, Backstroke, Intro to Breaststroke",
    ratio: "4:1 Ratio",
    description: "Endurance and technique work with intro to breaststroke kick, plus ongoing safety skill reinforcement.",
  },
  INTERMEDIATE_2: {
    title: "INTERMEDIATE 2 - Breaststroke plus Intro to Butterfly",
    ratio: "4:1 Ratio",
    description: "Refines breaststroke and introduces butterfly through dolphin kick progressions, plus self-rescue stamina.",
  },
  INTERMEDIATE_3: {
    title: "INTERMEDIATE 3 - All Four Strokes Technique",
    ratio: "4:1 Ratio",
    description: "Refines all four strokes with drills, technique, strength, and endurance development.",
  },
  ADVANCED_1: {
    title: "ADVANCED 1 - Technique Refinement and Proficiency",
    ratio: "4:1 Ratio",
    description: "Builds stamina across four strokes while refining technique for efficiency and longer distances.",
  },
  ADVANCED_2: {
    title: "ADVANCED 2 - Endurance and Advanced Techniques",
    ratio: "4:1 Ratio",
    description: "Final level. Advanced refinement and efficient technique while swimming challenging distances.",
  },
  ADULT_1: {
    title: "ADULT 1 - Learn-to-Swim",
    ratio: "4:1 Ratio",
    description: "Adults (16+) with no experience or fear of water learn basic safety skills and progress to freestyle.",
  },
  ADULT_2: {
    title: "ADULT 2 - Learn-to-Swim",
    ratio: "4:1 Ratio",
    description: "Builds on Adult 1: freestyle with side breath, backstroke technique, and fundamentals of breaststroke.",
  },
};

type LevelState = {
  birthday?: string;
  parentInWater?: boolean;
  s1_bubbles5?: boolean;
  s2_backFloatSupport?: boolean;
  s3_floatFrontBackInd?: boolean;
  s4_kickFrontWithDeviceEyesIn?: boolean;
  s5_kickFrontBackInd?: boolean;
  s6_sixArmStrokesFreeBack?: boolean;
  s7_freestyleSideBreath12?: boolean;
  s8_backstroke12?: boolean;
  s9_freeSideBreathAndBack25yd?: boolean;
  s10_breastKickPro?: boolean;
  s11_breastAndDolphinPro?: boolean;
  s12_flipAndOpenTurnsIntro?: boolean;
  s13_allStrokesAndTurnsPro?: boolean;
  enduranceStrong?: boolean;
};

type SkillQuestion = { key: keyof LevelState; text: string };

const SKILL_QUESTIONS: SkillQuestion[] = [
  { key: "s1_bubbles5", text: "Can your swimmer put their face in the water and blow bubbles for 5 seconds without hesitation?" },
  { key: "s2_backFloatSupport", text: "Can your swimmer lie on their back with ears in the water and kick with support?" },
  { key: "s3_floatFrontBackInd", text: "Can your swimmer float on front and back independently?" },
  { key: "s4_kickFrontWithDeviceEyesIn", text: "Can they kick on their front with eyes in the water while holding a flotation device?" },
  { key: "s5_kickFrontBackInd", text: "Can your swimmer kick easily on their front and back independently?" },
  { key: "s6_sixArmStrokesFreeBack", text: "Can your swimmer do 6 arm strokes of freestyle and backstroke independently?" },
  { key: "s7_freestyleSideBreath12", text: "Can your swimmer breathe to the side in freestyle for 12 arm strokes?" },
  { key: "s8_backstroke12", text: "Can your swimmer do backstroke for 12 arm strokes?" },
  { key: "s9_freeSideBreathAndBack25yd", text: "Can your swimmer swim freestyle with side breathing and backstroke for 25 yards (75 ft)?" },
  { key: "s10_breastKickPro", text: "Can your swimmer kick breaststroke proficiently?" },
  { key: "s11_breastAndDolphinPro", text: "Is your swimmer proficient at breaststroke and dolphin kick?" },
  { key: "s12_flipAndOpenTurnsIntro", text: "Has your swimmer been introduced to flip turns and open turns?" },
  { key: "s13_allStrokesAndTurnsPro", text: "Is your swimmer proficient at all four strokes plus turns?" },
];

function monthsBetween(dob: Date, now: Date) {
  let months = (now.getFullYear() - dob.getFullYear()) * 12 + (now.getMonth() - dob.getMonth());
  if (now.getDate() < dob.getDate()) months -= 1;
  return months;
}

function yearsBetween(dob: Date, now: Date) {
  let years = now.getFullYear() - dob.getFullYear();
  const hadBirthday = now.getMonth() > dob.getMonth() || (now.getMonth() === dob.getMonth() && now.getDate() >= dob.getDate());
  if (!hadBirthday) years -= 1;
  return years;
}

function daysBetween(a: Date, b: Date) {
  const ms = 24 * 60 * 60 * 1000;
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((utcB - utcA) / ms);
}

function getBirthdayGreeting(dob: Date, now: Date): { title: string; body: string } | null {
  const thisYear = now.getFullYear();
  const thisYearsBirthday = new Date(thisYear, dob.getMonth(), dob.getDate());
  const lastBirthday = new Date(thisYearsBirthday);
  const nextBirthday = new Date(thisYearsBirthday);

  if (thisYearsBirthday > now) lastBirthday.setFullYear(thisYear - 1);
  else nextBirthday.setFullYear(thisYear + 1);

  const daysSinceLast = daysBetween(lastBirthday, now);
  const daysUntilNext = daysBetween(now, nextBirthday);

  if (daysSinceLast >= 1 && daysSinceLast <= 14) {
    return { title: "Happy belated birthday!", body: "Swimming is a pretty awesome gift. Let’s build confidence and water safety this year." };
  }

  if (daysUntilNext >= 0 && daysUntilNext <= 14) {
    return { title: "Happy birthday!", body: "A new year and a new skill. Let’s get started and build confidence in the water." };
  }

  return null;
}

function computeLevel(state: LevelState): { levelKey?: LevelKey; reason?: string } {
  if (!state.birthday) return {};
  const dob = new Date(state.birthday + "T00:00:00");
  const now = new Date();
  const months = monthsBetween(dob, now);
  const years = yearsBetween(dob, now);

  if (months < 4) return {};
  if (months >= 4 && months < 24) return { levelKey: "PARENTTOT", reason: "4 to 23 months is best in ParentTot." };

  if (months >= 24 && months <= 36) {
    if (state.parentInWater === true) return { levelKey: "PARENTTOT", reason: "Toddler age with parent in the water." };
    if (state.parentInWater === false) return { levelKey: "TODDLER_TRANSITION", reason: "Toddler age in independent group format." };
    return {};
  }

  if (years >= 16) return { levelKey: "ADULT_1", reason: "Swimmer is 16+." };

  const no = (k: keyof LevelState) => state[k] === false;

  if (no("s1_bubbles5")) return { levelKey: "BEGINNER_1", reason: "Face-in-water comfort is still developing." };
  if (no("s2_backFloatSupport")) return { levelKey: "BEGINNER_1", reason: "Back float comfort is still developing." };
  if (no("s3_floatFrontBackInd")) return { levelKey: "BEGINNER_1", reason: "Independent floating is still developing." };

  if (no("s4_kickFrontWithDeviceEyesIn")) return { levelKey: "BEGINNER_2", reason: "Front kicking with eyes in the water is still developing." };
  if (no("s5_kickFrontBackInd")) return { levelKey: "BEGINNER_2", reason: "Independent kicking is still developing." };

  if (no("s6_sixArmStrokesFreeBack")) return { levelKey: "BEGINNER_3", reason: "Arm stroke coordination is still developing." };
  if (no("s7_freestyleSideBreath12")) return { levelKey: "BEGINNER_3", reason: "Side breathing endurance is still developing." };

  if (no("s8_backstroke12")) return { levelKey: "BEGINNER_4", reason: "Backstroke consistency is still developing." };
  if (no("s9_freeSideBreathAndBack25yd")) return { levelKey: "BEGINNER_4", reason: "25-yard endurance is still developing." };

  if (no("s10_breastKickPro")) return { levelKey: "INTERMEDIATE_1", reason: "Breaststroke kick is next." };
  if (no("s11_breastAndDolphinPro")) return { levelKey: "INTERMEDIATE_2", reason: "Dolphin kick proficiency is still developing." };
  if (no("s12_flipAndOpenTurnsIntro")) return { levelKey: "INTERMEDIATE_3", reason: "Turns are still developing." };
  if (no("s13_allStrokesAndTurnsPro")) return { levelKey: "INTERMEDIATE_3", reason: "All four strokes and turns are still developing." };

  if (state.enduranceStrong === true) return { levelKey: "ADVANCED_2", reason: "Strong proficiency plus strong endurance." };
  if (state.enduranceStrong === false) return { levelKey: "ADVANCED_1", reason: "Strong proficiency. Endurance and efficiency next." };

  return {};
}

/* ========================================================================== */
/*                                   UI                                       */
/* ========================================================================== */

type Stage = "landing" | "match_parent" | "match_swimmer" | "age" | "skills" | "endurance" | "comments" | "results";
type ContactMethod = "email" | "phone" | "";

const LOCATIONS = [
  "SwimLabs Westchester",
  "SwimLabs The Woodlands",
  "SafeSplash Riverdale",
  "SafeSplash Santa Monica",
  "SafeSplash Torrance",
  "SafeSplash Summerlin",
] as const;

type LocationName = (typeof LOCATIONS)[number];

const LOCATION_PORTAL: Record<LocationName, string> = {
  "SwimLabs Westchester": "https://portal.iclasspro.com/westchesterny/classes",
  "SafeSplash Riverdale": "https://portal.iclasspro.com/yonkersriverdaleny/classes",
  "SwimLabs The Woodlands": "https://portal.iclasspro.com/thewoodlandsnorthtx/classes",
  "SafeSplash Santa Monica": "https://portal.iclasspro.com/santamonicasunsetparkca/classes",
  "SafeSplash Torrance": "https://portal.iclasspro.com/torrancedelamoca/classes",
  "SafeSplash Summerlin": "https://portal.iclasspro.com/lasvegassummerlinnv/classes",
};

const LOCATION_CONTACT: Record<LocationName, { brand: "SwimLabs" | "SafeSplash"; phone: string; email: string }> = {
  "SwimLabs Westchester": { brand: "SwimLabs", phone: "914-800-7946", email: "westchester-ny@swimlabs.com" },
  "SwimLabs The Woodlands": { brand: "SwimLabs", phone: "(281) 688-5993", email: "the-woodlands-north-tx@swimlabs.com" },
  "SafeSplash Riverdale": { brand: "SafeSplash", phone: "914-215-1683", email: "yonkers-riverdale-ny@safesplash.com" },
  "SafeSplash Santa Monica": { brand: "SafeSplash", phone: "424-282-4301", email: "santa-monica-sunset-park-ca@safesplash.com" },
  "SafeSplash Torrance": { brand: "SafeSplash", phone: "424-282-4304", email: "torrance-del-amo-ca@safesplash.com" },
  "SafeSplash Summerlin": { brand: "SafeSplash", phone: "702-291-1937", email: "las-vegas-summerlin-nv@safesplash.com" },
};

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Saturday", "Sunday"] as const;

const TIME_WINDOWS = [
  "Morning (9am to 12pm, weekends only)",
  "Early Afternoon (12pm to 4pm, all days)",
  "Afternoon (4pm to 6pm, weekdays only)",
  "Evening (6pm to 8pm, weekdays only)",
  "Flexible",
] as const;

function classNames(...xs: Array<string | false | undefined | null>) {
  return xs.filter(Boolean).join(" ");
}

function Progress({ labels, activeIndex }: { labels: string[]; activeIndex: number }) {
  return (
    <div className="mx-auto mt-8 max-w-4xl px-4">
      <div className="rounded-3xl border border-white/50 bg-white/70 p-4 shadow-sm backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          {labels.map((label, i) => {
            const done = i < activeIndex;
            const active = i === activeIndex;

            return (
              <div key={label} className="flex flex-1 items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={classNames(
                      "h-10 w-10 rounded-full border-2 flex items-center justify-center text-sm font-extrabold",
                      done && "bg-emerald-600 border-emerald-600 text-white",
                      active && !done && "border-indigo-500 text-indigo-700 bg-white",
                      !active && !done && "border-slate-300 text-slate-500 bg-white"
                    )}
                  >
                    {done ? "✓" : i + 1}
                  </div>
                  <div className={classNames("mt-2 text-[11px] font-semibold text-center", active || done ? "text-slate-900" : "text-slate-600")}>
                    {label}
                  </div>
                </div>

                {i !== labels.length - 1 && (
                  <div className="mx-3 h-[3px] flex-1 rounded-full bg-slate-200">
                    <div className="h-[3px] rounded-full bg-emerald-600" style={{ width: done ? "100%" : "0%" }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Container({
  title,
  subtitle,
  emoji,
  children,
}: {
  title: string;
  subtitle: string;
  emoji?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-5xl px-4 pb-14">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm backdrop-blur">
          <span aria-hidden>{emoji ?? "✨"}</span>
          <span>Quick and easy</span>
        </div>

        <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-900">{title}</h1>
        <p className="mx-auto mt-3 max-w-2xl text-lg font-medium text-slate-800">{subtitle}</p>
      </div>

      <div className="mt-8 rounded-3xl border border-white/50 bg-white/80 p-8 sm:p-10 shadow-xl backdrop-blur">
        {children}
      </div>
    </div>
  );
}

function PrimaryButton({ onClick, disabled, label }: { onClick: () => void; disabled?: boolean; label: string }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={classNames(
        "mt-6 h-14 w-full rounded-2xl text-base font-extrabold text-white shadow-lg",
        disabled ? "bg-indigo-300 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800"
      )}
    >
      {label}
    </button>
  );
}

function SecondaryButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-12 rounded-2xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-900 hover:border-indigo-500 hover:bg-indigo-50"
    >
      {label}
    </button>
  );
}

function OptionButton({
  onClick,
  icon,
  label,
  sub,
}: {
  onClick: () => void;
  icon: string;
  label: string;
  sub?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-left shadow-sm transition hover:border-indigo-400 hover:bg-indigo-50"
    >
      <div className="flex items-start gap-4">
        <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-xl">
          {icon}
        </div>
        <div className="flex-1">
          <div className="text-base font-extrabold text-slate-900">{label}</div>
          {sub && <div className="mt-1 text-sm font-medium text-slate-700">{sub}</div>}
        </div>
        <div className="mt-1 text-slate-400">›</div>
      </div>
    </button>
  );
}

function ContactBanner({
  location,
  contact,
  variant,
}: {
  location: LocationName | "";
  contact: { brand: "SwimLabs" | "SafeSplash"; phone: string; email: string } | null;
  variant: "landing" | "results";
}) {
  if (!location || !contact) return null;

  const headline =
    variant === "landing"
      ? "Your first lesson is 100% free, no credit card required."
      : "Nice work. Save your results and send them to us, we will help you pick the perfect class.";

  return (
    <div className="mt-6 rounded-3xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
      <div className="text-sm font-extrabold text-emerald-800">{contact.brand}</div>
      <div className="mt-1 text-lg font-extrabold text-slate-900">{headline}</div>

      <div className="mt-3 grid gap-1 text-slate-900">
        <div>
          <span className="font-bold">Location:</span> {location}
        </div>
        <div>
          <span className="font-bold">Phone:</span> {contact.phone}
        </div>
        <div>
          <span className="font-bold">Email:</span> {contact.email}
        </div>
      </div>

      <div className="mt-3 text-sm font-semibold text-slate-700">
        Tip: Share your preferred day and time window and we will match you to the best option.
      </div>
    </div>
  );
}

function Modal({ open, title, body, onClose }: { open: boolean; title: string; body: string; onClose: () => void }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="text-xl font-extrabold text-slate-900">{title}</div>
        <div className="mt-3 whitespace-pre-wrap text-slate-800">{body}</div>
        <button
          type="button"
          onClick={onClose}
          className="mt-6 h-12 w-full rounded-2xl bg-indigo-600 font-extrabold text-white hover:bg-indigo-700"
        >
          Got it
        </button>
      </div>
    </div>
  );
}

/* --------------------------- Clipboard helpers ---------------------------- */

async function copyTextSmart(text: string) {
  try {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through
  }

  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "true");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    ta.style.top = "0";
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, ta.value.length);
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

/* ========================================================================== */
/*                                   PAGE                                     */
/* ========================================================================== */

export default function Page() {
  const [stage, setStage] = useState<Stage>("landing");

  // Staff mode: add ?staff=1 to URL to reveal internal code to staff only
  const [staffMode, setStaffMode] = useState(false);
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      setStaffMode(params.get("staff") === "1");
    } catch {
      setStaffMode(false);
    }
  }, []);

  // Landing intake
  const [clientName, setClientName] = useState("");
  const [location, setLocation] = useState<LocationName | "">("");
  const [preferredDay, setPreferredDay] = useState<(typeof DAYS)[number] | "">("");
  const [preferredTime, setPreferredTime] = useState<(typeof TIME_WINDOWS)[number] | "">("");

  const [contactMethod, setContactMethod] = useState<ContactMethod>("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  // Match flows
  const [parentStep, setParentStep] = useState(0);
  const [swimmerStep, setSwimmerStep] = useState(0);
  const [match, setMatch] = useState<MatchState>({});

  // Level flow
  const [level, setLevel] = useState<LevelState>({});
  const [skillIndex, setSkillIndex] = useState(0);

  // Comments
  const [comments, setComments] = useState("");

  // UI helpers
  const [toast, setToast] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [tooYoungOpen, setTooYoungOpen] = useState(false);

  const resultsRef = useRef<HTMLDivElement | null>(null);

  const contact = location ? LOCATION_CONTACT[location] : null;
  const portalUrl = location ? LOCATION_PORTAL[location] : "";

  const parentPick = useMemo(() => pickParentWinner(match), [match]);
  const internalCustomerCode: ParentCode | undefined = parentPick.winner ? PARENT_CODE[parentPick.winner] : undefined;

  const instructorPick = useMemo(() => pickInstructorMatch(match), [match]);
  const primaryInstructor = instructorPick.primary ? INSTRUCTOR_DISPLAY[instructorPick.primary] : null;
  const secondaryInstructor = instructorPick.secondary ? INSTRUCTOR_DISPLAY[instructorPick.secondary] : null;

  const levelPick = useMemo(() => computeLevel(level), [level]);

  const birthdayGreeting = useMemo(() => {
    if (!level.birthday) return null;
    const dob = new Date(level.birthday + "T00:00:00");
    const now = new Date();
    return getBirthdayGreeting(dob, now);
  }, [level.birthday]);

  const resetAll = () => {
    setStage("landing");

    setClientName("");
    setLocation("");
    setPreferredDay("");
    setPreferredTime("");

    setContactMethod("");
    setContactEmail("");
    setContactPhone("");

    setParentStep(0);
    setSwimmerStep(0);
    setMatch({});

    setLevel({});
    setSkillIndex(0);

    setComments("");
    setToast(null);
    setTooYoungOpen(false);
  };

  const landingValid =
    clientName.trim().length > 0 &&
    location !== "" &&
    preferredDay !== "" &&
    preferredTime !== "" &&
    contactMethod !== "" &&
    (contactMethod === "email" ? contactEmail.trim().length > 3 : contactPhone.trim().length > 6);

  const answerParent = (answer: AnswerKey) => {
    const q = PARENT_QUESTIONS[parentStep];
    const id = q.id as keyof MatchState;
    setMatch((s) => ({ ...s, [id]: answer }));

    if (parentStep < PARENT_QUESTIONS.length - 1) setParentStep((n) => n + 1);
    else setStage("match_swimmer");
  };

  const answerSwimmer = (answer: AnswerKey) => {
    const q = SWIMMER_QUESTIONS[swimmerStep];
    const id = q.id as keyof MatchState;
    setMatch((s) => ({ ...s, [id]: answer }));

    if (swimmerStep < SWIMMER_QUESTIONS.length - 1) setSwimmerStep((n) => n + 1);
    else setStage("age");
  };

  const proceedAge = () => {
    if (!level.birthday) return;

    const dob = new Date(level.birthday + "T00:00:00");
    const now = new Date();
    const months = monthsBetween(dob, now);
    const years = yearsBetween(dob, now);

    if (months < 4) {
      setTooYoungOpen(true);
      return;
    }

    if (months >= 4 && months < 24) {
      setStage("comments");
      return;
    }

    if (months >= 24 && months <= 36) {
      if (level.parentInWater !== true && level.parentInWater !== false) return;
      setStage("comments");
      return;
    }

    if (years >= 16) {
      setStage("comments");
      return;
    }

    setStage("skills");
  };

  const currentSkill = SKILL_QUESTIONS[skillIndex];

  const answerSkill = (val: boolean) => {
    const key = currentSkill.key;
    setLevel((s) => ({ ...s, [key]: val }));

    if (val === false) {
      setStage("comments");
      return;
    }

    if (skillIndex === SKILL_QUESTIONS.length - 1) {
      setStage("endurance");
      return;
    }

    setSkillIndex((i) => i + 1);
  };

  const answerEndurance = (val: boolean) => {
    setLevel((s) => ({ ...s, enduranceStrong: val }));
    setStage("comments");
  };

  function buildSummaryText() {
    const lines: string[] = [];
    lines.push("Client Intake Summary");
    lines.push("------------------------------");
    lines.push(`Name: ${clientName || "N/A"}`);
    lines.push(`Location: ${location || "N/A"}`);
    lines.push(`Best day: ${preferredDay || "N/A"}`);
    lines.push(`Best time: ${preferredTime || "N/A"}`);
    lines.push(`Contact method: ${contactMethod || "N/A"}`);
    lines.push(`Contact: ${contactMethod === "email" ? contactEmail || "N/A" : contactPhone || "N/A"}`);
    lines.push("");

    lines.push("Instructor Match");
    lines.push("------------------------------");
    if (primaryInstructor) {
      lines.push(`Best match: ${primaryInstructor.name}`);
      if (secondaryInstructor) lines.push(`Also a great fit: ${secondaryInstructor.name}`);
    } else {
      lines.push("Not completed");
    }

    if (staffMode) {
      lines.push("");
      lines.push("Staff Only");
      lines.push("------------------------------");
      lines.push(`Customer Code: ${internalCustomerCode ?? "N/A"}`);
    }

    lines.push("");
    lines.push("Level Finder");
    lines.push("------------------------------");
    if (levelPick.levelKey) {
      const lv = LEVELS[levelPick.levelKey];
      lines.push(`Level: ${lv.title}`);
      lines.push(`Ratio: ${lv.ratio}`);
      if (levelPick.reason) lines.push(`Why: ${levelPick.reason}`);
    } else {
      lines.push("Not enough info");
    }

    if (comments.trim()) {
      lines.push("");
      lines.push("Comments / Concerns");
      lines.push("------------------------------");
      lines.push(comments.trim());
    }

    if (portalUrl) {
      lines.push("");
      lines.push("Enrollment Link");
      lines.push("------------------------------");
      lines.push(portalUrl);
    }

    if (contact) {
      lines.push("");
      lines.push("Location Contact");
      lines.push("------------------------------");
      lines.push(`${contact.brand} | Phone: ${contact.phone} | Email: ${contact.email}`);
    }

    return lines.join("\n");
  }

  async function copySummary() {
    const ok = await copyTextSmart(buildSummaryText());
    setToast(ok ? "Copied!" : "Copy failed. Try Save PNG, or select and copy manually.");
    setTimeout(() => setToast(null), 2500);
  }

  async function saveAsPng() {
    if (!resultsRef.current) return;

    setExporting(true);
    setToast(null);

    try {
      await new Promise((r) => requestAnimationFrame(() => r(null)));

      const dataUrl = await toPng(resultsRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });

      const link = document.createElement("a");
      const safeName = (clientName || "results").replace(/[^a-z0-9]+/gi, "_").toLowerCase();
      link.download = `swim_results_${safeName}.png`;
      link.href = dataUrl;
      link.click();

      setToast("Saved PNG.");
      setTimeout(() => setToast(null), 2000);
    } catch (e) {
      console.error(e);
      setToast("PNG export failed.");
      setTimeout(() => setToast(null), 2500);
    } finally {
      setExporting(false);
    }
  }

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Cute bright background */}
      <div className="absolute inset-0 bg-gradient-to-b from-pink-100 via-sky-100 to-emerald-100" />
      <div className="absolute -top-48 -left-48 h-[520px] w-[520px] rounded-full bg-pink-200/60 blur-3xl" />
      <div className="absolute top-24 -right-48 h-[560px] w-[560px] rounded-full bg-indigo-200/60 blur-3xl" />
      <div className="absolute -bottom-48 left-1/2 h-[560px] w-[560px] -translate-x-1/2 rounded-full bg-emerald-200/60 blur-3xl" />

      <div className="relative">
        <header className="w-full">
          <div className="mx-auto flex max-w-5xl items-center justify-center px-4 py-8">
            <div className="rounded-3xl border border-white/50 bg-white/70 px-6 py-4 shadow-sm backdrop-blur">
              <Image
                src="/brand-logo.png"
                alt="SafeSplash + SwimLabs"
                width={520}
                height={120}
                priority
                className="h-auto w-[260px] sm:w-[360px]"
              />
            </div>
          </div>
        </header>

        <div className="px-4">
          <p className="mx-auto max-w-5xl text-center font-semibold text-slate-900">
            Answer a few quick questions to find the best instructor fit and the best swim level.
          </p>
        </div>

        {/* ------------------------------ LANDING ------------------------------ */}
        {stage === "landing" && (
          <>
            <Progress labels={["Intake", "Match", "Level", "Comments", "Results"]} activeIndex={0} />
            <Container title="Let’s get started" subtitle="This takes about 2 minutes." emoji="🌈">
              <div className="grid gap-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="text-sm font-extrabold text-slate-900">Parent or Client Name</span>
                    <input
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Example: Khaled A."
                      className="h-12 rounded-2xl border border-slate-300 bg-white px-3 text-slate-900 placeholder:text-slate-500 outline-none focus:border-indigo-500"
                    />
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm font-extrabold text-slate-900">Location</span>
                    <select
                      value={location}
                      onChange={(e) => setLocation(e.target.value as LocationName)}
                      className="h-12 rounded-2xl border border-slate-300 bg-white px-3 text-slate-900 outline-none focus:border-indigo-500"
                    >
                      <option value="">Select a location</option>
                      {LOCATIONS.map((l) => (
                        <option key={l} value={l}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="sm:col-span-2">
                    <ContactBanner location={location} contact={contact} variant="landing" />
                  </div>

                  <label className="grid gap-2">
                    <span className="text-sm font-extrabold text-slate-900">Best day for booking</span>
                    <select
                      value={preferredDay}
                      onChange={(e) => setPreferredDay(e.target.value as any)}
                      className="h-12 rounded-2xl border border-slate-300 bg-white px-3 text-slate-900 outline-none focus:border-indigo-500"
                    >
                      <option value="">Select a day</option>
                      {DAYS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm font-extrabold text-slate-900">Best time window</span>
                    <select
                      value={preferredTime}
                      onChange={(e) => setPreferredTime(e.target.value as any)}
                      className="h-12 rounded-2xl border border-slate-300 bg-white px-3 text-slate-900 outline-none focus:border-indigo-500"
                    >
                      <option value="">Select a time window</option>
                      {TIME_WINDOWS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="grid gap-2 sm:col-span-2">
                    <span className="text-sm font-extrabold text-slate-900">Best way to contact you</span>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => setContactMethod("phone")}
                        className={classNames(
                          "h-12 rounded-2xl border px-4 text-sm font-extrabold",
                          contactMethod === "phone"
                            ? "border-indigo-500 bg-indigo-50 text-slate-900"
                            : "border-slate-300 bg-white text-slate-900 hover:border-indigo-500 hover:bg-indigo-50"
                        )}
                      >
                        Phone
                      </button>
                      <button
                        type="button"
                        onClick={() => setContactMethod("email")}
                        className={classNames(
                          "h-12 rounded-2xl border px-4 text-sm font-extrabold",
                          contactMethod === "email"
                            ? "border-indigo-500 bg-indigo-50 text-slate-900"
                            : "border-slate-300 bg-white text-slate-900 hover:border-indigo-500 hover:bg-indigo-50"
                        )}
                      >
                        Email
                      </button>
                    </div>
                  </label>

                  {contactMethod === "phone" && (
                    <label className="grid gap-2 sm:col-span-2">
                      <span className="text-sm font-extrabold text-slate-900">Phone number</span>
                      <input
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="Example: 201-555-0123"
                        className="h-12 rounded-2xl border border-slate-300 bg-white px-3 text-slate-900 placeholder:text-slate-500 outline-none focus:border-indigo-500"
                      />
                    </label>
                  )}

                  {contactMethod === "email" && (
                    <label className="grid gap-2 sm:col-span-2">
                      <span className="text-sm font-extrabold text-slate-900">Email address</span>
                      <input
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="Example: name@email.com"
                        className="h-12 rounded-2xl border border-slate-300 bg-white px-3 text-slate-900 placeholder:text-slate-500 outline-none focus:border-indigo-500"
                      />
                    </label>
                  )}
                </div>

                <PrimaryButton label="Continue" disabled={!landingValid} onClick={() => setStage("match_parent")} />

                <div className="flex justify-end">
                  <SecondaryButton onClick={resetAll} label="Reset" />
                </div>
              </div>
            </Container>
          </>
        )}

        {/* -------------------------- MATCH (PARENT) --------------------------- */}
        {stage === "match_parent" && (
          <>
            <Progress labels={["Intake", "Match", "Level", "Comments", "Results"]} activeIndex={1} />
            <Container title="Quick questions" subtitle="First, a few about your goals and preferences." emoji="🫧">
              <div className="grid gap-6">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="text-sm font-extrabold text-indigo-700">
                    Question {parentStep + 1} of {PARENT_QUESTIONS.length}
                  </div>
                  <div className="mt-2 text-2xl font-extrabold text-slate-900">{PARENT_QUESTIONS[parentStep].title}</div>

                  <div className="mt-6 grid gap-3">
                    {PARENT_QUESTIONS[parentStep].options.map((o) => (
                      <OptionButton
                        key={o.key}
                        onClick={() => answerParent(o.key)}
                        icon={o.key === "A" ? "🚀" : o.key === "B" ? "📋" : o.key === "C" ? "💛" : "💸"}
                        label={o.text}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex justify-between">
                  <SecondaryButton onClick={() => setStage("landing")} label="Back" />
                  <SecondaryButton onClick={resetAll} label="Reset" />
                </div>
              </div>
            </Container>
          </>
        )}

        {/* ------------------------- MATCH (SWIMMER) --------------------------- */}
        {stage === "match_swimmer" && (
          <>
            <Progress labels={["Intake", "Match", "Level", "Comments", "Results"]} activeIndex={1} />
            <Container title="Swimmer learning style" subtitle="Now, a few about how your swimmer learns best in the water." emoji="🐠">
              <div className="grid gap-6">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="text-sm font-extrabold text-indigo-700">
                    Question {swimmerStep + 1} of {SWIMMER_QUESTIONS.length}
                  </div>
                  <div className="mt-2 text-2xl font-extrabold text-slate-900">{SWIMMER_QUESTIONS[swimmerStep].title}</div>

                  <div className="mt-6 grid gap-3">
                    {SWIMMER_QUESTIONS[swimmerStep].options.map((o) => (
                      <OptionButton
                        key={o.key}
                        onClick={() => answerSwimmer(o.key)}
                        icon={o.key === "A" ? "🧩" : o.key === "B" ? "🏁" : o.key === "C" ? "🌴" : "🌟"}
                        label={o.text}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex justify-between">
                  <SecondaryButton
                    onClick={() => {
                      // go back within swimmer questions, otherwise return to parent
                      if (swimmerStep > 0) setSwimmerStep((n) => n - 1);
                      else setStage("match_parent");
                    }}
                    label="Back"
                  />
                  <SecondaryButton onClick={resetAll} label="Reset" />
                </div>
              </div>
            </Container>
          </>
        )}

        {/* ------------------------------ AGE ------------------------------ */}
        {stage === "age" && (
          <>
            <Progress labels={["Intake", "Match", "Level", "Comments", "Results"]} activeIndex={2} />
            <Container title="Swim level finder" subtitle="Step 1: Age" emoji="🎂">
              <div className="text-2xl font-extrabold text-slate-900">What is your swimmer’s birthdate?</div>

              <div className="mt-5">
                <input
                  type="date"
                  value={level.birthday ?? ""}
                  onChange={(e) => setLevel((s) => ({ ...s, birthday: e.target.value }))}
                  className="h-12 rounded-2xl border border-slate-300 bg-white px-3 text-slate-900 outline-none focus:border-indigo-500"
                />
              </div>

              {birthdayGreeting && (
                <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
                  <div className="text-sm font-extrabold text-amber-900">{birthdayGreeting.title}</div>
                  <div className="mt-2 text-slate-900 font-semibold">{birthdayGreeting.body}</div>
                </div>
              )}

              {level.birthday && (() => {
                const dob = new Date(level.birthday + "T00:00:00");
                const now = new Date();
                const months = monthsBetween(dob, now);
                if (months < 24 || months > 36) return null;

                return (
                  <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="text-lg font-extrabold text-slate-900">Will a parent be in the water?</div>
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setLevel((s) => ({ ...s, parentInWater: true }))}
                        className="h-14 rounded-2xl border border-emerald-200 bg-emerald-50 font-extrabold text-slate-900 hover:border-emerald-500"
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => setLevel((s) => ({ ...s, parentInWater: false }))}
                        className="h-14 rounded-2xl border border-emerald-200 bg-emerald-50 font-extrabold text-slate-900 hover:border-emerald-500"
                      >
                        No
                      </button>
                    </div>
                  </div>
                );
              })()}

              <PrimaryButton
                label="Continue"
                disabled={
                  !level.birthday ||
                  (() => {
                    const dob = new Date((level.birthday ?? "") + "T00:00:00");
                    const now = new Date();
                    const months = monthsBetween(dob, now);
                    if (months < 4) return false; // keep enabled so they can click and see the popup
                    if (months >= 24 && months <= 36) return level.parentInWater !== true && level.parentInWater !== false;
                    return false;
                  })()
                }
                onClick={proceedAge}
              />

              <div className="mt-6 flex justify-between gap-3">
                <SecondaryButton onClick={() => setStage("match_swimmer")} label="Back" />
                <SecondaryButton onClick={resetAll} label="Reset" />
              </div>
            </Container>
          </>
        )}

        {/* ------------------------------ SKILLS ------------------------------ */}
        {stage === "skills" && (
          <>
            <Progress labels={["Intake", "Match", "Level", "Comments", "Results"]} activeIndex={2} />
            <Container title="Swim level finder" subtitle="Step 2: Skills" emoji="🏊">
              <div className="text-sm font-extrabold text-indigo-700">
                Skill {skillIndex + 1} of {SKILL_QUESTIONS.length}
              </div>
              <div className="mt-3 text-2xl font-extrabold text-slate-900">{currentSkill.text}</div>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => answerSkill(true)}
                  className="h-14 rounded-2xl border border-emerald-200 bg-emerald-50 font-extrabold text-slate-900 hover:border-emerald-500"
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => answerSkill(false)}
                  className="h-14 rounded-2xl border border-rose-200 bg-rose-50 font-extrabold text-slate-900 hover:border-rose-500"
                >
                  No
                </button>
              </div>

              <div className="mt-8 flex justify-between gap-3">
                <SecondaryButton
                  onClick={() => {
                    if (skillIndex === 0) {
                      setStage("age");
                      return;
                    }
                    setSkillIndex((i) => Math.max(0, i - 1));
                  }}
                  label="Back"
                />
                <SecondaryButton onClick={resetAll} label="Reset" />
              </div>
            </Container>
          </>
        )}

        {/* ------------------------------ ENDURANCE ------------------------------ */}
        {stage === "endurance" && (
          <>
            <Progress labels={["Intake", "Match", "Level", "Comments", "Results"]} activeIndex={2} />
            <Container title="Final level question" subtitle="Almost done." emoji="💪">
              <div className="mt-3 text-2xl font-extrabold text-slate-900">
                Does your swimmer have strong endurance and keep good technique over longer distances?
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => answerEndurance(true)}
                  className="h-14 rounded-2xl border border-emerald-200 bg-emerald-50 font-extrabold text-slate-900 hover:border-emerald-500"
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => answerEndurance(false)}
                  className="h-14 rounded-2xl border border-rose-200 bg-rose-50 font-extrabold text-slate-900 hover:border-rose-500"
                >
                  No
                </button>
              </div>

              <div className="mt-8 flex justify-between gap-3">
                <SecondaryButton onClick={() => setStage("skills")} label="Back" />
                <SecondaryButton onClick={resetAll} label="Reset" />
              </div>
            </Container>
          </>
        )}

        {/* ------------------------------ COMMENTS ------------------------------ */}
        {stage === "comments" && (
          <>
            <Progress labels={["Intake", "Match", "Level", "Comments", "Results"]} activeIndex={3} />
            <Container title="Anything we should know?" subtitle="Optional, but super helpful." emoji="📝">
              <div className="grid gap-4">
                <div className="text-slate-900 font-semibold">
                  Goals, concerns, sensitivities, or anything that helps us set your swimmer up for success.
                </div>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Example: nervous with back floats, loves routine, goal is water safety before summer, etc."
                  className="min-h-[140px] w-full rounded-2xl border border-slate-300 bg-white p-3 text-slate-900 placeholder:text-slate-500 outline-none focus:border-indigo-500"
                />

                <PrimaryButton label="See results" onClick={() => setStage("results")} />

                <div className="mt-2 flex justify-between gap-3">
                  <SecondaryButton
                    onClick={() => {
                      if (!level.birthday) setStage("age");
                      else {
                        const dob = new Date(level.birthday + "T00:00:00");
                        const now = new Date();
                        const years = yearsBetween(dob, now);
                        if (years >= 16) setStage("age");
                        else if (skillIndex >= SKILL_QUESTIONS.length - 1) setStage("endurance");
                        else setStage("skills");
                      }
                    }}
                    label="Back"
                  />
                  <SecondaryButton onClick={resetAll} label="Reset" />
                </div>
              </div>
            </Container>
          </>
        )}

        {/* ------------------------------ RESULTS ------------------------------ */}
        {stage === "results" && (
          <>
            <Progress labels={["Intake", "Match", "Level", "Comments", "Results"]} activeIndex={4} />

            <div className="mx-auto max-w-5xl px-4 pb-14">
              <div className="text-center">
                <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Your results</h1>
                <p className="mt-3 text-lg font-semibold text-slate-800">
                  Save this as an image, then send it to us. We will help you pick the best class time.
                </p>
              </div>

              <ContactBanner location={location} contact={contact} variant="results" />

              <div ref={resultsRef} className="mt-6 rounded-3xl border border-white/50 bg-white p-8 shadow-xl">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-extrabold text-slate-900">Intake</div>
                    <div className="mt-2 grid gap-1 text-slate-900">
                      <div><span className="font-bold">Name:</span> {clientName || "N/A"}</div>
                      <div><span className="font-bold">Location:</span> {location || "N/A"}</div>
                      <div><span className="font-bold">Best day:</span> {preferredDay || "N/A"}</div>
                      <div><span className="font-bold">Best time:</span> {preferredTime || "N/A"}</div>
                      <div><span className="font-bold">Contact:</span> {contactMethod === "email" ? (contactEmail || "N/A") : (contactPhone || "N/A")}</div>
                    </div>
                  </div>

                  <div className="hidden sm:block">
                    <img src="/brand-logo.png" alt="SafeSplash + SwimLabs" className="h-auto w-[240px]" />
                  </div>
                </div>

                <div className="mt-6 grid gap-6 md:grid-cols-2">
                  {/* Level */}
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                    <div className="text-sm font-extrabold text-indigo-700">Swim level finder</div>
                    <div className="mt-2 text-2xl font-extrabold text-slate-900">
                      {levelPick.levelKey ? LEVELS[levelPick.levelKey].title : "Not enough info"}
                    </div>

                    {levelPick.levelKey && (
                      <div className="mt-2 text-slate-900">
                        <span className="font-bold">Ratio:</span> {LEVELS[levelPick.levelKey].ratio}
                      </div>
                    )}

                    {levelPick.reason && (
                      <div className="mt-4 rounded-2xl border border-indigo-200 bg-white p-4 text-slate-900">
                        <div className="text-sm font-extrabold text-slate-900">Why this level</div>
                        <div className="mt-1 font-medium">{levelPick.reason}</div>
                      </div>
                    )}

                    {levelPick.levelKey && (
                      <div className="mt-4 text-slate-900 font-medium">{LEVELS[levelPick.levelKey].description}</div>
                    )}
                  </div>

                  {/* Instructor match (customer-facing) */}
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                    <div className="text-sm font-extrabold text-indigo-700">Best instructor match</div>

                    {primaryInstructor ? (
                      <>
                        <div className="mt-2 text-2xl font-extrabold text-slate-900">{primaryInstructor.name}</div>
                        <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-sm font-extrabold text-emerald-900">
                          🌟 {primaryInstructor.headline}
                        </div>
                        <div className="mt-3 text-slate-900 font-medium">{primaryInstructor.summary}</div>

                        <div className="mt-4">
                          <div className="text-sm font-extrabold text-slate-900">What you can expect</div>
                          <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-900 font-medium">
                            {primaryInstructor.bullets.map((b) => (
                              <li key={b}>{b}</li>
                            ))}
                          </ul>
                        </div>

                        {secondaryInstructor && (
                          <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 text-slate-900">
                            <div className="text-sm font-extrabold text-slate-900">Also a great fit</div>
                            <div className="mt-1 text-lg font-extrabold">{secondaryInstructor.name}</div>
                            <div className="mt-2 text-sm font-medium">{secondaryInstructor.summary}</div>
                          </div>
                        )}

                        {/* Staff-only internal code (hidden unless ?staff=1) */}
                        {staffMode && (
                          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-slate-900">
                            <div className="text-sm font-extrabold">Staff only</div>
                            <div className="mt-1 font-extrabold">Customer Code: {internalCustomerCode ?? "N/A"}</div>
                            <div className="mt-2 text-sm font-medium text-slate-700">
                              This code is for back office use. Do not share it with customers.
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="mt-2 text-slate-900">Match not completed.</div>
                    )}
                  </div>
                </div>

                {comments.trim() && (
                  <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
                    <div className="text-sm font-extrabold text-slate-900">Comments / concerns</div>
                    <div className="mt-2 whitespace-pre-wrap text-slate-900 font-medium">{comments.trim()}</div>
                  </div>
                )}

                {portalUrl && (
                  <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
                    <div className="text-sm font-extrabold text-slate-900">Enroll or view classes</div>
                    <div className="mt-2 text-slate-900 break-all font-medium">{portalUrl}</div>
                  </div>
                )}

                {contact && (
                  <div className="mt-6 rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
                    <div className="text-sm font-extrabold text-slate-900">Send this to the location team</div>
                    <div className="mt-2 text-slate-900 font-medium">
                      <div><span className="font-bold">Phone:</span> {contact.phone}</div>
                      <div><span className="font-bold">Email:</span> {contact.email}</div>
                    </div>
                    <div className="mt-3 text-sm font-semibold text-slate-900">
                      Tip: Save as PNG, then text the image to us. We will help you pick the best class.
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={saveAsPng}
                  disabled={exporting}
                  className={classNames(
                    "h-12 rounded-2xl font-extrabold shadow-lg",
                    exporting ? "bg-indigo-300 text-white cursor-not-allowed" : "bg-indigo-600 text-white hover:bg-indigo-700"
                  )}
                >
                  {exporting ? "Saving..." : "Save as image (PNG)"}
                </button>

                <button
                  type="button"
                  onClick={copySummary}
                  className="h-12 rounded-2xl border border-slate-300 bg-white font-extrabold text-slate-900 hover:border-indigo-500 hover:bg-indigo-50"
                >
                  Copy summary
                </button>
              </div>

              {portalUrl && (
                <div className="mt-3">
                  <a
                    href={portalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-emerald-600 px-4 font-extrabold text-white hover:bg-emerald-700"
                  >
                    Open enrollment link
                  </a>
                </div>
              )}

              <div className="mt-8 flex flex-wrap gap-3">
                <SecondaryButton onClick={() => setStage("comments")} label="Edit comments" />
                <SecondaryButton
                  onClick={() => {
                    setStage("age");
                    setLevel({});
                    setSkillIndex(0);
                  }}
                  label="Redo level finder"
                />
                <SecondaryButton
                  onClick={() => {
                    setStage("match_parent");
                    setParentStep(0);
                    setSwimmerStep(0);
                    setMatch({});
                  }}
                  label="Redo match"
                />
                <SecondaryButton onClick={resetAll} label="Start over" />
              </div>
            </div>
          </>
        )}

        {toast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-2xl border border-white/50 bg-white/80 px-4 py-2 text-sm font-extrabold text-slate-900 shadow-xl backdrop-blur">
            {toast}
          </div>
        )}

        <Modal
          open={tooYoungOpen}
          title="A little too young (for now)"
          body={
            "We are so glad you found us.\n\nOur lessons start at 4 months.\n\nText us anytime and we will help you line up the perfect start date."
          }
          onClose={() => setTooYoungOpen(false)}
        />
      </div>
    </main>
  );
}
