import {
  SYSTEM_PROMPT_BASICO,
  SYSTEM_PROMPT_PRO,
  SYSTEM_PROMPT_PREMIUM,
  SYSTEM_PROMPT_BROKER,
} from '@/lib/claude/prompts'
import ConfiguracionAdminPage from '@/components/admin/ConfiguracionPage'

export default function ConfiguracionPage() {
  const defaultPrompts = {
    basico: SYSTEM_PROMPT_BASICO,
    pro: SYSTEM_PROMPT_PRO,
    premium: SYSTEM_PROMPT_PREMIUM,
    broker: SYSTEM_PROMPT_BROKER,
  }

  return <ConfiguracionAdminPage defaultPrompts={defaultPrompts} />
}
