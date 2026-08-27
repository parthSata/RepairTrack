'use client'

import * as React from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  User,
  Phone,
  Mail,
  Smartphone,
  Wrench,
  Plus,
  CheckCircle2,
  AlertCircle,
  LoaderCircle,
  ChevronRight,
  ArrowLeft,
  UserCheck,
  UserCog,
  FileText,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import { useCustomers, type Customer } from '@/features/customers/queries'
import { useDevices, type Device } from '@/features/devices/queries'
import { useTechnicians, type Repair } from '@/features/repairs/queries'
import { useCreateRepair } from '@/features/repairs/mutations'
import {
  createRepairSchema,
  repairPriorityValues,
  type CreateRepairInput,
  type RepairPriority,
} from '@/features/repairs/schemas'

import { CustomerForm } from '@/components/customers/customer-form'
import { DeviceForm } from '@/components/devices/device-form'
import { DeviceTypeIcon, ConditionBadge } from '@/components/devices/device-table'

export function NewRepairWorkflow() {
  const [selectedCustomer, setSelectedCustomer] = React.useState<Customer | null>(null)
  const [selectedDevice, setSelectedDevice] = React.useState<Device | null>(null)

  const [customerDialogOpen, setCustomerDialogOpen] = React.useState(false)
  const [deviceDialogOpen, setDeviceDialogOpen] = React.useState(false)

  const [customerSearch, setCustomerSearch] = React.useState('')
  const [debouncedCustomerSearch, setDebouncedCustomerSearch] = React.useState('')
  const [createdRepair, setCreatedRepair] = React.useState<Repair | null>(null)

  // Debounce customer search input by 300ms to eliminate instant DB queries on every keystroke
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedCustomerSearch(customerSearch)
    }, 300)
    return () => clearTimeout(timer)
  }, [customerSearch])

  // 1. Fetch Customers
  const { data: customersData, isLoading: isLoadingCustomers } = useCustomers({
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    search: debouncedCustomerSearch.trim() || undefined,
  })

  // 2. Fetch Devices for Selected Customer
  const { data: devicesData, isLoading: isLoadingDevices } = useDevices({
    page: 1,
    limit: 50,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    customerId: selectedCustomer?.id || 'none',
  })

  // 3. Fetch Active Technicians
  const { data: technicians, isLoading: isLoadingTechs } = useTechnicians()

  // 4. Create Repair Mutation
  const createRepairMutation = useCreateRepair()

  // 5. Main Repair Form Hook
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset: resetRepairForm,
    formState: { errors },
  } = useForm<CreateRepairInput>({
    resolver: zodResolver(createRepairSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      customerId: '',
      deviceId: '',
      problemDescription: '',
      initialCondition: '',
      priority: 'MEDIUM',
      estimatedCost: undefined,
      expectedCompletionDate: undefined,
      assignedTechnicianId: undefined,
      initialNote: undefined,
    },
  })

  const watchPriority = watch('priority')
  const watchTechId = watch('assignedTechnicianId')
  const watchProblem = watch('problemDescription')
  const watchCondition = watch('initialCondition')

  const assignedTechObj = technicians?.find((t) => t.id === watchTechId)

  // Handle Customer Select
  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer)
    setValue('customerId', customer.id, { shouldValidate: true })
    setSelectedDevice(null)
    setValue('deviceId', '', { shouldValidate: true })
  }

  // Handle Device Select
  const handleSelectDevice = (device: Device) => {
    setSelectedDevice(device)
    setValue('deviceId', device.id, { shouldValidate: true })
  }

  // Submit Final Ticket Form
  const onSubmitTicket = (values: CreateRepairInput) => {
    createRepairMutation.mutate(values, {
      onSuccess: (newTicket) => {
        setCreatedRepair(newTicket)
      },
    })
  }

  // Reset entire workflow
  const handleCreateAnother = () => {
    setSelectedCustomer(null)
    setSelectedDevice(null)
    setCreatedRepair(null)
    setCustomerSearch('')
    resetRepairForm()
  }

  // -------------------------------------------------------------
  // SUCCESS VIEW
  // -------------------------------------------------------------
  if (createdRepair) {
    return (
      <div className="max-w-2xl mx-auto py-8 space-y-6">
        <Card className="border-emerald-500/30 bg-card shadow-lg">
          <CardContent className="pt-8 text-center space-y-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="h-10 w-10" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                Repair Ticket Created Successfully!
              </h2>
              <p className="text-sm text-muted-foreground">
                Ticket number has been generated and registered in your shop.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-muted/40 p-6 text-left space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                  Ticket Number
                </span>
                <span className="font-mono text-base font-bold text-accent bg-accent/10 px-3 py-1 rounded-md">
                  #{createdRepair.ticketNumber}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-xs text-muted-foreground block font-medium">Customer</span>
                  <span className="font-semibold text-foreground">
                    {selectedCustomer?.name || 'Customer'}
                  </span>
                  <span className="text-xs text-muted-foreground block">{selectedCustomer?.phone}</span>
                </div>

                <div>
                  <span className="text-xs text-muted-foreground block font-medium">Device</span>
                  <span className="font-semibold text-foreground">
                    {selectedDevice?.brand} {selectedDevice?.model || '(Unverified Model)'}
                  </span>
                  <span className="text-xs text-muted-foreground block capitalize">
                    {selectedDevice?.deviceType?.toLowerCase()}
                  </span>
                </div>

                <div>
                  <span className="text-xs text-muted-foreground block font-medium">Status</span>
                  <Badge variant="outline" className="mt-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 font-semibold">
                    {createdRepair.status || 'RECEIVED'}
                  </Badge>
                </div>

                <div>
                  <span className="text-xs text-muted-foreground block font-medium">Assigned Technician</span>
                  <span className="font-medium text-foreground">
                    {assignedTechObj ? assignedTechObj.name : 'Unassigned'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link href={`/repairs/${createdRepair.id}`} className="w-full sm:w-auto">
                <Button className="w-full gap-2">
                  <Wrench className="h-4 w-4" />
                  View Repair Ticket
                </Button>
              </Link>
              <Button
                variant="outline"
                onClick={handleCreateAnother}
                className="w-full sm:w-auto gap-2"
              >
                <Plus className="h-4 w-4" />
                Create Another Repair
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // -------------------------------------------------------------
  // WORKFLOW VIEW (3-Section Progressive Disclosure)
  // -------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Wrench className="h-6 w-6 text-primary" />
            Create Repair Ticket
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Follow the 3-step progressive intake to register a new repair.
          </p>
        </div>

        <Link href="/dashboard">
          <Button variant="ghost" className="h-8 px-3 text-xs gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Cancel & Exit
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: 3 Progressive Disclosure Steps */}
        <div className="lg:col-span-2 space-y-6">
          {/* ======================================================= */}
          {/* STEP ①: CUSTOMER SELECTION */}
          {/* ======================================================= */}
          <Card className={selectedCustomer ? 'border-primary/40 bg-card/60' : 'border-primary shadow-sm'}>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${selectedCustomer
                        ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                        : 'bg-primary text-primary-foreground'
                      }`}
                  >
                    {selectedCustomer ? <CheckCircle2 className="h-5 w-5" /> : '1'}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-foreground">
                      1. Select Customer
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Search existing shop customers or create a new customer
                    </p>
                  </div>
                </div>

                {selectedCustomer && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setSelectedCustomer(null)
                      setSelectedDevice(null)
                      setValue('customerId', '')
                      setValue('deviceId', '')
                    }}
                    className="h-8 text-xs px-2.5 gap-1"
                  >
                    Change
                  </Button>
                )}
              </div>

              {selectedCustomer ? (
                /* Confirmed Customer State */
                <div className="rounded-lg border border-border bg-muted/30 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <UserCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-foreground">
                        {selectedCustomer.name}
                      </h4>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {selectedCustomer.phone}
                        </span>
                        {selectedCustomer.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" /> {selectedCustomer.email}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Active Customer Search & Selection */
                <div className="space-y-4 pt-1">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Input
                        placeholder="Search by customer name, phone, or email address..."
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                        className="pr-10"
                      />
                      {isLoadingCustomers && (
                        <LoaderCircle className="absolute right-3 top-2.5 h-5 w-5 animate-spin text-muted-foreground" />
                      )}
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCustomerDialogOpen(true)}
                      className="gap-2 shrink-0"
                    >
                      <Plus className="h-4 w-4" />
                      Create New Customer
                    </Button>
                  </div>

                  {/* Customer List Dropdown / Quick Select */}
                  <div className="max-h-60 overflow-y-auto rounded-lg border border-border divide-y divide-border">
                    {customersData?.items?.length ? (
                      customersData.items.map((cust) => (
                        <div
                          key={cust.id}
                          onClick={() => handleSelectCustomer(cust)}
                          className="p-3 flex items-center justify-between hover:bg-accent/10 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground">
                              <User className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-foreground">{cust.name}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>{cust.phone}</span>
                                {cust.email && (
                                  <span className="flex items-center gap-1 font-mono text-[11px] bg-muted px-1.5 py-0.5 rounded">
                                    <Mail className="h-3 w-3" />
                                    {cust.email}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      ))
                    ) : (
                      <div className="p-6 text-center text-sm text-muted-foreground">
                        {isLoadingCustomers
                          ? 'Loading customers...'
                          : customerSearch
                            ? 'No customers matching search'
                            : 'No customers found'}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ======================================================= */}
          {/* STEP ②: DEVICE SELECTION */}
          {/* ======================================================= */}
          <Card
            className={
              !selectedCustomer
                ? 'opacity-50 pointer-events-none border-border'
                : selectedDevice
                  ? 'border-primary/40 bg-card/60'
                  : 'border-primary shadow-sm'
            }
          >
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${selectedDevice
                        ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                        : selectedCustomer
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}
                  >
                    {selectedDevice ? <CheckCircle2 className="h-5 w-5" /> : '2'}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-foreground">
                      2. Select Device
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Choose a device registered to {selectedCustomer ? selectedCustomer.name : 'the customer'}
                    </p>
                  </div>
                </div>

                {selectedDevice && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setSelectedDevice(null)
                      setValue('deviceId', '')
                    }}
                    className="h-8 text-xs px-2.5 gap-1"
                  >
                    Change
                  </Button>
                )}
              </div>

              {!selectedCustomer ? (
                <div className="py-4 text-center text-sm text-muted-foreground italic">
                  Complete Step 1 (Customer Selection) to unlock devices.
                </div>
              ) : selectedDevice ? (
                /* Confirmed Device State */
                <div className="rounded-lg border border-border bg-muted/30 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                      <DeviceTypeIcon type={selectedDevice.deviceType} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
                        {selectedDevice.brand} {selectedDevice.model || '(Unverified Model)'}
                        <ConditionBadge condition={selectedDevice.condition} />
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Type: <span className="capitalize">{selectedDevice.deviceType.toLowerCase()}</span>
                        {selectedDevice.serialNumber && ` • S/N: ${selectedDevice.serialNumber}`}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                /* Active Device Selection Cards */
                <div className="space-y-4 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Customer Devices ({devicesData?.items?.length || 0})
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDeviceDialogOpen(true)}
                      className="gap-2 h-8 text-xs px-3"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add New Device
                    </Button>
                  </div>

                  {isLoadingDevices ? (
                    <div className="py-6 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                      <LoaderCircle className="h-4 w-4 animate-spin text-primary" />
                      Loading customer devices...
                    </div>
                  ) : devicesData?.items?.length ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {devicesData.items.map((dev) => (
                        <div
                          key={dev.id}
                          onClick={() => handleSelectDevice(dev)}
                          className="rounded-lg border border-border bg-card p-3.5 hover:border-primary/50 hover:bg-accent/5 cursor-pointer transition-all space-y-2 flex flex-col justify-between"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <DeviceTypeIcon type={dev.deviceType} />
                              <span className="font-semibold text-sm text-foreground">
                                {dev.brand} {dev.model || '(Unverified)'}
                              </span>
                            </div>
                            <ConditionBadge condition={dev.condition} />
                          </div>

                          <div className="text-xs text-muted-foreground space-y-0.5 pt-1 border-t border-border">
                            {dev.serialNumber && (
                              <p className="font-mono">S/N: {dev.serialNumber}</p>
                            )}
                            <p className="text-[11px]">
                              Previous Repairs: {dev.totalRepairs ?? 0}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-border p-6 text-center space-y-3">
                      <p className="text-sm text-muted-foreground">
                        No devices registered for this customer yet.
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setDeviceDialogOpen(true)}
                        className="gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Add New Device
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ======================================================= */}
          {/* STEP ③: REPAIR DETAILS FORM */}
          {/* ======================================================= */}
          <Card
            className={
              !selectedDevice
                ? 'opacity-50 pointer-events-none border-border'
                : 'border-primary shadow-sm'
            }
          >
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${selectedDevice ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                      }`}
                  >
                    3
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-foreground">
                      3. Repair Details & Diagnostics
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Record issue symptoms, initial condition, priority, and technician assignment
                    </p>
                  </div>
                </div>
              </div>

              {!selectedDevice ? (
                <div className="py-4 text-center text-sm text-muted-foreground italic">
                  Complete Step 2 (Device Selection) to unlock repair details form.
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmitTicket)} className="space-y-4 pt-1" noValidate>
                  {/* Problem Description / Complaint */}
                  <div className="space-y-1.5">
                    <Label htmlFor="problemDescription" className="flex items-center justify-between text-sm font-medium">
                      <span>
                        Issue / Problem Description <span className="text-destructive font-bold">*</span>
                      </span>
                    </Label>
                    <Textarea
                      id="problemDescription"
                      placeholder="Describe the complaint reported by the customer (e.g. Screen flickering, phone won't turn on)..."
                      rows={3}
                      {...register('problemDescription')}
                      className={errors.problemDescription ? 'border-destructive' : ''}
                    />
                    {errors.problemDescription && (
                      <p className="text-xs text-destructive flex items-center gap-1 font-medium mt-1">
                        <AlertCircle className="h-3.5 w-3.5" />
                        {errors.problemDescription.message}
                      </p>
                    )}
                  </div>

                  {/* Initial Condition */}
                  <div className="space-y-1.5">
                    <Label htmlFor="initialCondition" className="flex items-center justify-between text-sm font-medium">
                      <span>
                        Initial Physical Condition <span className="text-destructive font-bold">*</span>
                      </span>
                    </Label>
                    <Input
                      id="initialCondition"
                      placeholder="Staff-observed condition at intake (e.g. Scratched screen, cracked back glass, powers on)"
                      {...register('initialCondition')}
                      className={errors.initialCondition ? 'border-destructive' : ''}
                    />
                    {errors.initialCondition && (
                      <p className="text-xs text-destructive flex items-center gap-1 font-medium mt-1">
                        <AlertCircle className="h-3.5 w-3.5" />
                        {errors.initialCondition.message}
                      </p>
                    )}
                  </div>

                  {/* Priority & Estimated Cost */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="priority" className="text-sm font-medium">
                        Priority Level
                      </Label>
                      <select
                        id="priority"
                        {...register('priority')}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        {repairPriorityValues.map((p: RepairPriority) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="estimatedCost" className="text-sm font-medium flex items-center justify-between">
                        <span>Estimated Cost (₹)</span>
                        <span className="text-[11px] text-muted-foreground">Optional</span>
                      </Label>
                      <Input
                        id="estimatedCost"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="e.g. 1500"
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const val = e.target.value ? parseFloat(e.target.value) : undefined
                          setValue('estimatedCost', val)
                        }}
                      />
                      {errors.estimatedCost && (
                        <p className="text-xs text-destructive">{errors.estimatedCost.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Expected Completion Date & Assigned Technician */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="expectedCompletionDate" className="text-sm font-medium flex items-center justify-between">
                        <span>Expected Completion Date</span>
                        <span className="text-[11px] text-muted-foreground">Optional</span>
                      </Label>
                      <Input
                        id="expectedCompletionDate"
                        type="date"
                        {...register('expectedCompletionDate')}
                        className={errors.expectedCompletionDate ? 'border-destructive' : ''}
                      />
                      {errors.expectedCompletionDate && (
                        <p className="text-xs text-destructive">{errors.expectedCompletionDate.message}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="assignedTechnicianId" className="text-sm font-medium flex items-center justify-between">
                        <span>Assigned Technician</span>
                        <span className="text-[11px] text-muted-foreground">Optional</span>
                      </Label>
                      <select
                        id="assignedTechnicianId"
                        {...register('assignedTechnicianId')}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        <option value="">{isLoadingTechs ? 'Loading technicians...' : 'Unassigned (Default)'}</option>
                        {technicians?.map((tech) => (
                          <option key={tech.id} value={tech.id}>
                            {tech.name} ({tech.email})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Initial Internal Note */}
                  <div className="space-y-1.5">
                    <Label htmlFor="initialNote" className="text-sm font-medium flex items-center justify-between">
                      <span>Initial Internal Note</span>
                      <span className="text-[11px] text-muted-foreground">Optional</span>
                    </Label>
                    <Textarea
                      id="initialNote"
                      placeholder="Special customer instructions, passcode, or internal shop notes..."
                      rows={2}
                      {...register('initialNote')}
                    />
                  </div>

                  {/* Mobile CTA Button (visible on small screens) */}
                  <div className="lg:hidden pt-4 border-t border-border">
                    <Button
                      type="submit"
                      disabled={createRepairMutation.isPending}
                      className="w-full gap-2 h-11 text-base font-semibold"
                    >
                      {createRepairMutation.isPending ? (
                        <>
                          <LoaderCircle className="h-5 w-5 animate-spin" />
                          Creating Repair Ticket...
                        </>
                      ) : (
                        <>
                          <Wrench className="h-5 w-5" />
                          Create Repair
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Sticky Summary Panel (Desktop) */}
        <div className="hidden lg:block lg:col-span-1">
          <div className="sticky top-6 space-y-4">
            <Card className="border-border shadow-md">
              <CardContent className="pt-6 space-y-4 text-xs">
                <div className="pb-3 border-b border-border">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Ticket Intake Summary
                  </h4>
                </div>

                {/* Selected Customer */}
                <div className="space-y-1 pb-3 border-b border-border">
                  <span className="text-muted-foreground font-semibold uppercase flex items-center gap-1 text-[11px]">
                    <User className="h-3.5 w-3.5" /> Customer
                  </span>
                  {selectedCustomer ? (
                    <div>
                      <p className="font-bold text-sm text-foreground">{selectedCustomer.name}</p>
                      <p className="text-muted-foreground">{selectedCustomer.phone}</p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground italic">Not selected (Step 1)</p>
                  )}
                </div>

                {/* Selected Device */}
                <div className="space-y-1 pb-3 border-b border-border">
                  <span className="text-muted-foreground font-semibold uppercase flex items-center gap-1 text-[11px]">
                    <Smartphone className="h-3.5 w-3.5" /> Device
                  </span>
                  {selectedDevice ? (
                    <div>
                      <p className="font-bold text-sm text-foreground">
                        {selectedDevice.brand} {selectedDevice.model || '(Unverified)'}
                      </p>
                      <p className="text-muted-foreground capitalize">
                        {selectedDevice.deviceType.toLowerCase()} • {selectedDevice.condition}
                      </p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground italic">Not selected (Step 2)</p>
                  )}
                </div>

                {/* Priority & Technician */}
                <div className="grid grid-cols-2 gap-2 pb-3 border-b border-border">
                  <div>
                    <span className="text-muted-foreground font-semibold uppercase flex items-center gap-1 text-[11px]">
                      Priority
                    </span>
                    <Badge variant="outline" className="mt-1 font-semibold uppercase text-[10px]">
                      {watchPriority || 'MEDIUM'}
                    </Badge>
                  </div>

                  <div>
                    <span className="text-muted-foreground font-semibold uppercase flex items-center gap-1 text-[11px]">
                      <UserCog className="h-3.5 w-3.5" /> Technician
                    </span>
                    <p className="font-medium text-foreground mt-1 truncate">
                      {assignedTechObj ? assignedTechObj.name : 'Unassigned'}
                    </p>
                  </div>
                </div>

                {/* Issue Preview */}
                <div className="space-y-1">
                  <span className="text-muted-foreground font-semibold uppercase text-[11px]">
                    Issue Description
                  </span>
                  <p className="text-foreground line-clamp-3 italic">
                    {watchProblem?.trim() || watchCondition?.trim() || 'Details being entered...'}
                  </p>
                </div>

                {/* Desktop Primary CTA */}
                <div className="pt-2">
                  <Button
                    type="button"
                    onClick={handleSubmit(onSubmitTicket)}
                    disabled={!selectedCustomer || !selectedDevice || createRepairMutation.isPending}
                    className="w-full gap-2 h-11 text-base font-semibold shadow-md"
                  >
                    {createRepairMutation.isPending ? (
                      <>
                        <LoaderCircle className="h-5 w-5 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Wrench className="h-5 w-5" />
                        Create Repair
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* ======================================================= */}
      {/* INLINE MODAL DIALOGS FOR CUSTOMER AND DEVICE CREATION */}
      {/* ======================================================= */}

      {/* 1. Create Customer Modal */}
      <Dialog open={customerDialogOpen} onOpenChange={setCustomerDialogOpen}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
            <User className="h-5 w-5 text-primary" />
            Create New Customer
          </DialogTitle>
          <DialogDescription>
            Add a new customer to your shop directory.
          </DialogDescription>
        </DialogHeader>

        <CustomerForm
          mode="create"
          onSuccess={(createdCust) => {
            setCustomerDialogOpen(false)
            if (createdCust) {
              handleSelectCustomer(createdCust)
            }
          }}
          onCancel={() => setCustomerDialogOpen(false)}
        />
      </Dialog>

      {/* 2. Add Device Modal */}
      <Dialog open={deviceDialogOpen} onOpenChange={setDeviceDialogOpen}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
            <Smartphone className="h-5 w-5 text-primary" />
            Add New Device
          </DialogTitle>
          <DialogDescription>
            Register a device linked to {selectedCustomer?.name || 'customer'}.
          </DialogDescription>
        </DialogHeader>

        {selectedCustomer && (
          <DeviceForm
            mode="create"
            initialCustomer={{
              id: selectedCustomer.id,
              name: selectedCustomer.name,
              phone: selectedCustomer.phone,
              email: selectedCustomer.email,
            }}
            onSuccess={(createdDev) => {
              setDeviceDialogOpen(false)
              if (createdDev) {
                handleSelectDevice(createdDev)
              }
            }}
            onCancel={() => setDeviceDialogOpen(false)}
          />
        )}
      </Dialog>
    </div>
  )
}
