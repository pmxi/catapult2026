import { Link } from 'react-router-dom'
import { lazy, Suspense, useState, useEffect, useCallback } from 'react'

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

const DEMO_SLIDES = [
  {
    src: `${BASE}images/step1_find_picture.png`,
    caption: 'Find any photo of someone.',
  },
  {
    src: `${BASE}images/step2_search.png`,
    caption: 'Upload it to a face search engine.',
  },
  {
    src: `${BASE}images/step3_results.png`,
    caption: 'Get back everywhere they appear online.',
  },
]

function DemoSlideshow() {
  const [current, setCurrent] = useState(0)

  const next = useCallback(
    () => setCurrent((c) => (c + 1) % DEMO_SLIDES.length),
    []
  )
  const prev = useCallback(
    () => setCurrent((c) => (c - 1 + DEMO_SLIDES.length) % DEMO_SLIDES.length),
    []
  )

  useEffect(() => {
    const timer = setInterval(next, 7000)
    return () => clearInterval(timer)
  }, [next])

  return (
    <section className="py-24 lg:py-32 px-8 bg-[#1a1c1c]">
      <div className="max-w-4xl mx-auto space-y-12">
        <h2 className="text-4xl lg:text-5xl font-headline font-bold text-white">
          Look how easy it is.
        </h2>
        <div className="relative">
          <div className="overflow-hidden rounded-[1rem] shadow-2xl">
            <img
              src={DEMO_SLIDES[current].src}
              alt={DEMO_SLIDES[current].caption}
              className="w-full object-contain bg-white"
            />
          </div>
          <p className="text-center text-white/80 text-lg mt-6">
            {DEMO_SLIDES[current].caption}
          </p>
          {/* Controls */}
          <div className="flex items-center justify-center gap-6 mt-6">
            <button
              onClick={prev}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center"
            >
              <Icon name="chevron_left" className="text-white text-xl" />
            </button>
            <div className="flex gap-2">
              {DEMO_SLIDES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    i === current ? 'bg-white scale-125' : 'bg-white/30'
                  }`}
                />
              ))}
            </div>
            <button
              onClick={next}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center"
            >
              <Icon name="chevron_right" className="text-white text-xl" />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

function Landing() {
  return (
    <main className="pt-24 overflow-x-hidden bg-background text-on-surface font-body">
      {/* Hero */}
      <section className="min-h-[70vh] flex items-center px-8 py-24 lg:py-40 bg-gradient-to-br from-surface-container-lowest via-surface-container-low to-primary-fixed/20 overflow-hidden">
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
          <div className="order-1 lg:order-2 h-[480px] lg:h-[640px]">
            <Suspense fallback={null}>
              <WireframeFace />
            </Suspense>
          </div>
        </div>
      </section>

      {/* The Problem */}
      <section id="how-it-works" className="py-24 lg:py-32 px-8 bg-surface-container-lowest">
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-4xl lg:text-5xl font-headline font-bold">
            Facial recognition is everywhere.
          </h2>
          <p className="text-lg text-on-surface-variant leading-relaxed">
            Anyone can upload a photo of you to a reverse face search engine
            and find where you appear online. It takes seconds, costs nothing,
            and you&rsquo;ll never know it happened.
          </p>
        </div>
      </section>

      {/* Look How Easy It Is */}
      <DemoSlideshow />

      {/* Logo Cloud */}
      <section className="py-24 lg:py-32 bg-surface-container-lowest overflow-hidden">
        <div className="max-w-5xl mx-auto px-8 mb-16">
          <h2 className="text-4xl lg:text-5xl font-headline font-bold">
            Everyone is doing it.
          </h2>
        </div>
        <div className="relative">
          <div className="flex gap-12 animate-scroll">
            {[
              { src: 'pimeyes.png', alt: 'PimEyes' },
              { src: 'facecheck.png', alt: 'FaceCheck.ID' },
              { src: 'clearview.png', alt: 'Clearview AI' },
              { src: 'sensetime.png', alt: 'SenseTime' },
              { src: 'corsight.png', alt: 'CORSight' },
              { src: 'nec.png', alt: 'NEC' },
              { src: 'persona.png', alt: 'Persona' },
              { src: 'lurq.png', alt: 'LURQ' },
              { src: 'eyematch.png', alt: 'eyematch.ai' },
              { src: 'lenso.png', alt: 'lenso.ai' },
              { src: 'berify.png', alt: 'Berify' },
              { src: 'pimeyes.png', alt: 'PimEyes2' },
              { src: 'facecheck.png', alt: 'FaceCheck.ID2' },
              { src: 'clearview.png', alt: 'Clearview AI2' },
              { src: 'sensetime.png', alt: 'SenseTime2' },
              { src: 'corsight.png', alt: 'CORSight2' },
              { src: 'nec.png', alt: 'NEC2' },
              { src: 'persona.png', alt: 'Persona2' },
              { src: 'lurq.png', alt: 'LURQ2' },
              { src: 'eyematch.png', alt: 'eyematch.ai2' },
              { src: 'lenso.png', alt: 'lenso.ai2' },
              { src: 'berify.png', alt: 'Berify2' },
            ].map((logo) => (
              <img
                key={logo.alt}
                src={`${BASE}images/logos/${logo.src}`}
                alt={logo.alt}
                className="h-12 lg:h-16 object-contain shrink-0"
              />
            ))}
          </div>
        </div>
      </section>

      {/* For every reason */}
      <section className="py-12 lg:py-16 px-8 bg-white">
        <div className="max-w-4xl mx-auto space-y-8">
          <h2 className="text-4xl lg:text-5xl font-headline font-bold">
            ...for any reason.
          </h2>
          <div className="space-y-6">
            {[
              {
                logo: 'pimeyes.png',
                name: 'PimEyes',
                desc: 'Available to anyone who can pay',
              },
              {
                logo: 'clearview.png',
                name: 'Clearview AI',
                desc: 'Built for law enforcement',
              },
              {
                logo: 'sensetime.png',
                name: 'SenseTime',
                desc: 'Deployed for mass surveillance',
              },
            ].map((item) => (
              <div
                key={item.name}
                className="flex items-center gap-8 py-6"
              >
                <img
                  src={`${BASE}images/logos/${item.logo}`}
                  alt={item.name}
                  className="h-14 w-36 object-contain shrink-0"
                />
                <Icon
                  name="arrow_forward"
                  className="text-on-surface/40 text-5xl hidden sm:block shrink-0"
                />
                <p className="text-xl font-medium text-on-surface-variant">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What VIE does */}
      <section className="py-24 lg:py-32 px-8 bg-surface-container-lowest">
        <div className="max-w-3xl mx-auto space-y-8">
          <h2 className="text-4xl lg:text-5xl font-headline font-bold">
            So, what can we do?
          </h2>
          <p className="text-lg text-on-surface-variant leading-relaxed">
            We built a{' '}
            <strong className="text-on-surface">
              VQ-VAE/VQ-GAN-style autoencoder
            </strong>{' '}
            that represents photos in a compact latent space. Then we perturb
            that representation &mdash; shifting it away from what facial
            recognition models expect &mdash; and reconstruct a plausible image
            that looks the same to you but disrupts the mechanism these models
            rely on.
          </p>
          <div className="grid md:grid-cols-3 gap-8 pt-8">
            {[
              {
                icon: 'psychology',
                title: 'Encode',
                desc: 'Compress the image into a latent representation.',
              },
              {
                icon: 'blur_on',
                title: 'Perturb',
                desc: 'Shift the latent away from recognizable face embeddings.',
              },
              {
                icon: 'check_circle',
                title: 'Reconstruct',
                desc: 'Decode back into an image that looks normal but fools AI.',
              },
            ].map((s) => (
              <div
                key={s.title}
                className="text-center space-y-4 p-6 rounded-[1rem] bg-on-primary-container"
              >
                <Icon name={s.icon} className="text-3xl text-primary" />
                <h4 className="font-headline font-bold">{s.title}</h4>
                <p className="text-on-surface-variant text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="pt-8 text-center">
            <Link
              to="/tool"
              className="inline-block bg-primary text-on-primary px-10 py-4 rounded-full text-lg font-semibold hover:scale-[1.02] transition-transform shadow-lg shadow-primary/20"
            >
              Try It Now &rarr;
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
