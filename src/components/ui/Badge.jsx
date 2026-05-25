const variants = {
  primary: 'bg-primary-100 text-primary-700',
  secondary: 'bg-gray-100 text-gray-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-700',
  danger: 'bg-red-100 text-red-700',
  info: 'bg-blue-100 text-blue-700',
  purple: 'bg-purple-100 text-purple-700',
}

const sizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-0.5 text-xs',
  lg: 'px-3 py-1 text-sm',
}

function Badge({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  dot = false,
  ...props
}) {
  return (
    <span
      className={`
        inline-flex items-center font-medium rounded-full
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      {...props}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
          variant === 'success' ? 'bg-green-500' :
          variant === 'danger' ? 'bg-red-500' :
          variant === 'warning' ? 'bg-yellow-500' :
          'bg-current'
        }`} />
      )}
      {children}
    </span>
  )
}

export default Badge
