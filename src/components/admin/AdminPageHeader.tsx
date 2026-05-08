interface Props {
  title: string
  subtitle?: string
  action?: React.ReactNode
}

export function AdminPageHeader({ title, subtitle, action }: Props) {
  return (
    <div className="admin-page-header flex items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
