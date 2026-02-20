import { tasks } from '@trigger.dev/sdk/v3'
import type { ProvisionPayload } from '../../../../trigger/provision-agent-machine'
import type { DestroyPayload } from '../../../../trigger/destroy-agent-machine'

export async function triggerProvision(payload: ProvisionPayload) {
  return tasks.trigger('provision-agent-machine', payload)
}

export async function triggerDestroy(payload: DestroyPayload) {
  return tasks.trigger('destroy-agent-machine', payload)
}
