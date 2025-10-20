import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <h1 className="text-2xl font-bold text-indigo-600">
              CoogMusic
            </h1>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              <a
                href="#home"
                className="text-gray-900 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Home
              </a>
              <a
                href="#about"
                className="text-gray-500 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                About
              </a>
            </div>
          </div>

          {/* Sign In Button */}
          <div className="hidden md:block">
            <button
              onClick={() => navigate('/home')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Sign In
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-500 hover:text-gray-600 focus:outline-none focus:text-gray-600"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-200">
              <a
                href="#home"
                className="text-gray-900 hover:text-indigo-600 block px-3 py-2 rounded-md text-base font-medium"
              >
                Home
              </a>
              <a
                href="#about"
                className="text-gray-500 hover:text-indigo-600 block px-3 py-2 rounded-md text-base font-medium"
              >
                About
              </a>
              <button
                onClick={() => navigate('/home')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors"
              >
                Sign In
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar
