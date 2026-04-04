import { Link } from 'react-router-dom'

function Footer() {
  return (
    <footer className="w-full py-16 px-12 flex flex-col md:flex-row justify-between items-center bg-navy">
      <div className="mb-8 md:mb-0">
        <Link to="/" className="text-3xl font-bold font-headline text-primary-fixed-dim">
          VIE
        </Link>
        <p className="text-slate-400 text-sm mt-2">
          Poison the data before it gets to them.
        </p>
      </div>
      <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-12">
        <div className="flex space-x-8">
          <Link to="/" className="text-slate-400 hover:text-white transition-colors text-sm">
            Home
          </Link>
          <Link to="/upload" className="text-slate-400 hover:text-white transition-colors text-sm">
            Try It
          </Link>
        </div>
        <p className="text-primary-fixed-dim text-sm font-medium">
          No data stored. Ever.
        </p>
      </div>
    </footer>
  )
}

export default Footer
