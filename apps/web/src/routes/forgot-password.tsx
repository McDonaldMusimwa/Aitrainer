import { createFileRoute } from '@tanstack/react-router'
import { ForgotPassword } from '@/components/forgotPassword'

export const Route = createFileRoute('/forgot-password')({
  component: ForgotPassword,
})
