import { appleAssociationResponse } from '@/lib/app-associations';

export const dynamic = 'force-dynamic';

export function GET() {
  return appleAssociationResponse();
}
