const sizes = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
}

function Spinner({ size = 'md', className = '', light = false }) {
  return (
    <svg
      className={`animate-spin ${sizes[size]} ${className}`}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className={light ? 'opacity-25' : 'opacity-25'}
        cx="12"
        cy="12"
        r="10"
        stroke={light ? 'white' : 'currentColor'}
        strokeWidth="4"
      />
      <path
        className={light ? 'opacity-75' : 'opacity-75'}
        fill={light ? 'white' : 'currentColor'}
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}

// Full page loading spinner
function LoadingPage({ message = 'Loading...' }) {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center">
      <Spinner size="xl" className="text-primary-500" />
      <p className="mt-4 text-gray-500">{message}</p>
    </div>
  )
}

Spinner.Page = LoadingPage

export default Spinner
