import Image from "next/image";

export function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      <Image src="/logo.svg" alt="" width={36} height={36} priority />
      <span className="text-[1.375rem] font-extrabold tracking-tight">Sàmm</span>
    </span>
  );
}
