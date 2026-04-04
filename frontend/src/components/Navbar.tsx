import { Link, useLocation } from 'react-router-dom'

function Navbar() {
  const location = useLocation()
  const isHome = location.pathname === '/'

  const scrollTo = (id: string) => {
    if (!isHome) return
    const el = document.getElementById(id)
    el?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <nav className="fixed top-0 w-full z-50 flex justify-between items-center px-8 py-4 bg-white/80 backdrop-blur-xl shadow-sm">
      <Link to="/" className="text-2xl font-bold font-headline text-primary">
        VIE
      </Link>
      <div className="hidden md:flex items-center space-x-8">
        {isHome ? (
          <>
            <button
              onClick={() => scrollTo('how-it-works')}
              className="text-secondary hover:text-primary transition-colors font-body"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollTo('about')}
              className="text-secondary hover:text-primary transition-colors font-body"
            >
              About
            </button>
            <button
              onClick={() => scrollTo('team')}
              className="text-secondary hover:text-primary transition-colors font-body"
            >
              The Team
            </button>
          </>
        ) : (
          <>
            <Link
              to="/"
              className="text-secondary hover:text-primary transition-colors font-body"
            >
              Home
            </Link>
          </>
        )}
        <Link
          to="/upload"
          className="bg-primary text-on-primary px-8 py-2.5 rounded-full font-body font-medium hover:opacity-90 hover:scale-105 transition-all"
        >
          Try It &rarr;
        </Link>
      </div>
    </nav>
  )
}

export default Navbar
