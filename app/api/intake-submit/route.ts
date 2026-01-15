export const runtime = "nodejs";

type Payload = {
  parentName?: string;
  location?: string;
  preferredDay?: string;
  preferredTime?: string;
  contactMethod?: string;
  contactValue?: string;

  instructorPrimary?: string;
  instructorSecondary?: string;

  internalCode?: string;
  scoreGoal?: number;
  scoreStructure?: number;
  scoreConnection?: number;
  scoreValue?: number;

  levelTitle?: string;
  levelRatio?: string;
  levelReason?: string;

  comments?: string;
  portalUrl?: string;
};

function needEnv(name: string) {
  const v = process.env[name];
  if (!v || !v.trim()) throw new Error(`Missing env var: ${name}`);
  return v.trim();
}

function safeString(v: unknown) {
  if (typeof v === "string") return v.trim();
  return "";
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Payload;

    const parentName = safeString(body.parentName);
    const location = safeString(body.location);

    if (!parentName || !location) {
      return new Response(JSON.stringify({ ok: false, error: "Missing required fields: parentName/location." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Required env vars
    const SMTP_USER = needEnv("SMTP_USER"); // your gmail address
    const SMTP_PASS = needEnv("SMTP_PASS"); // gmail app password
    const INTAKE_TO_EMAIL = needEnv("INTAKE_TO_EMAIL"); // where you want it delivered

    // Optional env vars (defaults for Gmail)
    const SMTP_HOST = process.env.SMTP_HOST?.trim() || "smtp.gmail.com";
    const SMTP_PORT = parseInt(process.env.SMTP_PORT || "465", 10);

    const nodemailerMod = await import("nodemailer");
    const nodemailer = nodemailerMod.default;

    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });

    const contactLine =
      safeString(body.contactMethod) === "email"
        ? `Email: ${safeString(body.contactValue)}`
        : `Phone: ${safeString(body.contactValue)}`;

    const subject = `New Intake — ${parentName} (${location})`;

    const lines: string[] = [];
    lines.push("New Intake Submission");
    lines.push("--------------------------------");
    lines.push(`Name: ${parentName}`);
    lines.push(`Location: ${location}`);
    lines.push(`Preferred day: ${safeString(body.preferredDay) || "N/A"}`);
    lines.push(`Preferred time: ${safeString(body.preferredTime) || "N/A"}`);
    lines.push(`Contact: ${contactLine}`);
    lines.push("");
    lines.push("Instructor Match (Customer-facing)");
    lines.push("--------------------------------");
    lines.push(`Primary: ${safeString(body.instructorPrimary) || "N/A"}`);
    if (safeString(body.instructorSecondary)) lines.push(`Secondary: ${safeString(body.instructorSecondary)}`);
    lines.push("");
    lines.push("Internal Reference");
    lines.push("--------------------------------");
    lines.push(`Code: ${safeString(body.internalCode) || "N/A"}`);
    lines.push(
      `Scores: Goal ${body.scoreGoal ?? "N/A"} | Structure ${body.scoreStructure ?? "N/A"} | Connection ${
        body.scoreConnection ?? "N/A"
      } | Value ${body.scoreValue ?? "N/A"}`
    );
    lines.push("");
    lines.push("Level Finder");
    lines.push("--------------------------------");
    lines.push(`Level: ${safeString(body.levelTitle) || "N/A"}`);
    lines.push(`Ratio: ${safeString(body.levelRatio) || "N/A"}`);
    if (safeString(body.levelReason)) lines.push(`Why: ${safeString(body.levelReason)}`);
    if (safeString(body.comments)) {
      lines.push("");
      lines.push("Comments / Concerns");
      lines.push("--------------------------------");
      lines.push(safeString(body.comments));
    }
    if (safeString(body.portalUrl)) {
      lines.push("");
      lines.push("Enrollment Link");
      lines.push("--------------------------------");
      lines.push(safeString(body.portalUrl));
    }

    const text = lines.join("\n");

    const info = await transporter.sendMail({
      from: `Intake App <${SMTP_USER}>`,
      to: INTAKE_TO_EMAIL,
      subject,
      text,
      replyTo: safeString(body.contactMethod) === "email" ? safeString(body.contactValue) : undefined,
    });

    return new Response(JSON.stringify({ ok: true, messageId: info?.messageId || null }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    const msg = typeof err?.message === "string" ? err.message : "Server error";
    console.error("intake-submit error:", err);

    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
