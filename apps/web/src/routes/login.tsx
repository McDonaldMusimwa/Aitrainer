import { createFileRoute } from '@tanstack/react-router'
import { SignIn } from '@/components/signin'

export const Route = createFileRoute('/login')({
  component: SignIn,
})
