const CHEMINS = {
  coller: "M9 3h6v4H9zM15 5h3v16H6V5h3M9 12h6M9 16h4",
  image: "M4 5h16v14H4zM4 16l5-5 4 4 2-2 5 5M15.5 9.5h.01",
  cadenas: "M6 11h12v10H6zM9 11V8a3 3 0 0 1 6 0v3",
  partager: "M12 3v12M7 8l5-5 5 5M5 13v8h14v-8",
  telephone: "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2",
  lien: "M10 14a4 4 0 0 0 6 0l3-3a4 4 0 0 0-6-6l-1 1M14 10a4 4 0 0 0-6 0l-3 3a4 4 0 0 0 6 6l1-1",
  danger: "M8 2h8l6 6v8l-6 6H8l-6-6V8zM12 7v6M12 17h.01",
  suspect: "M12 3l10 18H2zM12 10v5M12 18h.01",
  info: "M12 2a10 10 0 1 0 0 20a10 10 0 0 0 0-20M12 11v6M12 7h.01",
};

export type NomIcone = keyof typeof CHEMINS;

export function Icone({ nom, className = "size-6" }: { nom: NomIcone; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={CHEMINS[nom]} />
    </svg>
  );
}
