/**
 * Script de test manuel du modèle de langage.
 * Lancé par « npm run test:llm ».
 * N'est PAS exécuté en CI.
 *
 * Lit un fichier local scripts/test-messages.json contenant des messages de test
 * au format { texte, attendu }. Pour chaque message, appelle lib/llm.ts
 * et affiche les résultats sans jamais afficher le texte des messages.
 *
 * Usage : npm run test:llm
 */

import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { analyzeWithLLM, llmOutputSchema } from "../lib/llm";
import { evaluateRules } from "../lib/rules";

// ---------------------------------------------------------------------------
// Schéma du fichier de test
// ---------------------------------------------------------------------------

const TestMessageSchema = z.object({
  texte: z.string().min(1),
  attendu: z.enum(["danger", "suspect", "aucun_signal"]),
});

type TestMessage = z.infer<typeof TestMessageSchema>;

// ---------------------------------------------------------------------------
// Chargement des messages de test
// ---------------------------------------------------------------------------

function loadTestMessages(): TestMessage[] {
  const filePath = path.join(process.cwd(), "scripts", "test-messages.json");

  if (!fs.existsSync(filePath)) {
    console.error(
      "❌ Fichier scripts/test-messages.json introuvable.\n" +
        "   Copiez scripts/test-messages.example.json et ajoutez vos messages de test."
    );
    process.exit(1);
  }

  const raw = fs.readFileSync(filePath, "utf-8");
  const parsed: unknown = JSON.parse(raw);

  if (!Array.isArray(parsed)) {
    console.error("❌ Le fichier doit contenir un tableau JSON.");
    process.exit(1);
  }

  const messages: TestMessage[] = [];
  for (const item of parsed) {
    const result = TestMessageSchema.safeParse(item);
    if (!result.success) {
      console.error("❌ Entrée invalide dans test-messages.json :", result.error.message);
      process.exit(1);
    }
    messages.push(result.data);
  }

  return messages;
}

// ---------------------------------------------------------------------------
// Exécution
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const messages = loadTestMessages();
  const total = messages.length;

  console.log(`\n🧪 Test LLM — ${total} message(s)\n`);
  console.log(
    "#".padEnd(4) +
      "Attendu".padEnd(16) +
      "Obtenu".padEnd(16) +
      "JSON".padEnd(8) +
      "Mots".padEnd(8) +
      "Durée"
  );
  console.log("─".repeat(60));

  let correctCount = 0;
  let invalidJsonCount = 0;
  let totalDurationMs = 0;

  for (let i = 0; i < total; i++) {
    const msg = messages[i];
    const startTime = performance.now();

    // Évaluer les règles pour fournir le contexte au LLM
    const regles = evaluateRules(msg.texte);

    let niveau = "???";
    let jsonValid = false;
    let wordCount = 0;

    try {
      const result = await analyzeWithLLM(
        msg.texte,
        regles.signaux,
        [], // pas de recherche lexicale dans le test manuel
        undefined
      );

      // Vérifier si le résultat passe la validation Zod
      const validation = llmOutputSchema.safeParse(result);
      jsonValid = validation.success;
      if (!jsonValid) {
        invalidJsonCount++;
      }

      niveau = result.niveau;
      wordCount = result.explication.split(/\s+/).filter(Boolean).length;
    } catch {
      invalidJsonCount++;
    }

    const durationMs = performance.now() - startTime;
    totalDurationMs += durationMs;

    const isCorrect = niveau === msg.attendu;
    if (isCorrect) correctCount++;

    const marker = isCorrect ? "✅" : "❌";

    console.log(
      `${(i + 1).toString().padEnd(4)}` +
        `${msg.attendu.padEnd(16)}` +
        `${niveau.padEnd(16)}` +
        `${(jsonValid ? "✓" : "✗").padEnd(8)}` +
        `${wordCount.toString().padEnd(8)}` +
        `${(durationMs / 1000).toFixed(1)}s  ${marker}`
    );
  }

  console.log("─".repeat(60));

  const avgDuration = total > 0 ? totalDurationMs / total : 0;

  console.log(`\n📊 Résultats :`);
  console.log(`   Niveaux corrects : ${correctCount}/${total}`);
  console.log(`   JSON invalides   : ${invalidJsonCount}/${total}`);
  console.log(`   Durée moyenne    : ${(avgDuration / 1000).toFixed(1)}s`);
  console.log();
}

main().catch((err) => {
  console.error("❌ Erreur fatale :", err instanceof Error ? err.message : err);
  process.exit(1);
});
