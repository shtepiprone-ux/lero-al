import { LoginFormClient } from '@/modules/auth/components/LoginFormClient'

interface Props {
  searchParams: Promise<{ next?: string }>
}

export default async function LoginPage({ searchParams }: Props) {
  const { next } = await searchParams
  return <LoginFormClient next={next} />
}
