import Hero from "@/components/Hero";
import ModuleGrid from "@/components/ModuleGrid";
import { getPortal } from "@/lib/content";

export default function HomePage() {
  const { meta, modules } = getPortal();

  return (
    <>
      <Hero meta={meta} firstModule={modules[0]} />
      <ModuleGrid modules={modules} />
    </>
  );
}
