import { DEFAULT_THRESHOLD } from "@/app/constants";
import { matchesRequestSchema } from "./schemas";
import { scanForPatientMatches } from "./scanForPatientMatches";

export const runtime = "nodejs";

export async function POST(req: Request): Promise<Response> {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = matchesRequestSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      {
        ok: false,
        error: "Invalid request",
        issues: parsed.error.issues,
      },
      { status: 400 },
    );
  }

  const { list1, list2, threshold } = parsed.data;

  const reports = scanForPatientMatches(list1, list2, { threshold });

  return Response.json({
    threshold: threshold ?? DEFAULT_THRESHOLD,
    count: reports.length,
    reports,
  });
}
