import { redirect } from 'next/navigation';

/** Sección de videos deshabilitada temporalmente: redirige al inicio. */
export default function VideosPage() {
  redirect('/');
}
