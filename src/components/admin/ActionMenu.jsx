import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'

function ActionMenu({ items, position = 'bottom' }) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef(null)
  const buttonRef = useRef(null)
  const [dropdownPosition, setDropdownPosition] = useState(position)

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      const menuHeight = 150

      if (spaceBelow < menuHeight && rect.top > menuHeight) {
        setDropdownPosition('top')
      } else {
        setDropdownPosition('bottom')
      }
    }
  }, [isOpen])

  const handleClick = (e) => {
    e.stopPropagation()
    setIsOpen(!isOpen)
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        ref={buttonRef}
        onClick={handleClick}
        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>

      {isOpen && (
        <div className={`absolute right-0 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 ${
          dropdownPosition === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'
        }`}>
          {items.map((item, index) => {
            if (item.type === 'link') {
              return (
                <Link
                  key={index}
                  to={item.to}
                  className={`flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${item.className || 'text-gray-700'}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsOpen(false)
                  }}
                >
                  {item.icon && <span className="w-4 h-4">{item.icon}</span>}
                  {item.label}
                </Link>
              )
            }
            return (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation()
                  setIsOpen(false)
                  item.onClick()
                }}
                className={`flex items-center gap-2 w-full px-4 py-2 text-sm text-left hover:bg-gray-50 transition-colors ${item.className || 'text-gray-700'}`}
              >
                {item.icon && <span className="w-4 h-4">{item.icon}</span>}
                {item.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default ActionMenu
