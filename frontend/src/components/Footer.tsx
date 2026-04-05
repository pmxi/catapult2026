function Footer() {
  return (
    <footer className="w-full py-16 px-12 flex flex-col items-center bg-neutral-900 text-center">
      <div className="text-3xl font-bold font-headline text-primary-mid mb-2">
        VIE
      </div>
      <p className="text-neutral-500 text-sm font-body font-medium">
        &copy; 2025 VIE. No data stored. Ever.
      </p>
      <p className="text-neutral-500/60 text-xs font-body mt-2">
        &ldquo;<a href="https://skfb.ly/oCLrN" className="hover:text-neutral-200 transition-colors" target="_blank" rel="noopener noreferrer">Low Poly Face</a>&rdquo; by ComputerCat is licensed under{' '}
        <a href="http://creativecommons.org/licenses/by/4.0/" className="hover:text-neutral-200 transition-colors" target="_blank" rel="noopener noreferrer">CC BY 4.0</a>.
      </p>
    </footer>
  )
}

export default Footer
