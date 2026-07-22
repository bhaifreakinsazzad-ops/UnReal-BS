import { WorkflowsShell } from '@/components/workflows/WorkflowsShell'
import { getWorkflows } from '@/lib/ghl/workflows'

const LOCATION_ID = process.env.GHL_LOCATION_ID!

export default async function WorkflowsPage() {
  const workflows = await getWorkflows(LOCATION_ID)
  return <WorkflowsShell workflows={workflows} />
}
