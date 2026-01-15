"use client";

import React, { useMemo, useRef, useState } from "react";
import Image from "next/image";
import { toPng } from "html-to-image";

/* ----------------------------- Instructor Match ---------------------------- */

type ParentType = "supersonic" | "high_maintenance" | "extra_attention" | "budget";
type AnswerKey = "A" | "B" | "C" | "D";

type MatchState = { q1?: AnswerKey; q2?: AnswerKey; q3?: AnswerKey; q4?: AnswerKey };

const MATCH_MAP: Record<AnswerKey, ParentType> = {
  A: "supersonic",
  B: "high_maintenance",
  C: "extra_attention",
  D: "budget",
};

const MATCH_DISPLAY: Record<
  ParentType,
  { name: string; internal: string; summary: string; bullets: string[] }
> = {
  supersonic: {
    name: "Goal Focused",
    internal: "SuperSonic Sally / Sam",
    summary:
      "You value progress, efficiency, and a clear path to water-safety. You’ll do best with an instructor who sets milestones and keeps lessons moving.",
    bullets: ["Clear goals and fast feedback", "Milestones and progress markers", "Outcome-focused communication"],
  },
  high_maintenance: {
    name: "Structure Focused",
    internal: "High Maintenance Hillary / Henry",
    summary:
      "You value structure, consistency, and detailed explanations. You’ll do best with an instructor who follows a clear plan and explains the why.",
    bullets: ["Structured lesson flow", "Detailed answers to questions", "Clear progression explanations"],
  },
  extra_attention: {
    name: "Connection Focused",
    internal: "Extra Attention Ellie / Edward",
    summary:
      "You value reassurance and personal connection. You’ll do best with an instructor who is warm, patient, and adaptable.",
    bullets: ["Strong rapport and reassurance", "Flexible, child-centered approach", "Supportive communication"],
  },
  budget: {
    name: "Value Focused",
    internal: "Budget Betty / Bill",
    summary:
      "You value efficiency and options. You’ll do best with a consistent instructor and a team that helps you maximize value.",
    bullets: ["Clear options and logistics", "Scheduling efficiency", "Transparent policies"],
  },
};

const MATCH_QUESTIONS = [
  {
    id: "q1",
    title: "What matters MOST to you when it comes to swim lessons?",
    options: [
      { key: "A", text: "How quickly my child can become water-safe and independent" },
      { key: "B", text: "Instructor experience, curriculum, and lesson structure" },
      { key: "C", text: "Having an instructor who understands my child personally" },
      { key: "D", text: "Pricing, value, and available discounts or promotions" },
    ] as { key: AnswerKey; text: string }[],
  },
  {
    id: "q2",
    title: "How would you describe your communication style with staff?",
    options: [
      { key: "A", text: "Quick and direct, I’m juggling a lot" },
      { key: "B", text: "I like to ask detailed questions and stay informed" },
      { key: "C", text: "I tend to share a lot about my child and their experiences" },
      { key: "D", text: "Straightforward and focused on logistics" },
    ] as { key: AnswerKey; text: string }[],
  },
  {
    id: "q3",
    title: "Which best describes your family situation?",
    options: [
      { key: "A", text: "Multiple kids and activities, busy schedule" },
      { key: "B", text: "First-time parent or very hands-on parent" },
      { key: "C", text: "Child needs extra reassurance, accommodations, or attention" },
      { key: "D", text: "Fixed or limited budget, cost-conscious planning" },
    ] as { key: AnswerKey; text: string }[],
  },
  {
    id: "q4",
    title: "If you had a concern about lessons, what would you most likely ask?",
    options: [
      { key: "A", text: "How long until we see progress?" },
      { key: "B", text: "Can I speak with a manager or learn more about the instructor/curriculum?" },
      { key: "C", text: "Can we talk through what I’m noticing with my child?" },
      { key: "D", text: "Are there alternative pricing options?" },
    ] as { key: AnswerKey; text: string }[],
  },
] as const;

function computeMatchScores(state: MatchState) {
  const scores: Record<ParentType, number> = {
    supersonic: 0,
    high_maintenance: 0,
    extra_attention: 0,
    budget: 0,
  };

  const w = { q1: 40, q2: 30, q3: 20, q4: 10 };

  if (state.q1) scores[MATCH_MAP[state.q1]] += w.q1;
  if (state.q2) scores[MATCH_MAP[state.q2]] += w.q2;
  if (state.q3) scores[MATCH_MAP[state.q3]] += w.q3;
  if (state.q4) scores[MATCH_MAP[state.q4]] += w.q4;

  return scores;
}

function pickMatch(state: MatchState) {
  const scores = computeMatchScores(state);
  const answers = [state.q1, state.q2, state.q3, state.q4];
  if (answers.some((a) => !a)) return { winner: undefined as ParentType | undefined, scores };

  const sorted = (Object.entries(scores) as [ParentType, number][]).sort((a, b) => b[1] - a[1]);
  return { winner: sorted[0][0], scores };
}

