// Local storage utilities for data persistence

export interface Unit {
  id: string
  unitNumber: string
  floor: number
  ownerName: string
  ownerPhone: string
  area: number // square meters
  monthlyFee: number
  status: "occupied" | "vacant" | "rented"
  residents: number
  createdAt: string
}

export interface Bill {
  id: string
  unitId: string
  unitNumber: string
  month: string // YYYY-MM format
  commonFee: number
  waterFee: number
  electricFee: number
  parkingFee: number
  otherFees: number
  total: number
  status: "pending" | "paid" | "overdue"
  dueDate: string
  createdAt: string
}

export interface Payment {
  id: string
  billId: string
  unitNumber: string
  amount: number
  paymentMethod: "cash" | "transfer" | "check" | "credit"
  paymentDate: string
  receiptNumber: string
  note?: string
  createdAt: string
}

export interface Resident {
  id: string
  unitId: string
  name: string
  phone: string
  email?: string
  relationship: "owner" | "tenant" | "family"
  moveInDate: string
}

// Storage keys
const STORAGE_KEYS = {
  UNITS: "condo_units",
  BILLS: "condo_bills",
  PAYMENTS: "condo_payments",
  RESIDENTS: "condo_residents",
}

// Generic storage functions
export function getFromStorage<T>(key: string): T[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(key)
  return data ? JSON.parse(data) : []
}

export function saveToStorage<T>(key: string, data: T[]): void {
  if (typeof window === "undefined") return
  localStorage.setItem(key, JSON.stringify(data))
}

// Units
export function getUnits(): Unit[] {
  return getFromStorage<Unit>(STORAGE_KEYS.UNITS)
}

export function saveUnit(unit: Unit): void {
  const units = getUnits()
  const index = units.findIndex((u) => u.id === unit.id)
  if (index >= 0) {
    units[index] = unit
  } else {
    units.push(unit)
  }
  saveToStorage(STORAGE_KEYS.UNITS, units)
}

export function deleteUnit(id: string): void {
  const units = getUnits().filter((u) => u.id !== id)
  saveToStorage(STORAGE_KEYS.UNITS, units)
}

// Bills
export function getBills(): Bill[] {
  return getFromStorage<Bill>(STORAGE_KEYS.BILLS)
}

export function saveBill(bill: Bill): void {
  const bills = getBills()
  const index = bills.findIndex((b) => b.id === bill.id)
  if (index >= 0) {
    bills[index] = bill
  } else {
    bills.push(bill)
  }
  saveToStorage(STORAGE_KEYS.BILLS, bills)
}

export function deleteBill(id: string): void {
  const bills = getBills().filter((b) => b.id !== id)
  saveToStorage(STORAGE_KEYS.BILLS, bills)
}

// Payments
export function getPayments(): Payment[] {
  return getFromStorage<Payment>(STORAGE_KEYS.PAYMENTS)
}

export function savePayment(payment: Payment): void {
  const payments = getPayments()
  payments.push(payment)
  saveToStorage(STORAGE_KEYS.PAYMENTS, payments)

  // Update bill status
  const bills = getBills()
  const bill = bills.find((b) => b.id === payment.billId)
  if (bill) {
    bill.status = "paid"
    saveBill(bill)
  }
}

// Residents
export function getResidents(): Resident[] {
  return getFromStorage<Resident>(STORAGE_KEYS.RESIDENTS)
}

export function saveResident(resident: Resident): void {
  const residents = getResidents()
  const index = residents.findIndex((r) => r.id === resident.id)
  if (index >= 0) {
    residents[index] = resident
  } else {
    residents.push(resident)
  }
  saveToStorage(STORAGE_KEYS.RESIDENTS, residents)
}

export function deleteResident(id: string): void {
  const residents = getResidents().filter((r) => r.id !== id)
  saveToStorage(STORAGE_KEYS.RESIDENTS, residents)
}

