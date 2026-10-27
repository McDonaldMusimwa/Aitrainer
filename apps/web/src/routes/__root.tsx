import { Outlet, createRootRoute } from '@tanstack/react-router'

// Every page renders inside <Outlet />. Shared chrome (nav, footer) goes here.
export const Route = createRootRoute({
  component: () => <Outlet />,
})
