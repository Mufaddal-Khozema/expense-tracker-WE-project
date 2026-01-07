import { Link } from '@tanstack/react-router'

import { useState } from 'react'
import { ClipboardType, Home, Menu, Network, Table, X } from 'lucide-react'
import { useAccounts } from '@/hooks/use-accounts'
import { useCreateAccount } from '@/hooks/use-create-account'
import { AddAccount } from './account/add-account'
import { formatCurrency } from '@/lib/utils'

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <aside
      className={`fixed top-0 left-0 h-full w-80 bg-black text-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <h2 className="text-xl font-bold">Navigation</h2>
        <button
          onClick={() => setIsOpen(false)}
          className="p-2 hover:bg-gray-900 rounded-lg transition-colors"
          aria-label="Close menu"
        >
          <X size={24} />
        </button>
      </div>
      <SidebarList setIsOpen={setIsOpen} />
    </aside>
  )
}

export const SidebarList = ({setIsOpen}: {setIsOpen?: (open: boolean) => void}) => {
  const {data: accounts, isLoading, refetch} = useAccounts()

  return (
    <nav className="flex-1 p-4 overflow-y-auto">
      <Link
        to="/transactions"
        className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-900 transition-colors mb-2"
        activeProps={{
          className:
            'flex justify-between items-center gap-3 p-3 rounded-lg bg-gray-800 hover:bg-gray-900 transition-colors mb-2',
        }}
      >
        <span className="font-medium">Transaction</span>
      </Link>
      {accounts?.map(account => (
        <Link
          to="/"
          onClick={() => setIsOpen?.(false)}
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-900 transition-colors mb-2"
          activeProps={{
            className:
              'flex justify-between items-center gap-3 p-3 rounded-lg bg-gray-800 hover:bg-gray-900 transition-colors mb-2',
          }}
        >
          <span className="font-medium">{account.name}</span>
          <span className="font-medium">{formatCurrency(account.balance??0)}</span>
        </Link>
      ))}
      <AddAccount />
    </nav>
  )
}