/* -------------------------------- Level Finder ---------------------------- */

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
    title: "PARENTTOT – Intro to Water (4 mo. – 36 mo.)",
    ratio: "6:1 Ratio",
    description:
      "Parent and child build comfort and foundational skills together, with a path to independent lessons when ready.",
  },
  TODDLER_TRANSITION: {
    title: "TODDLER TRANSITION – Water Comfort & Water Safety Basics (24 mo. – 36 mo.)",
    ratio: "3:1 Ratio",
    description:
      "Swimmers learn fundamental safety and comfort skills in a parent-free group format, with repetition and encouragement.",
  },
  BEGINNER_1: {
    title: "BEGINNER 1 – Introduction to Water Safety and Swimming Foundations",
    ratio: "4:1 Ratio",
    description: "Fun-focused fundamentals: body position and kicking to build a strong swimming foundation.",
  },
  BEGINNER_2: {
    title: "BEGINNER 2 – Water Safety and Swimming Foundations",
    ratio: "4:1 Ratio",
    description: "SSP journey begins: essential water safety and confidence in self-rescue and independent swimming.",
  },
  BEGINNER_3: {
    title: "BEGINNER 3 – Water Safety and Basic Strokes",
    ratio: "4:1 Ratio",
    description: "Refines safety skills and begins combining them with basic strokes and propulsion skills.",
  },
  BEGINNER_4: {
    title: "BEGINNER 4 – Water Safety and Stroke Development",
    ratio: "4:1 Ratio",
    description: "Swimmers are ready to pass SSP Test and develop freestyle side breathing and backstroke further.",
  },
  INTERMEDIATE_1: {
    title: "INTERMEDIATE 1 – Freestyle, Backstroke, Intro to Breaststroke",
    ratio: "4:1 Ratio",
    description: "Endurance and technique work with intro to breaststroke kick, plus ongoing safety skill reinforcement.",
  },
  INTERMEDIATE_2: {
    title: "INTERMEDIATE 2 – Breaststroke + Intro to Butterfly",
    ratio: "4:1 Ratio",
    description: "Refines breaststroke and introduces butterfly through dolphin kick progressions, plus self-rescue stamina.",
  },
  INTERMEDIATE_3: {
    title: "INTERMEDIATE 3 – All Four Strokes Technique",
    ratio: "4:1 Ratio",
    description: "Refines all four strokes with drills, technique, strength, and endurance development.",
  },
  ADVANCED_1: {
    title: "ADVANCED 1 – Technique Refinement & Proficiency",
    ratio: "4:1 Ratio",
    description: "Builds stamina across four strokes while refining technique for efficiency and longer distances.",
  },
  ADVANCED_2: {
    title: "ADVANCED 2 – Endurance & Advanced Techniques",
    ratio: "4:1 Ratio",
    description: "Final level. Advanced refinement and efficient technique while swimming challenging distances.",
  },
  ADULT_1: {
    title: "ADULT 1 – Learn-to-Swim",
    ratio: "4:1 Ratio",
    description: "Adults (16+) with no experience or fear of water learn basic safety skills and progress to freestyle.",
  },
  ADULT_2: {
    title: "ADULT 2 – Learn-to-Swim",
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
  { key: "s1_bubbles5", text: "Can your swimmer submerge their face underwater, while blowing bubbles, for 5 seconds without hesitation?" },
  { key: "s2_backFloatSupport", text: "Can your swimmer lie on their back with ears in the water and kick with support?" },
  { key: "s3_floatFrontBackInd", text: "Can your swimmer float on front and back independently?" },
  { key: "s4_kickFrontWithDeviceEyesIn", text: "Can they kick on their front with eyes in the water while holding a flotation device?" },
  { key: "s5_kickFrontBackInd", text: "Can your swimmer kick easily on their front and back independently?" },
  { key: "s6_sixArmStrokesFreeBack", text: "Can your swimmer perform 6 arm strokes of freestyle and backstroke independently?" },
  { key: "s7_freestyleSideBreath12", text: "Can your swimmer easily breathe to the side in freestyle for 12 arm strokes?" },
  { key: "s8_backstroke12", text: "Can your swimmer do backstroke for 12 arm strokes?" },
  { key: "s9_freeSideBreathAndBack25yd", text: "Can your swimmer swim freestyle with side breathing and backstroke for 25 yards (75ft)?" },
  { key: "s10_breastKickPro", text: "Can your swimmer kick breaststroke proficiently?" },
  { key: "s11_breastAndDolphinPro", text: "Is your swimmer proficient at breaststroke and the dolphin kick?" },
  { key: "s12_flipAndOpenTurnsIntro", text: "Has your swimmer been introduced to flip turns and open turns as means of changing directions in a pool?" },
  { key: "s13_allStrokesAndTurnsPro", text: "Is your swimmer proficient at all four competitive strokes, flip turns and open turns?" },
];

