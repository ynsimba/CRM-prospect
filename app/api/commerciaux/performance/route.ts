import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { fichesAccessibles, loadScoresCommerciaux } from "@/lib/performance";

/**
 * Classement des commerciaux de l’organisation, visible par tout compte connecté.
 * `fiches` liste les commerciaux dont ce compte peut ouvrir la fiche du cockpit.
 */
export async function GET() {
  const session = await requireSession();
  try {
    const [data, fiches] = await Promise.all([loadScoresCommerciaux(session), fichesAccessibles(session)]);
    return NextResponse.json({ data, fiches });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Scores indisponibles pour le moment." }, { status: 502 });
  }
}
