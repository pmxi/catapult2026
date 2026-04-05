import { Link } from 'react-router-dom'
import { lazy, Suspense } from 'react'

const WireframeFace = lazy(() => import('../components/WireframeFace'))

const BASE = import.meta.env.BASE_URL

const TEAM = [
  { name: 'JongIn Lee', img: `${BASE}images/JongInLee.jpeg` },
  { name: 'Tim', img: `${BASE}images/Tim.jpeg` },
  { name: 'Benjamin', img: `${BASE}images/Benjamin.jpeg` },
  { name: 'Paras', img: `${BASE}images/Paras.jpeg` },
  { name: 'Angela', img: `${BASE}images/Angela.png` },
]

function Icon({ name, className = '' }: { name: string; className?: string }) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}
    >
      {name}
    </span>
  )
}

function Landing() {
  return (
    <main className="pt-24 overflow-x-hidden bg-background text-on-surface font-body">
      {/* Hero */}
      <section className="min-h-[70vh] flex items-center px-8 py-24 lg:py-40 bg-gradient-to-br from-surface-container-lowest via-surface-container-low to-primary-fixed/20 overflow-visible">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Text column */}
          <div className="space-y-8 text-center lg:text-left order-2 lg:order-1">
            <h1 className="text-5xl lg:text-7xl font-headline font-extrabold leading-[1.1] tracking-tight">
              Make your photos{' '}
              <span className="text-primary">unrecognizable to AI.</span>
            </h1>
            <p className="text-xl text-on-surface-variant max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              VIE perturbs your photos so facial recognition models can't identify
              you — while the images still look normal to the human eye. Upload a
              photo, get a protected version back in seconds.
            </p>
            <div className="pt-4">
              <Link
                to="/tool"
                className="inline-block bg-primary text-on-primary px-10 py-4 rounded-full text-lg font-semibold hover:scale-[1.02] transition-transform shadow-lg shadow-primary/20"
              >
                Try It Now &rarr;
              </Link>
            </div>
          </div>

          {/* Wireframe face column */}
          <div className="order-1 lg:order-2 h-[480px] lg:h-[640px] overflow-visible">
            <Suspense fallback={null}>
              <WireframeFace />
            </Suspense>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="py-12 bg-surface-container-lowest border-y border-outline-variant/10">
        <div className="max-w-7xl mx-auto px-8 flex flex-wrap justify-center md:justify-between items-center gap-8 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
          <span className="flex items-center gap-2 font-medium text-sm">
            <Icon name="cloud_off" className="text-sm" /> No data stored
          </span>
          <span className="flex items-center gap-2 font-medium text-sm">
            <Icon name="code" className="text-sm" /> Open source ML
          </span>
          <span className="flex items-center gap-2 font-medium text-sm">
            <Icon name="school" className="text-sm" /> Built at Purdue
          </span>
          <span className="flex items-center gap-2 font-medium text-sm">
            <Icon name="favorite" className="text-sm" /> Free to use
          </span>
        </div>
      </section>

      {/* How It Works — Technical */}
      <section id="how-it-works" className="py-24 lg:py-32 px-8 bg-surface-container-lowest">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 space-y-4">
            <h2 className="text-4xl lg:text-5xl font-headline font-bold">
              How It Works
            </h2>
            <p className="text-on-surface-variant max-w-2xl mx-auto">
              We built a VQ-VAE/VQ-GAN-style autoencoder that protects your
              photos from facial recognition.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-12 text-center">
            {[
              {
                icon: 'psychology',
                title: 'Encode',
                desc: 'Your photo is passed through our autoencoder, which compresses it into a compact latent representation — the same kind of representation facial recognition models rely on.',
              },
              {
                icon: 'blur_on',
                title: 'Perturb',
                desc: 'We apply targeted perturbations in the latent space, shifting the representation away from what face recognition models expect to see.',
              },
              {
                icon: 'check_circle',
                title: 'Reconstruct',
                desc: 'The perturbed latent is decoded back into a full image. It looks like the original to you, but facial recognition models can no longer match it.',
              },
            ].map((s) => (
              <div key={s.title} className="space-y-6">
                <div className="mx-auto w-24 h-24 rounded-2xl bg-on-primary-container flex items-center justify-center shadow-lg">
                  <Icon name={s.icon} className="text-4xl text-primary" />
                </div>
                <h4 className="text-xl font-headline font-bold">{s.title}</h4>
                <p className="text-on-surface-variant text-sm leading-relaxed">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Three Steps */}
      <section className="py-24 lg:py-32 px-8 bg-on-primary-container relative">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl lg:text-5xl font-headline font-bold text-primary mb-20">
            Three Steps. That's It.
          </h2>
          <div className="grid md:grid-cols-3 gap-12 relative">
            {[
              {
                num: '01',
                title: 'Upload',
                desc: 'Drag and drop your photos.',
              },
              {
                num: '02',
                title: 'Process',
                desc: 'We run them through our model.',
              },
              {
                num: '03',
                title: 'Download',
                desc: 'Get your protected photos back in seconds.',
              },
            ].map((s) => (
              <div
                key={s.num}
                className="relative z-10 bg-white p-8 rounded-[1rem] shadow-sm"
              >
                <div className="text-6xl font-headline font-black text-primary/10 mb-4">
                  {s.num}
                </div>
                <h4 className="text-xl font-headline font-bold mb-2">
                  {s.title}
                </h4>
                <p className="text-on-surface-variant">{s.desc}</p>
              </div>
            ))}
            <div className="hidden md:block absolute top-1/2 left-[15%] right-[15%] h-0.5 border-t-2 border-dashed border-primary/20 -z-0" />
          </div>
          <div className="mt-16">
            <Link
              to="/tool"
              className="inline-block bg-primary text-on-primary px-10 py-4 rounded-full text-lg font-semibold hover:scale-[1.02] transition-transform shadow-lg shadow-primary/20"
            >
              Protect My Photos &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* Team */}
      <section id="team" className="py-24 px-8 bg-on-primary-container">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl lg:text-5xl font-headline font-bold text-primary">
              The Minds Behind VIE
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            {TEAM.map((m) => (
              <div key={m.name} className="space-y-4 group">
                <div className="aspect-square rounded-[1rem] overflow-hidden bg-white shadow-sm border-2 border-white group-hover:border-primary transition-all">
                  <img
                    className="w-full h-full object-cover"
                    src={m.img}
                    alt={m.name}
                  />
                </div>
                <div className="text-center">
                  <h6 className="font-headline font-bold">{m.name}</h6>
                  <p className="text-xs text-on-surface-variant">Developer</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Built At */}
      <section className="py-16 bg-surface-container-lowest border-t border-outline-variant/10">
        <div className="max-w-7xl mx-auto px-8 flex flex-col items-center gap-8">
          <p className="text-on-surface-variant font-label font-medium uppercase tracking-widest text-xs">
            Built at
          </p>
          <div className="flex flex-wrap justify-center items-center gap-16">
            <a href="https://purdue.edu" target="_blank" rel="noopener noreferrer">
              <img
                src={`${BASE}images/purdue-logo.svg`}
                alt="Purdue University"
                className="h-12 hover:opacity-80 transition-opacity"
              />
            </a>
            <a href="https://catapulthack.com/" target="_blank" rel="noopener noreferrer">
              <img
                src={`${BASE}images/catapult-logo.svg`}
                alt="Catapult Hackathon"
                className="h-10 brightness-0 hover:opacity-80 transition-opacity"
              />
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}

export default Landing
