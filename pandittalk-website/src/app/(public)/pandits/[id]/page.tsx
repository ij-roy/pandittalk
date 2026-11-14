import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ExpertDetail } from '@/features/experts/ExpertDetail';
import { SITE_URL } from '@/lib/articles/site';

async function fetchExpert(id: string) {
  try {
    const response = await fetch(`${process.env.BACKEND_URL || process.env.API_BASE || 'https://api.pandittalk.com'}/experts/${encodeURIComponent(id)}`, {
      next: { revalidate: 300 },
    });
    if (!response.ok) return null;
    return await response.json() as { name?: string; specialty?: string; bio?: string };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const expert = await fetchExpert(id);
  if (!expert) {
    return {
      title: 'Pandit not found',
      description: 'This Pandit profile is not available on Pandit Talk.',
      robots: { index: false, follow: true },
      alternates: { canonical: '/pandits' },
    };
  }
  const name = expert.name || 'Pandit profile';
  const description = expert.specialty || expert.bio?.slice(0, 140) || 'Read this Pandit\'s introduction on Pandit Talk.';
  return {
    title: name,
    description,
    alternates: { canonical: `/pandits/${id}` },
    openGraph: {
      title: `${name} · Pandit Talk`,
      description,
      url: `${SITE_URL}/pandits/${id}`,
      type: 'profile',
    },
  };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const expert = await fetchExpert(id);
  if (!expert) notFound();
  return (
    <main id="main-content" className="page">
      <ExpertDetail id={id} />
    </main>
  );
}
