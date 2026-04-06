import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminHeader } from '@/components/admin/AdminHeader'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user || (session.user as any).rol !== 'admin') {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#060810] flex">
      <AdminSidebar user={session.user} />
      <div className="flex-1 flex flex-col min-w-0 ml-64">
        <AdminHeader user={session.user} />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
