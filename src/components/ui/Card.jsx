function Card({
  children,
  className = '',
  hover = false,
  padding = true,
  onClick,
  ...props
}) {
  const baseStyles = 'bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden'
  const hoverStyles = hover ? 'transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer' : ''
  const paddingStyles = padding ? 'p-4' : ''

  return (
    <div
      className={`${baseStyles} ${hoverStyles} ${paddingStyles} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  )
}

function CardHeader({ children, className = '' }) {
  return (
    <div className={`mb-4 ${className}`}>
      {children}
    </div>
  )
}

function CardBody({ children, className = '' }) {
  return (
    <div className={className}>
      {children}
    </div>
  )
}

function CardFooter({ children, className = '' }) {
  return (
    <div className={`mt-4 pt-4 border-t border-gray-100 ${className}`}>
      {children}
    </div>
  )
}

Card.Header = CardHeader
Card.Body = CardBody
Card.Footer = CardFooter

export default Card
