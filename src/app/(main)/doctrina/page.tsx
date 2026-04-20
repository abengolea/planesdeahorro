import type { Metadata } from 'next';
import { DoctrineListClient } from './doctrine-list-client';

export const metadata: Metadata = {
  title: 'Doctrina y Artículos sobre Planes de Ahorro',
  description:
    'Análisis y artículos de doctrina sobre la problemática de los planes de ahorro en Argentina.',
};

export default function DoctrinePage() {
  return <DoctrineListClient />;
}
