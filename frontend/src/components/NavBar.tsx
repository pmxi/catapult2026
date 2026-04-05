import { Link, useLocation } from 'react-router-dom'

function NavBar() {
  const location = useLocation()
  const isLanding = location.pathname === '/'

  const scrollTo = (id: string) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <nav className="fixed top-0 w-full z-50 flex justify-between items-center px-8 py-4 bg-white/80 backdrop-blur-xl shadow-sm">
      <Link to="/" className="text-2xl font-bold font-headline text-teal-800">
        VIE
      </Link>
      <div className="hidden md:flex gap-8 items-center font-body">
        {isLanding ? (
          <>
            <button
              onClick={() => scrollTo('how-it-works')}
              className="text-slate-600 hover:text-teal-700 transition-colors"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollTo('team')}
              className="text-slate-600 hover:text-teal-700 transition-colors"
            >
              The Team
            </button>
          </>
        ) : (
          <>
            <Link
              to="/#how-it-works"
              className="text-slate-600 hover:text-teal-700 transition-colors"
            >
              How It Works
            </Link>
            <Link
              to="/#team"
              className="text-slate-600 hover:text-teal-700 transition-colors"
            >
              The Team
            </Link>
          </>
        )}
      </div>
      <Link
        to="/tool"
        className="bg-primary text-on-primary px-8 py-2.5 rounded-full font-body font-medium hover:opacity-80 transition-all hover:scale-105 active:scale-95"
      >
        Try It &rarr;
      </Link>
    </nav>
  )
}

export default NavBar
