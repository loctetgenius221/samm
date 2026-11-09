"use client";

import { useState } from "react";
import { AnalyseForm } from "@/components/AnalyseForm";
import { ResultZone, type ResultatAffichage } from "@/components/ResultZone";

export default function Home() {
  const [resultat, setResultat] = useState<ResultatAffichage | null>(null);

  return resultat ? (
    <ResultZone resultat={resultat} onRecommencer={() => setResultat(null)} />
  ) : (
    <AnalyseForm onResultat={setResultat} />
  );
}
