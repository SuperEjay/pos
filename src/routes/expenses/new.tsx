import { createFileRoute } from '@tanstack/react-router'
import { ExpenseForm } from '@/features/expenses/components/expense-form'

export const Route = createFileRoute('/expenses/new')({
  component: RouteComponent,
  head: () => ({
    meta: [
      {
        title: 'Deja Bros CMS - New Expense',
      },
    ],
  }),
})

function RouteComponent() {
  return <ExpenseForm />
}

