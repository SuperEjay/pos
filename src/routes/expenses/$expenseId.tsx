import { createFileRoute } from '@tanstack/react-router'
import { ExpenseForm } from '@/features/expenses/components/expense-form'
import { useGetExpense } from '@/features/expenses/hooks'

export const Route = createFileRoute('/expenses/$expenseId')({
  component: RouteComponent,
  head: () => ({
    meta: [
      {
        title: 'Deja Bros CMS - Edit Expense',
      },
    ],
  }),
})

function RouteComponent() {
  const { expenseId } = Route.useParams()
  const { data: expense } = useGetExpense(expenseId)

  return <ExpenseForm expense={expense || null} />
}
