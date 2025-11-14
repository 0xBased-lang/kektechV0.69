import * as React from "react"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline'
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variantStyles = {
    default: 'bg-kek-green text-white hover:bg-[#2fa8ad]',
    secondary: 'bg-gray-800 text-gray-300 hover:bg-gray-700',
    destructive: 'bg-red-600 text-white hover:bg-red-700',
    outline: 'border border-gray-700 text-gray-300 hover:bg-gray-800'
  }

  return (
    <div
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 ${variantStyles[variant]} ${className || ''}`}
      {...props}
    />
  )
}

export { Badge }
