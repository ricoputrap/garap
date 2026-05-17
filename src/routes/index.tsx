import { createFileRoute } from '@tanstack/react-router'
import { BoardIndexList } from '@/components/board/board-index-list'

export const Route = createFileRoute('/')({ component: IndexPage })

function IndexPage() {
  return <BoardIndexList />
}
