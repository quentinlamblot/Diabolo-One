export async function genererTrameInterview({
  brief,
  typeInterview,
}: {
  brief: Record<string, string>;
  typeInterview: "longue" | "courte";
}): Promise<string[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY manquant : impossible de générer la trame.");

  const nombreQuestions = typeInterview === "longue" ? 8 : 4;
  const briefTexte = Object.entries(brief)
    .filter(([, v]) => v && v.trim())
    .map(([k, v]) => `- ${k} : ${v}`)
    .join("\n");

  const prompt = `Tu es scénariste pour une agence de vidéo qui produit des témoignages clients.
À partir du brief ci-dessous, rédige exactement ${nombreQuestions} questions d'interview en français, à poser à l'interviewé pour un témoignage vidéo.

Suis impérativement cette trame narrative, en répartissant les ${nombreQuestions} questions sur ces temps, dans cet ordre :
1. Qui es-tu ? (identité, rôle, contexte de l'interlocuteur)
2. Quel était son état initial / sa situation avant ?
3. Quelle problématique a-t-il rencontrée ?
4. Comment la solution a permis de la résoudre ?
5. Recommandations / conclusion

Brief du projet :
${briefTexte || "(aucune information de brief disponible, reste générique)"}

Réponds UNIQUEMENT avec un tableau JSON de ${nombreQuestions} chaînes de caractères (les questions), sans aucun texte autour, sans balises markdown.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-5",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Erreur API Anthropic (${res.status}) : ${text}`);
  }

  const data = await res.json();
  const texte: string = data.content?.[0]?.text ?? "";

  try {
    const parsed = JSON.parse(texte);
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch {
    // Le modèle n'a pas renvoyé un JSON strict : repli en découpant ligne par ligne.
  }

  return texte
    .split("\n")
    .map((l) => l.replace(/^[\d.\-•\s]+/, "").trim())
    .filter(Boolean)
    .slice(0, nombreQuestions);
}