function monthsBetween(dob: Date, now: Date) {
  let months = (now.getFullYear() - dob.getFullYear()) * 12 + (now.getMonth() - dob.getMonth());
  if (now.getDate() < dob.getDate()) months -= 1;
  return months;
}

function yearsBetween(dob: Date, now: Date) {
  let years = now.getFullYear() - dob.getFullYear();
  const hadBirthday =
    now.getMonth() > dob.getMonth() || (now.getMonth() === dob.getMonth() && now.getDate() >= dob.getDate());
  if (!hadBirthday) years -= 1;
  return years;
}

function computeLevel(state: LevelState): { levelKey?: LevelKey; reason?: string } {
  if (!state.birthday) return {};

  const dob = new Date(state.birthday + "T00:00:00");
  const now = new Date();
  const months = monthsBetween(dob, now);
  const years = yearsBetween(dob, now);

  // Ages 4 to 36 months
  if (months >= 4 && months <= 36) {
    // Under 24 months (under 2 years): always ParentTot, no qualifying question
    if (months < 24) {
      return { levelKey: "PARENTTOT", reason: "Under 2 years old. ParentTot is the best fit." };
    }

    // 24 to 36 months: ask whether parent is in water
    if (state.parentInWater === true) return { levelKey: "PARENTTOT", reason: "Toddler age with parent in the water." };
    if (state.parentInWater === false) return { levelKey: "TODDLER_TRANSITION", reason: "Toddler age in independent group format." };
    return {};
  }

  // Adults (16+) can qualify into Adult 2
  if (years >= 16) {
    const advanced = state.s7_freestyleSideBreath12 === true || state.s8_backstroke12 === true;
    return { levelKey: advanced ? "ADULT_2" : "ADULT_1", reason: "Swimmer is 16+." };
  }

  const no = (k: keyof LevelState) => state[k] === false;

  if (no("s1_bubbles5")) return { levelKey: "BEGINNER_1", reason: "Face-in-water comfort is still developing." };
  if (no("s2_backFloatSupport")) return { levelKey: "BEGINNER_1", reason: "Back float comfort is still developing." };
  if (no("s3_floatFrontBackInd")) return { levelKey: "BEGINNER_1", reason: "Independent floating is still developing." };

  if (no("s4_kickFrontWithDeviceEyesIn")) return { levelKey: "BEGINNER_2", reason: "Front kicking with eyes in the water is still developing." };
  if (no("s5_kickFrontBackInd")) return { levelKey: "BEGINNER_2", reason: "Independent kicking is still developing." };

  if (no("s6_sixArmStrokesFreeBack")) return { levelKey: "BEGINNER_3", reason: "Arm stroke coordination is still developing." };
  if (no("s7_freestyleSideBreath12")) return { levelKey: "BEGINNER_3", reason: "Side breathing endurance is still developing." };

  if (no("s8_backstroke12")) return { levelKey: "BEGINNER_4", reason: "Backstroke consistency is still developing." };
  if (no("s9_freeSideBreathAndBack25yd")) return { levelKey: "BEGINNER_4", reason: "25y endurance for freestyle with side breathing + backstroke is still developing." };

  if (no("s10_breastKickPro")) return { levelKey: "INTERMEDIATE_1", reason: "Breaststroke kick is next." };
  if (no("s11_breastAndDolphinPro")) return { levelKey: "INTERMEDIATE_2", reason: "Dolphin kick proficiency is still developing." };
  if (no("s12_flipAndOpenTurnsIntro")) return { levelKey: "INTERMEDIATE_3", reason: "Turns are still developing." };
  if (no("s13_allStrokesAndTurnsPro")) return { levelKey: "INTERMEDIATE_3", reason: "All four strokes and turns are still developing." };

  if (state.enduranceStrong === true) return { levelKey: "ADVANCED_2", reason: "Strong proficiency plus strong endurance." };
  if (state.enduranceStrong === false) return { levelKey: "ADVANCED_1", reason: "Strong proficiency. Endurance and efficiency next." };

  return {};
}

/* ---------------------------------- UI ----------------------------------- */

type Stage = "landing" | "match" | "age" | "skills" | "endurance" | "comments" | "results";
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

// Replace any SafeSplash ones if you want different numbers/emails.
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
  "Morning (9am–12pm, Weekends Only)",
  "Early Afternoon (12pm–4pm, All Days)",
  "Afternoon (4pm–6pm, Weekdays Only)",
  "Evening (6pm–8pm, Weekdays Only)",
  "Flexible",
] as const;

