/* -------------------------------------------------------------------------
 * app/projects/[slug]/page.tsx        (or src/app/projects/[slug]/page.tsx)
 * Only change: the metadata description no longer assumes `note` exists.
 * ---------------------------------------------------------------------- */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProjectDetail from "../../../components/ProjectDetail";
import { PROJECT_DETAILS, PROJECT_SLUGS } from "../../../data/projects";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams(): { slug: string }[] {
  return PROJECT_SLUGS.map((slug: string) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = PROJECT_DETAILS[slug];
  if (!p) return {};
  return { title: `${p.title} — ${p.tagline}`, description: p.note ? p.note.join(" ") : p.tags };
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const project = PROJECT_DETAILS[slug];
  if (!project) notFound();
  return <ProjectDetail project={project} />;
}