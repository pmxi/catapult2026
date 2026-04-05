import { Link, useLocation } from 'react-router-dom'

function NavBar() {
  const location = useLocation()
  const isLanding = location.pathname === '/'

  const scrollTo = (id: string) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <nav className={`fixed top-0 w-full z-50 flex justify-between items-center px-8 py-3 backdrop-blur-xl ${
      isLanding
        ? 'bg-primary/80 border-b border-white/10'
        : 'bg-white/90 border-b border-neutral-200'
    }`}>
      <Link to="/" className={`text-2xl font-bold font-headline ${isLanding ? 'text-white' : 'text-primary'}`}>
        VIE
      </Link>
      <div className="hidden md:flex gap-8 items-center font-body">
        {isLanding ? (
          <>
            <button
              onClick={() => scrollTo('how-it-works')}
              className="text-white/80 hover:text-white transition-colors font-medium"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollTo('team')}
              className="text-white/80 hover:text-white transition-colors font-medium"
            >
              The Team
            </button>
          </>
        ) : (
          <>
            <Link
              to="/#how-it-works"
              className="text-neutral-700 hover:text-primary transition-colors font-medium"
            >
              How It Works
            </Link>
            <Link
              to="/#team"
              className="text-neutral-700 hover:text-primary transition-colors font-medium"
            >
              The Team
            </Link>
          </>
        )}
      </div>
      <Link
        to="/tool"
        className="bg-accent text-white px-8 py-2.5 rounded-full font-body font-semibold hover:bg-accent-hover transition-all hover:scale-105 active:scale-95"
      >
        Try It
      </Link>
    </nav>
  )
}

export default NavBar
