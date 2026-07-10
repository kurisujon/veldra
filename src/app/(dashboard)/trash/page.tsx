import { PageContainer } from '@/components/layouts/PageContainer'
import { getDeletedCases } from '@/features/cases/actions'
import { getDeletedDrafts } from '@/features/drafts/actions'
import { getDeletedExports } from '@/features/exports/actions'
import { TrashWorkspace } from '@/features/trash/components/TrashWorkspace'

export default async function TrashPage() {
  const [cases, drafts, exportsData] = await Promise.all([
    getDeletedCases(),
    getDeletedDrafts(),
    getDeletedExports()
  ])

  return (
    <PageContainer>
      <div className="flex flex-col gap-xl">
        <div className="flex flex-col gap-xs">
          <h1 className="text-heading font-semibold text-text-primary">Trash</h1>
          <p className="text-body text-text-secondary">
            Manage deleted cases, legal drafts, and generated reports. Items here can be restored or permanently deleted.
          </p>
        </div>

        <TrashWorkspace 
          deletedCases={Array.isArray(cases) ? cases : []} 
          deletedDrafts={Array.isArray(drafts) ? drafts : []} 
          deletedExports={Array.isArray(exportsData) ? exportsData : []} 
        />
      </div>
    </PageContainer>
  )
}
