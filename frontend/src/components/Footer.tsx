function Footer() {
  return (
    <footer className="w-full py-16 px-12 flex flex-col md:flex-row justify-between items-center bg-slate-950 text-white">
      <div className="mb-8 md:mb-0">
        <div className="text-3xl font-bold font-headline text-teal-500 mb-2">
          VIE
        </div>
        <p className="text-slate-400 text-sm font-body font-medium">
          &copy; 2025 VIE. No data stored. Ever.
        </p>
      </div>
      <div className="flex gap-12 text-sm font-body">
        <a
          className="text-slate-400 hover:text-white transition-colors"
          href="#"
        >
          Privacy Policy
        </a>
        <a
          className="text-slate-400 hover:text-white transition-colors"
          href="#"
        >
          Terms of Service
        </a>
        <a
          className="text-slate-400 hover:text-white transition-colors"
          href="#"
        >
          Contact
        </a>
      </div>
    </footer>
  )
}

export default Footer
