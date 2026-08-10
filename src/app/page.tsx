import { redirect } from 'next/navigation'

// Root route: redirect to the store home
export default function RootPage() {
  redirect('/')
}
