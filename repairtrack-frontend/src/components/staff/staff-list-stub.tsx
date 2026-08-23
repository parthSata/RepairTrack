'use client'

import { UserPlus, Users } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { AddStaffDialog } from './add-staff-dialog'

export function StaffListStub() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Team Members</h2>
          <p className="text-sm text-muted-foreground">Manage your shop staff and technician access permissions.</p>
        </div>
        <AddStaffDialog />
      </div>

      <Card className="border-border shadow-sm">
        <CardContent className="flex flex-col items-center justify-center p-12 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
            <Users className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Staff Roster</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Invite staff members or technicians to collaborate in your shop workspace. Active staff will appear here.
          </p>
          <div className="mt-6">
            <AddStaffDialog
              trigger={
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground shadow transition-colors hover:bg-accent/90"
                >
                  <UserPlus className="h-4 w-4" />
                  Invite Staff Member
                </button>
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