// Initialize with sample data if empty
export function initializeSampleData(): void {
  if (typeof window === "undefined") return

  const units = getUnits()
  if (units.length === 0) {
    const sampleUnits: Unit[] = [
      {
        id: "1",
        unitNumber: "A-301",
        floor: 3,
        ownerName: "สมศักดิ์ ใจดี",
        ownerPhone: "081-234-5678",
        area: 45,
        monthlyFee: 3500,
        status: "occupied",
        residents: 3,
        createdAt: new Date().toISOString(),
      },
      {
        id: "2",
        unitNumber: "B-502",
        floor: 5,
        ownerName: "สมหญิง รักสะอาด",
        ownerPhone: "082-345-6789",
        area: 35,
        monthlyFee: 2800,
        status: "occupied",
        residents: 2,
        createdAt: new Date().toISOString(),
      },
      {
        id: "3",
        unitNumber: "C-204",
        floor: 2,
        ownerName: "วิชัย มั่งมี",
        ownerPhone: "083-456-7890",
        area: 50,
        monthlyFee: 4200,
        status: "occupied",
        residents: 4,
        createdAt: new Date().toISOString(),
      },
      {
        id: "4",
        unitNumber: "A-105",
        floor: 1,
        ownerName: "สุดา เรืองศรี",
        ownerPhone: "084-567-8901",
        area: 40,
        monthlyFee: 3200,
        status: "rented",
        residents: 2,
        createdAt: new Date().toISOString(),
      },
    ]
    saveToStorage(STORAGE_KEYS.UNITS, sampleUnits)

    // Create sample bills
    const sampleBills: Bill[] = [
      {
        id: "1",
        unitId: "1",
        unitNumber: "A-301",
        month: "2024-10",
        commonFee: 3500,
        waterFee: 0,
        electricFee: 0,
        parkingFee: 0,
        otherFees: 0,
        total: 3500,
        status: "paid",
        dueDate: "2024-10-05",
        createdAt: "2024-10-01T14:30:00Z",
      },
      {
        id: "2",
        unitId: "2",
        unitNumber: "B-502",
        month: "2024-10",
        commonFee: 2800,
        waterFee: 0,
        electricFee: 0,
        parkingFee: 0,
        otherFees: 0,
        total: 450,
        status: "paid",
        dueDate: "2024-10-05",
        createdAt: "2024-10-01T11:20:00Z",
      },
      {
        id: "3",
        unitId: "3",
        unitNumber: "C-204",
        month: "2024-10",
        commonFee: 4200,
        waterFee: 0,
        electricFee: 0,
        parkingFee: 0,
        otherFees: 0,
        total: 4200,
        status: "overdue",
        dueDate: "2024-10-05",
        createdAt: "2024-10-01T09:00:00Z",
      },
      {
        id: "4",
        unitId: "4",
        unitNumber: "A-105",
        month: "2024-10",
        commonFee: 3200,
        waterFee: 0,
        electricFee: 0,
        parkingFee: 0,
        otherFees: 0,
        total: 1800,
        status: "pending",
        dueDate: "2024-10-05",
        createdAt: "2024-10-01T08:00:00Z",
      },
    ]
    saveToStorage(STORAGE_KEYS.BILLS, sampleBills)

    // Create sample payments
    const samplePayments: Payment[] = [
      {
        id: "1",
        billId: "1",
        unitNumber: "A-301",
        amount: 3500,
        paymentMethod: "transfer",
        paymentDate: "2024-10-03",
        receiptNumber: "RC-001",
        createdAt: "2024-10-03T14:30:00Z",
      },
      {
        id: "2",
        billId: "2",
        unitNumber: "B-502",
        amount: 450,
        paymentMethod: "cash",
        paymentDate: "2024-10-04",
        receiptNumber: "RC-002",
        createdAt: "2024-10-04T11:20:00Z",
      },
    ]
    saveToStorage(STORAGE_KEYS.PAYMENTS, samplePayments)
  }
}
