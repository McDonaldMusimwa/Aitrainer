import { createFileRoute, redirect } from '@tanstack/react-router'

// No home page yet, so / sends people to log in.
export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: '/login' })
  },
})