function Progress({ labels, activeIndex }: { labels: string[]; activeIndex: number }) {
  return (
    <div className="mx-auto mt-8 max-w-3xl px-4">
      <div className="flex items-center justify-between gap-4">
        {labels.map((label, i) => {
          const done = i < activeIndex;
          const active = i === activeIndex;

          return (
            <div key={label} className="flex flex-1 items-center">
              <div className="flex flex-col items-center">
                <div
                  className={[
                    "h-10 w-10 rounded-full border-2 flex items-center justify-center text-sm font-bold",
                    done ? "bg-teal-700 border-teal-700 text-white" : "",
                    active && !done ? "border-teal-700 text-teal-900 bg-white" : "",
                    !active && !done ? "border-slate-300 text-slate-500 bg-white" : "",
                  ].join(" ")}
                >
                  {done ? "✓" : "•"}
                </div>
                <div className={["mt-2 text-xs font-semibold", active || done ? "text-slate-900" : "text-slate-600"].join(" ")}>
                  {label}
                </div>
              </div>

              {i !== labels.length - 1 && (
                <div className="mx-4 h-[2px] flex-1 bg-slate-200">
                  <div className="h-[2px] bg-teal-700" style={{ width: done ? "100%" : "0%" }} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Container({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-5xl px-4 pb-14">
      <div className="text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">{title}</h1>
        <p className="mt-3 text-lg font-medium text-slate-800">{subtitle}</p>
      </div>

      <div className="mt-8 rounded-2xl border border-white/40 bg-white/95 p-8 sm:p-10 shadow-lg backdrop-blur">
        {children}
      </div>
    </div>
  );
}

function YesNo({ onYes, onNo }: { onYes: () => void; onNo: () => void }) {
  return (
    <div className="mt-6 grid grid-cols-2 gap-4">
      <button
        type="button"
        onClick={onYes}
        className="h-14 rounded-xl border border-teal-200 bg-white px-4 text-base font-semibold text-slate-900 hover:border-teal-600 hover:bg-teal-50"
      >
        Yes
      </button>
      <button
        type="button"
        onClick={onNo}
        className="h-14 rounded-xl border border-teal-200 bg-white px-4 text-base font-semibold text-slate-900 hover:border-teal-600 hover:bg-teal-50"
      >
        No
      </button>
    </div>
  );
}

function PrimaryButton({ onClick, disabled, label }: { onClick: () => void; disabled?: boolean; label: string }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={[
        "mt-6 h-14 w-full rounded-xl text-base font-semibold text-white shadow-sm",
        disabled ? "bg-teal-300 cursor-not-allowed" : "bg-teal-700 hover:bg-teal-800",
      ].join(" ")}
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
      className="h-12 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-900 hover:border-teal-600 hover:bg-teal-50"
    >
      {label}
    </button>
  );
}

function OptionButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-4 text-left text-slate-900 hover:border-teal-600 hover:bg-teal-50"
    >
      {children}
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
      ? "Free trial available. Call or text us today."
      : "Great job. Let’s get you in for a free, no-obligation trial and put those skills to the test.";

  return (
    <div className="mt-6 rounded-2xl border border-teal-200 bg-teal-50 p-5">
      <div className="text-sm font-semibold text-teal-900">{contact.brand}</div>
      <div className="mt-1 text-lg font-extrabold text-slate-900">{headline}</div>
      <div className="mt-3 text-slate-900">
        <div>
          <span className="font-semibold">Location:</span> {location}
        </div>
        <div className="mt-1">
          <span className="font-semibold">Phone:</span> {contact.phone}
        </div>
        <div className="mt-1">
          <span className="font-semibold">Email:</span> {contact.email}
        </div>
        <div className="mt-3 text-sm font-medium text-slate-800">
          Tip: Send us your availability and we’ll match you to the best class.
        </div>
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

/* ---------------------------------- Page ---------------------------------- */

export default function Page() {
  const [stage, setStage] = useState<Stage>("landing");

  // Landing intake
  const [clientName, setClientName] = useState("");
  const [location, setLocation] = useState<LocationName | "">("");
  const [preferredDay, setPreferredDay] = useState<(typeof DAYS)[number] | "">("");
  const [preferredTime, setPreferredTime] = useState<(typeof TIME_WINDOWS)[number] | "">("");

  const [contactMethod, setContactMethod] = useState<ContactMethod>("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  // Match
  const [matchStep, setMatchStep] = useState(0);
  const [match, setMatch] = useState<MatchState>({});

  // Level
  const [level, setLevel] = useState<LevelState>({});
  const [skillIndex, setSkillIndex] = useState(0);

  // Comments
  const [comments, setComments] = useState("");

  // UI helpers
  const [toast, setToast] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const resultsRef = useRef<HTMLDivElement | null>(null);

  const matchPick = useMemo(() => pickMatch(match), [match]);
  const matchResult = matchPick.winner ? MATCH_DISPLAY[matchPick.winner] : null;
  const levelPick = useMemo(() => computeLevel(level), [level]);

  const currentMatchQ = MATCH_QUESTIONS[matchStep];
  const currentSkill = SKILL_QUESTIONS[skillIndex];

  const portalUrl = location ? LOCATION_PORTAL[location] : "";
  const contact = location ? LOCATION_CONTACT[location] : null;

  const resetAll = () => {
    setStage("landing");

    setClientName("");
    setLocation("");
    setPreferredDay("");
    setPreferredTime("");

    setContactMethod("");
    setContactEmail("");
    setContactPhone("");

    setMatchStep(0);
    setMatch({});

    setLevel({});
    setSkillIndex(0);

    setComments("");
    setToast(null);
  };

  const landingValid =
    clientName.trim().length > 0 &&
    location !== "" &&
    preferredDay !== "" &&
    preferredTime !== "" &&
    contactMethod !== "" &&
    (contactMethod === "email" ? contactEmail.trim().length > 3 : contactPhone.trim().length > 6);

  const answerMatch = (answer: AnswerKey) => {
    const id = currentMatchQ.id as keyof MatchState;
    setMatch((s) => ({ ...s, [id]: answer }));

    if (matchStep < MATCH_QUESTIONS.length - 1) {
      setMatchStep((n) => n + 1);
      return;
    }
    setStage("age");
  };

  const proceedAge = () => {
    if (!level.birthday) return;

    const dob = new Date(level.birthday + "T00:00:00");
    const now = new Date();
    const months = monthsBetween(dob, now);
    const years = yearsBetween(dob, now);

    // Under 2 (4–23 months): ParentTot auto, go to comments
    if (months >= 4 && months < 24) {
      setStage("comments");
      return;
    }

    // 24–36 months: only then require parentInWater
    if (months >= 24 && months <= 36) {
      if (level.parentInWater !== true && level.parentInWater !== false) return;
      setStage("comments");
      return;
    }

    // Adults: they can qualify on this page via the optional questions, then go to comments
    if (years >= 16) {
      setStage("comments");
      return;
    }

    setStage("skills");
  };

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
    lines.push(`Contact: ${contactMethod === "email" ? (contactEmail || "N/A") : (contactPhone || "N/A")}`);
    lines.push("");

    lines.push("Instructor Match");
    lines.push("------------------------------");
    if (matchPick.winner) {
      const m = MATCH_DISPLAY[matchPick.winner];
      lines.push(`Type: ${m.name}`);
      lines.push(`Internal: ${m.internal}`);
      lines.push(
        `Scores: Goal ${matchPick.scores.supersonic} | Structure ${matchPick.scores.high_maintenance} | Connection ${matchPick.scores.extra_attention} | Value ${matchPick.scores.budget}`
      );
    } else {
      lines.push("Not completed");
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
    setToast(ok ? "Copied summary." : "Copy failed. Try Save PNG, or select and copy manually.");
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
      {/* Light-mode prioritized background */}
      <div className="absolute inset-0 bg-gradient-to-b from-cyan-50 via-sky-100 to-teal-100" />
      <div className="absolute -top-40 -left-40 h-[420px] w-[420px] rounded-full bg-cyan-200/50 blur-3xl" />
      <div className="absolute top-20 -right-48 h-[520px] w-[520px] rounded-full bg-teal-200/40 blur-3xl" />
      <div className="absolute -bottom-48 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-sky-200/40 blur-3xl" />

      <div className="relative">
        <header className="w-full">
          <div className="mx-auto flex max-w-5xl items-center justify-center px-4 py-8">
            <Image
              src="/brand-logo.png"
              alt="SafeSplash + SwimLabs"
              width={520}
              height={120}
              priority
              className="h-auto w-[260px] sm:w-[360px] drop-shadow-sm"
            />
          </div>
        </header>

        <div className="px-4">
          <p className="mx-auto max-w-5xl text-center font-medium text-slate-900">
            Answer a few questions to find the best instructor fit and the best swim class level.
          </p>
        </div>

        {/* ------------------------------ LANDING ------------------------------ */}
        {stage === "landing" && (
          <>
            <Progress labels={["Intake", "Match", "Level", "Comments", "Results"]} activeIndex={0} />
            <Container title="Get Started" subtitle="Tell us a few quick details first.">
              <div className="grid gap-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-slate-900">Parent / Client Name</span>
                    <input
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Example: Khaled A."
                      className="h-12 rounded-xl border border-slate-300 bg-white px-3 text-slate-900 placeholder:text-slate-500 outline-none focus:border-teal-700"
                    />
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-slate-900">Location</span>
                    <select
                      value={location}
                      onChange={(e) => setLocation(e.target.value as LocationName)}
                      className="h-12 rounded-xl border border-slate-300 bg-white px-3 text-slate-900 outline-none focus:border-teal-700"
                    >
                      <option value="">Select a location</option>
                      {LOCATIONS.map((l) => (
                        <option key={l} value={l}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </label>

                  {/* Contact banner appears as soon as a location is selected */}
                  <div className="sm:col-span-2">
                    <ContactBanner location={location} contact={contact} variant="landing" />
                  </div>

                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-slate-900">Best day for booking</span>
                    <select
                      value={preferredDay}
                      onChange={(e) => setPreferredDay(e.target.value as any)}
                      className="h-12 rounded-xl border border-slate-300 bg-white px-3 text-slate-900 outline-none focus:border-teal-700"
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
                    <span className="text-sm font-semibold text-slate-900">Best time window</span>
                    <select
                      value={preferredTime}
                      onChange={(e) => setPreferredTime(e.target.value as any)}
                      className="h-12 rounded-xl border border-slate-300 bg-white px-3 text-slate-900 outline-none focus:border-teal-700"
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
                    <span className="text-sm font-semibold text-slate-900">Best way to contact you</span>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => setContactMethod("phone")}
                        className={[
                          "h-12 rounded-xl border px-4 text-sm font-semibold",
                          contactMethod === "phone"
                            ? "border-teal-700 bg-teal-50 text-slate-900"
                            : "border-slate-300 bg-white text-slate-900 hover:border-teal-700 hover:bg-teal-50",
                        ].join(" ")}
                      >
                        Phone
                      </button>
                      <button
                        type="button"
                        onClick={() => setContactMethod("email")}
                        className={[
                          "h-12 rounded-xl border px-4 text-sm font-semibold",
                          contactMethod === "email"
                            ? "border-teal-700 bg-teal-50 text-slate-900"
                            : "border-slate-300 bg-white text-slate-900 hover:border-teal-700 hover:bg-teal-50",
                        ].join(" ")}
                      >
                        Email
                      </button>
                    </div>
                  </label>

                  {contactMethod === "phone" && (
                    <label className="grid gap-2 sm:col-span-2">
                      <span className="text-sm font-semibold text-slate-900">Phone number</span>
                      <input
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="Example: 201-555-0123"
                        className="h-12 rounded-xl border border-slate-300 bg-white px-3 text-slate-900 placeholder:text-slate-500 outline-none focus:border-teal-700"
                      />
                    </label>
                  )}

                  {contactMethod === "email" && (
                    <label className="grid gap-2 sm:col-span-2">
                      <span className="text-sm font-semibold text-slate-900">Email address</span>
                      <input
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="Example: name@email.com"
                        className="h-12 rounded-xl border border-slate-300 bg-white px-3 text-slate-900 placeholder:text-slate-500 outline-none focus:border-teal-700"
                      />
                    </label>
                  )}
                </div>

                <PrimaryButton label="Continue" disabled={!landingValid} onClick={() => setStage("match")} />

                <div className="flex justify-end">
                  <SecondaryButton onClick={resetAll} label="Reset" />
                </div>
              </div>
            </Container>
          </>
        )}

        {/* ------------------------------ MATCH ------------------------------ */}
        {stage === "match" && (
          <>
            <Progress labels={["Intake", "Match", "Level", "Comments", "Results"]} activeIndex={1} />
            <Container title="Instructor Match" subtitle="Answer 4 quick questions. One at a time.">
              <div className="grid gap-6">
                <div>
                  <div className="text-sm font-semibold text-teal-900">
                    Question {matchStep + 1} of {MATCH_QUESTIONS.length}
                  </div>
                  <div className="mt-2 text-2xl font-extrabold text-slate-900">{currentMatchQ.title}</div>

                  <div className="mt-6 grid gap-4">
                    {currentMatchQ.options.map((o) => (
                      <OptionButton key={o.key} onClick={() => answerMatch(o.key)}>
                        <div className="flex gap-3">
                          <div className="mt-[2px] inline-flex h-7 w-7 items-center justify-center rounded-full bg-teal-50 text-sm font-bold text-teal-900">
                            {o.key}
                          </div>
                          <div className="text-base font-semibold text-slate-900">{o.text}</div>
                        </div>
                      </OptionButton>
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

        {/* ------------------------------ AGE ------------------------------ */}
        {stage === "age" && (
          <>
            <Progress labels={["Intake", "Match", "Level", "Comments", "Results"]} activeIndex={2} />
            <Container title="Swim Level Finder" subtitle="Step 1: Age">
              <div className="text-2xl font-extrabold text-slate-900">What is your swimmer&apos;s birthdate?</div>

              <div className="mt-5">
                <input
                  type="date"
                  value={level.birthday ?? ""}
                  onChange={(e) => setLevel((s) => ({ ...s, birthday: e.target.value }))}
                  className="h-12 rounded-xl border border-slate-300 bg-white px-3 text-slate-900 outline-none focus:border-teal-700"
                />
              </div>

              {/* Parent-in-water only for 24–36 months */}
              {level.birthday && (() => {
                const dob = new Date(level.birthday + "T00:00:00");
                const now = new Date();
                const months = monthsBetween(dob, now);

                if (months < 24 || months > 36) return null;

                return (
                  <div className="mt-8 rounded-xl border border-slate-300 bg-white p-5">
                    <div className="text-lg font-extrabold text-slate-900">Will a parent be in the water?</div>
                    <YesNo
                      onYes={() => setLevel((s) => ({ ...s, parentInWater: true }))}
                      onNo={() => setLevel((s) => ({ ...s, parentInWater: false }))}
                    />
                  </div>
                );
              })()}

              {/* Adult qualifiers (optional) */}
              {level.birthday && (() => {
                const dob = new Date(level.birthday + "T00:00:00");
                const now = new Date();
                const years = yearsBetween(dob, now);
                if (years < 16) return null;

                return (
                  <div className="mt-8 grid gap-4">
                    <div className="rounded-xl border border-slate-300 bg-white p-5">
                      <div className="text-lg font-extrabold text-slate-900">Adult placement (optional but helpful)</div>
                      <div className="mt-2 text-slate-900">
                        Answer these so we can place you in Adult 1 or Adult 2.
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-300 bg-white p-5">
                      <div className="text-base font-semibold text-slate-900">
                        Can you breathe to the side in freestyle for 12 arm strokes?
                      </div>
                      <YesNo
                        onYes={() => setLevel((s) => ({ ...s, s7_freestyleSideBreath12: true }))}
                        onNo={() => setLevel((s) => ({ ...s, s7_freestyleSideBreath12: false }))}
                      />
                    </div>

                    <div className="rounded-xl border border-slate-300 bg-white p-5">
                      <div className="text-base font-semibold text-slate-900">
                        Can you do backstroke for 12 arm strokes?
                      </div>
                      <YesNo
                        onYes={() => setLevel((s) => ({ ...s, s8_backstroke12: true }))}
                        onNo={() => setLevel((s) => ({ ...s, s8_backstroke12: false }))}
                      />
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

                    // Only require parentInWater for 24–36 months
                    if (months >= 24 && months <= 36) {
                      return level.parentInWater !== true && level.parentInWater !== false;
                    }
                    return false;
                  })()
                }
                onClick={proceedAge}
              />

              <div className="mt-6 flex justify-between gap-3">
                <SecondaryButton onClick={() => setStage("match")} label="Back" />
                <SecondaryButton onClick={resetAll} label="Reset" />
              </div>
            </Container>
          </>
        )}

        {/* ------------------------------ SKILLS ------------------------------ */}
        {stage === "skills" && (
          <>
            <Progress labels={["Intake", "Match", "Level", "Comments", "Results"]} activeIndex={2} />
            <Container title="Swim Level Finder" subtitle="Step 2: Skills">
              <div className="text-sm font-semibold text-teal-900">
                Skills {skillIndex + 1} of {SKILL_QUESTIONS.length}
              </div>
              <div className="mt-3 text-2xl font-extrabold text-slate-900">{currentSkill.text}</div>

              <YesNo onYes={() => answerSkill(true)} onNo={() => answerSkill(false)} />

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
            <Container title="Swim Level Finder" subtitle="Quick final question">
              <div className="mt-3 text-2xl font-extrabold text-slate-900">
                Would you say your swimmer has strong endurance and can maintain good technique for longer distances?
              </div>

              <YesNo onYes={() => answerEndurance(true)} onNo={() => answerEndurance(false)} />

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
            <Container title="Comments / Concerns" subtitle="Optional, but helpful for our team.">
              <div className="grid gap-4">
                <div className="text-slate-900 font-semibold">
                  Anything we should know about your swimmer? Goals, concerns, sensitivities, or scheduling notes.
                </div>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Example: nervous around back floats, prefers a calm instructor, goal is water safety before summer, etc."
                  className="min-h-[140px] w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900 placeholder:text-slate-500 outline-none focus:border-teal-700"
                />

                <PrimaryButton label="See Results" onClick={() => setStage("results")} />

                <div className="mt-2 flex justify-between gap-3">
                  <SecondaryButton
                    onClick={() => {
                      if (!level.birthday) {
                        setStage("age");
                        return;
                      }
                      const dob = new Date(level.birthday + "T00:00:00");
                      const now = new Date();
                      const years = yearsBetween(dob, now);
                      if (years >= 16) {
                        setStage("age");
                        return;
                      }
                      if (skillIndex >= SKILL_QUESTIONS.length - 1) {
                        setStage("endurance");
                        return;
                      }
                      setStage("skills");
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
                <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Results</h1>
                <p className="mt-3 text-lg font-medium text-slate-800">
                  Please save this as an image (PNG), then text it to us. We’ll help you pick the best class.
                </p>
              </div>

              {/* Friendly CTA banner at top of results */}
              <ContactBanner location={location} contact={contact} variant="results" />

              {/* Export area */}
              <div ref={resultsRef} className="mt-6 rounded-2xl border border-white/40 bg-white p-8 shadow-lg">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Intake</div>
                    <div className="mt-2 grid gap-1 text-slate-900">
                      <div><span className="font-semibold">Name:</span> {clientName || "N/A"}</div>
                      <div><span className="font-semibold">Location:</span> {location || "N/A"}</div>
                      <div><span className="font-semibold">Best day:</span> {preferredDay || "N/A"}</div>
                      <div><span className="font-semibold">Best time:</span> {preferredTime || "N/A"}</div>
                      <div>
                        <span className="font-semibold">Contact:</span>{" "}
                        {contactMethod === "email" ? (contactEmail || "N/A") : (contactPhone || "N/A")}
                      </div>
                    </div>
                  </div>

                  <div className="hidden sm:block">
                    <img src="/brand-logo.png" alt="SafeSplash + SwimLabs" className="h-auto w-[240px]" />
                  </div>
                </div>

                <div className="mt-6 grid gap-6 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                    <div className="text-sm font-semibold text-teal-900">Swim Level Finder</div>
                    <div className="mt-2 text-2xl font-extrabold text-slate-900">
                      {levelPick.levelKey ? LEVELS[levelPick.levelKey].title : "Not enough info"}
                    </div>
                    {levelPick.levelKey && (
                      <div className="mt-2 text-slate-900">
                        <span className="font-semibold">Ratio:</span> {LEVELS[levelPick.levelKey].ratio}
                      </div>
                    )}
                    {levelPick.reason && (
                      <div className="mt-4 rounded-xl border border-teal-200 bg-white p-4 text-slate-900">
                        <div className="text-sm font-semibold text-slate-900">Why this level</div>
                        <div className="mt-1">{levelPick.reason}</div>
                      </div>
                    )}
                    {levelPick.levelKey && (
                      <div className="mt-4 text-slate-900">{LEVELS[levelPick.levelKey].description}</div>
                    )}
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                    <div className="text-sm font-semibold text-teal-900">Instructor Match</div>

                    {matchResult ? (
                      <>
                        <div className="mt-2 text-2xl font-extrabold text-slate-900">{matchResult.name}</div>
                        <div className="mt-3 text-slate-900">{matchResult.summary}</div>

                        <div className="mt-4">
                          <div className="text-sm font-semibold text-slate-900">What you can expect</div>
                          <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-900">
                            {matchResult.bullets.map((b) => (
                              <li key={b}>{b}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="mt-5 rounded-xl border border-teal-200 bg-white p-4 text-sm text-slate-900">
                          <div className="font-semibold">Internal label</div>
                          <div className="mt-1">{matchResult.internal}</div>
                          <div className="mt-2">
                            <span className="font-semibold">Score:</span>{" "}
                            Goal {matchPick.scores.supersonic} | Structure {matchPick.scores.high_maintenance} | Connection{" "}
                            {matchPick.scores.extra_attention} | Value {matchPick.scores.budget}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="mt-2 text-slate-900">Match not completed.</div>
                    )}
                  </div>
                </div>

                {comments.trim() && (
                  <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
                    <div className="text-sm font-semibold text-slate-900">Comments / Concerns</div>
                    <div className="mt-2 whitespace-pre-wrap text-slate-900">{comments.trim()}</div>
                  </div>
                )}

                {portalUrl && (
                  <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
                    <div className="text-sm font-semibold text-slate-900">Enroll or view classes</div>
                    <div className="mt-2 text-slate-900 break-all">{portalUrl}</div>
                  </div>
                )}

                {contact && (
                  <div className="mt-6 rounded-xl border border-teal-200 bg-teal-50 p-5">
                    <div className="text-sm font-semibold text-slate-900">Text this PNG to the location team</div>
                    <div className="mt-2 text-slate-900">
                      <div><span className="font-semibold">Phone:</span> {contact.phone}</div>
                      <div><span className="font-semibold">Email:</span> {contact.email}</div>
                    </div>
                    <div className="mt-3 text-sm font-medium text-slate-900">
                      Tip: Save as PNG, then text the image to us. We’ll help you pick the best class.
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
                  className={[
                    "h-12 rounded-xl font-semibold",
                    exporting ? "bg-teal-300 text-white cursor-not-allowed" : "bg-slate-900 text-white hover:bg-slate-800",
                  ].join(" ")}
                >
                  {exporting ? "Saving..." : "Save as Image (PNG)"}
                </button>

                <button
                  type="button"
                  onClick={copySummary}
                  className="h-12 rounded-xl border border-slate-300 bg-white font-semibold text-slate-900 hover:border-teal-700 hover:bg-teal-50"
                >
                  Copy Summary
                </button>
              </div>

              {portalUrl && (
                <div className="mt-3">
                  <a
                    href={portalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-teal-700 px-4 font-semibold text-white hover:bg-teal-800"
                  >
                    Open Enrollment Link
                  </a>
                </div>
              )}

              <div className="mt-8 flex flex-wrap gap-3">
                <SecondaryButton onClick={() => setStage("comments")} label="Edit Comments" />
                <SecondaryButton
                  onClick={() => {
                    setStage("age");
                    setLevel({});
                    setSkillIndex(0);
                  }}
                  label="Redo Level Finder"
                />
                <SecondaryButton
                  onClick={() => {
                    setStage("match");
                    setMatchStep(0);
                    setMatch({});
                  }}
                  label="Redo Match"
                />
                <SecondaryButton onClick={resetAll} label="Start over" />
              </div>
            </div>
          </>
        )}

        {toast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-lg">
            {toast}
          </div>
        )}
      </div>
    </main>
  );
}
