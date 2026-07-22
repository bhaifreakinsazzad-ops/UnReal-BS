import { IntegrationsShell } from '@/components/integrations/IntegrationsShell'

const LOCATION_ID = process.env.GHL_LOCATION_ID!

export default function IntegrationsPage() {
  return <IntegrationsShell locationId={LOCATION_ID} />
}
