import { Film } from '@/components/Film';
import { TextDocument } from '@/components/TextDocument';
import { Contact } from '@/scenes/Contact';
import { Intelligence } from '@/scenes/Intelligence';
import { NestIQ } from '@/scenes/NestIQ';
import { TheMap } from '@/scenes/map/TheMap';
import { Origin } from '@/scenes/origin/Origin';
import { RealWorld } from '@/scenes/RealWorld';
import { ResQMesh } from '@/scenes/ResQMesh';
import { Systems } from '@/scenes/Systems';

export default function Home() {
  return (
    <main>
      <noscript>
        <style>{'.film-track{display:none}'}</style>
        <TextDocument />
      </noscript>
      <Film>
        <Origin />
        <Intelligence />
        <Systems />
        <RealWorld />
        <TheMap />
        <ResQMesh />
        <NestIQ />
        <Contact />
      </Film>
    </main>
  );
}
