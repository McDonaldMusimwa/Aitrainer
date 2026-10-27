import { createFileRoute } from '@tanstack/react-router'
import { SignUp } from '@/components/signup'

export const Route = createFileRoute('/sign-up')({
  component: SignUp,
})
