'use client'

import * as React from 'react'
import { PaymentTable } from '@/components/payments/payment-table'
import { PendingPaymentsTable } from '@/components/payments/pending-payments-table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function PaymentsTabs() {
  return (
    <Tabs defaultValue="all" className="space-y-6">
      <TabsList className="w-full sm:w-auto">
        <TabsTrigger value="all" className="flex-1 sm:flex-initial">
          All payments
        </TabsTrigger>
        <TabsTrigger value="pending" className="flex-1 sm:flex-initial">
          Pending
        </TabsTrigger>
      </TabsList>

      <TabsContent value="all">
        <PaymentTable />
      </TabsContent>

      <TabsContent value="pending">
        <PendingPaymentsTable />
      </TabsContent>
    </Tabs>
  )
}
