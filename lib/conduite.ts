/**
 * Référentiel des conduites à tenir selon les identifiants de conduite.yaml.
 */
export const CONDUITES_PAR_DEFAUT: Record<string, string> = {
  conduite_suspicion_generale:
    "Ne communiquez aucun code secret ni identifiant personnel. En cas de doute, contactez le service client officiel de votre opérateur mobile money.",
  conduite_compte_compromis:
    "Si vous avez partagé des informations confidentielles, faites immédiatement bloquer votre compte auprès de votre opérateur et modifiez votre code secret.",
};

/**
 * Récupère le texte de conduite à tenir associé à un identifiant.
 * 
 * @param conduiteId Identifiant de la conduite
 * @returns Le texte explicatif de la conduite à tenir
 */
export function getTexteConduite(conduiteId: string): string {
  return (
    CONDUITES_PAR_DEFAUT[conduiteId] ||
    "En cas de doute, ne cliquez sur aucun lien et contactez votre opérateur via son canal d'assistance officiel."
  );
}
