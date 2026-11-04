import { androidAssociationResponse } from '@/lib/app-associations';

export const dynamic = 'force-dynamic';

export function GET() {
  return androidAssociationResponse();
}
