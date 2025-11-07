import { forwardRef, ButtonHTMLAttributes, AnchorHTMLAttributes } from 'react'
import Link from 'next/link'
import { cva, type VariantProps } from 'class-variance-authority'

// Refined button system - exclusive, clean, professional
const buttonVariants = cva(
  // Base styles - minimal and elegant
  'inline-flex items-center justify-center gap-2 font-fredoka font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#3fb8bd]/30 focus:ring-offset-2 focus:ring-offset-gray-950',
  {
    variants: {
      variant: {
        // Primary: Clean gradient fill - professional and exclusive
        primary:
          'bg-gradient-to-r from-[#3fb8bd] to-[#4ecca7] text-black shadow-md hover:shadow-lg hover:shadow-[#3fb8bd]/20 hover:opacity-90',

        // Secondary: Elegant outline - refined alternative
        secondary:
          'border-2 border-[#3fb8bd]/60 bg-transparent text-[#3fb8bd] hover:border-[#3fb8bd] hover:bg-[#3fb8bd]/5 hover:shadow-md hover:shadow-[#3fb8bd]/10',

        // Ghost: Minimal and subtle
        ghost:
          'bg-transparent text-gray-300 hover:bg-gray-800/30 hover:text-[#3fb8bd]',
      },
      size: {
        sm: 'px-5 py-2.5 text-sm rounded-lg',
        md: 'px-8 py-3 text-base rounded-lg',
        lg: 'px-10 py-3.5 text-base rounded-lg',
      },
      fullWidth: {
        true: 'w-full',
        false: 'w-auto',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
    },
  }
)

// Button Props Types
export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export interface LinkButtonProps
  extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>,
    VariantProps<typeof buttonVariants> {
  href: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  external?: boolean
}

// Standard Button Component - Clean and simple
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      isLoading,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={buttonVariants({ variant, size, fullWidth, className })}
        {...props}
      >
        {isLoading ? (
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        ) : (
          <>
            {leftIcon}
            {children}
            {rightIcon}
          </>
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'

// Link Button Component (for Next.js Link) - Clean implementation
export const LinkButton = forwardRef<HTMLAnchorElement, LinkButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      href,
      leftIcon,
      rightIcon,
      external,
      children,
      ...props
    },
    ref
  ) => {
    const content = (
      <>
        {leftIcon}
        {children}
        {rightIcon}
      </>
    )

    if (external) {
      return (
        <a
          ref={ref}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ variant, size, fullWidth, className })}
          {...props}
        >
          {content}
        </a>
      )
    }

    return (
      <Link
        ref={ref}
        href={href}
        className={buttonVariants({ variant, size, fullWidth, className })}
        {...props}
      >
        {content}
      </Link>
    )
  }
)

LinkButton.displayName = 'LinkButton'

// Icon wrapper for consistent icon sizing
export const ButtonIcon = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center justify-center">{children}</span>
)
