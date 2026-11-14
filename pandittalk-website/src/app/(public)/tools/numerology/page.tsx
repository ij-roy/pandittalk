import Image from 'next/image';
import Link from 'next/link';

export const metadata = { title: 'Numerology practices' };

const posters = [
  ['/media/numerology/mulank-1-white-object-practice.webp', 'Mulank 1', 'A visual note about keeping a white object nearby.', 1024, 1536],
  ['/media/numerology/mulank-2-daily-prayer.webp', 'Mulank 2', 'A visual reminder for a short daily prayer.', 1086, 1448],
  ['/media/numerology/mulank-3-hug-loved-one.webp', 'Mulank 3', 'A visual prompt to connect with someone you care about.', 1086, 1448],
  ['/media/numerology/mulank-4-blue-colour-practice.webp', 'Mulank 4', 'A visual note about wearing or keeping something blue.', 1024, 1536],
  ['/media/numerology/mulank-5-sun-practice.webp', 'Mulank 5', 'A visual morning sunlight practice.', 1024, 1536],
  ['/media/numerology/mulank-6-green-token-practice.webp', 'Mulank 6', 'A visual note about keeping a small green item nearby.', 1024, 1536],
  ['/media/numerology/mulank-7-water-reminder.webp', 'Mulank 7', 'A visual reminder to drink water through the day.', 1024, 1536],
  ['/media/numerology/mulank-8-mirror-practice.webp', 'Mulank 8', 'A visual prompt for a short mirror-based self-reflection practice.', 853, 1280],
  ['/media/numerology/mulank-9-ruby-practice.webp', 'Mulank 9', 'A visual note about keeping a ruby nearby.', 1024, 1536],
] as const;

export default function Page() {
  return <main id="main-content" className="page media-page">
    <header className="media-page-header">
      <Link className="info-back" href="/tools">← Back to tools</Link>
      <p className="eyebrow">Numerology gallery</p>
      <h1>Small practices for your Mulank.</h1>
      <p className="lede">Browse these visual prompts at your own pace. They are traditional practices for reflection, not guaranteed outcomes.</p>
    </header>
    <div className="poster-grid">
      {posters.map(([src,title,alt,width,height]) => <figure className="poster-card" key={src}>
        <Image src={src} alt={alt} width={width} height={height} sizes="(max-width: 680px) 100vw, (max-width: 1100px) 50vw, 33vw" />
        <figcaption>{title}</figcaption>
      </figure>)}
    </div>
  </main>;
}

