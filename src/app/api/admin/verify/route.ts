import { NextRequest, NextResponse } from 'next/server';
import { verifySessionIsAdmin } from '@/firebase/admin';

/**
 * Verifica sesión de Firebase y existencia en admin_users usando Admin SDK (sin reglas del cliente).
 */
export async function POST(req: NextRequest) {
  const authz = req.headers.get('authorization');
  const token = authz?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
  if (!token) {
    return NextResponse.json({ error: 'Falta Authorization: Bearer <idToken>' }, { status: 401 });
  }

  try {
    const { admin } = await verifySessionIsAdmin(token);
    return NextResponse.json({ admin });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('credencial') || msg.includes('FIREBASE_SERVICE_ACCOUNT')) {
      return NextResponse.json(
        { error: 'Servidor sin credencial de Admin SDK (FIREBASE_SERVICE_ACCOUNT_PATH / JSON).' },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: 'Token inválido o expirado' }, { status: 401 });
  }
}
