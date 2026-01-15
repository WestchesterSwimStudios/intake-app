import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      parentName,
      location,
      preferredDay,
      preferredTime,
      contactMethod,
      contactValue,
      instructorPrimary,
      instructorSecondary,
      internalCode,
      scoreGoal,
      scoreStructure,
      scoreConnection,
      scoreValue,
      levelTitle,
      levelRatio,
      levelReason,
      comments,
    } = body;

    if (
      !parentName ||
      !location ||
      !contactMethod ||
      !contactValue ||
      !instructorPrimary
    ) {
      return new Response(
        JSON.stringify({ ok: false, error: "Missing required fields" }),
        { status: 400 }
      );
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const subject = `[New Intake] ${location} | ${instructorPrimary} | Code ${
      internalCode ?? "?"
    }`;

    const text = `
NEW INTAKE SUBMISSION

Parent Name: ${parentName}
Location: ${location}

CONTACT
Method: ${contactMethod}
Value: ${contactValue}

PREFERRED SCHEDULING
Day: ${preferredDay || "N/A"}
Time: ${preferredTime || "N/A"}

INSTRUCTOR MATCH (Customer-facing)
Primary: ${instructorPrimary}
${instructorSecondary ? `Alternate: ${instructorSecondary}` : ""}

INTERNAL CUSTOMER CODE (Staff-only)
Code: ${internalCode || "N/A"}
Scores:
- Goal: ${scoreGoal ?? 0}
- Structure: ${scoreStructure ?? 0}
- Connection: ${scoreConnection ?? 0}
- Value: ${scoreValue ?? 0}

LEVEL RECOMMENDATION
Level: ${levelTitle || "N/A"}
Ratio: ${levelRatio || "N/A"}
${levelReason ? `Reason: ${levelReason}` : ""}

COMMENTS
${comments || "None"}
`.trim();

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: process.env.INTAKE_TO_EMAIL,
      subject,
      text,
      replyTo: process.env.INTAKE_TO_EMAIL,
    });

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    console.error("Intake submit failed:", err);
    return new Response(
      JSON.stringify({ ok: false, error: "Server error" }),
      { status: 500 }
