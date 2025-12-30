import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'

import type { QueryClient } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import Header, { SidebarList } from '@/components/Header'

interface MyRouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: () => (
    <div className="flex h-screen w-screen overflow-hidden">
      <div className="bg-black text-white shadow-2xl flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h1 className="ml-4 text-xl font-semibold">my budget</h1>
        </div>
        <SidebarList />
      </div>
      <div>
        <Header />
        <Outlet />
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
            TanStackQueryDevtools,
          ]}
        />
        <Toaster />
      </div>
    </div>
  ),
})
