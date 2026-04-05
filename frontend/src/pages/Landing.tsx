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
    <section className="py-24 lg:py-32 px-8 bg-primary-dark">
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
          <p className="text-center text-neutral-200 text-lg mt-6">
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
                    i === current ? 'bg-accent scale-125' : 'bg-white/30'
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
    <main className="overflow-x-hidden bg-neutral-50 text-neutral-900 font-body">
      {/* Hero */}
      <section className="flex flex-col bg-primary px-8 overflow-hidden">
        <div className="min-h-screen flex items-center py-24 lg:py-40">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="space-y-8 text-center lg:text-left order-2 lg:order-1">
              <h1 className="text-5xl lg:text-7xl font-headline font-extrabold leading-[1.1] tracking-tight text-white">
                Make your photos{' '}
                <span className="text-accent">unrecognizable to AI.</span>
              </h1>
              <p className="text-xl text-neutral-200 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                VIE perturbs your photos so facial recognition models can't identify
                you — while the images still look normal to the human eye. Upload a
                photo, get a protected version back in seconds.
              </p>
              <div className="pt-4">
                <Link
                  to="/tool"
                  className="inline-block bg-accent text-white px-10 py-4 rounded-full text-lg font-semibold hover:bg-accent-hover transition-all hover:scale-[1.02] shadow-lg shadow-black/20"
                >
                  Try Now
                </Link>
              </div>
            </div>

            <div className="order-1 lg:order-2 h-[480px] lg:h-[640px]">
              <Suspense fallback={null}>
                <WireframeFace />
              </Suspense>
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto space-y-6 pb-24 lg:pb-40">
          <h2 className="text-4xl lg:text-5xl font-headline font-bold text-white">
            Facial recognition is everywhere.
          </h2>
          <p className="text-lg text-neutral-200 leading-relaxed">
            Anyone can upload a photo of you to a reverse face search engine
            and find where you appear online. It takes seconds, costs nothing,
            and you&rsquo;ll never know it happened.
          </p>
        </div>
      </section>

      {/* Slideshow */}
      <DemoSlideshow />

      {/* Logo Cloud */}
      <section className="pt-24 lg:pt-32 pb-4 lg:pb-6 bg-neutral-50 overflow-hidden">
        <div className="max-w-5xl mx-auto px-8 mb-16">
          <h2 className="text-4xl lg:text-5xl font-headline font-bold">
            Everyone is doing it
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
      <section className="py-16 lg:py-20 px-8 bg-neutral-50">
        <div className="max-w-4xl mx-auto space-y-8">
          <h2 className="text-4xl lg:text-5xl font-headline font-bold text-neutral-900">
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
                  className="text-primary-mid text-5xl hidden sm:block shrink-0"
                />
                <p className="text-xl font-medium text-neutral-900">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What VIE does */}
      <section className="py-24 lg:py-32 px-8 bg-primary text-white">
        <div className="max-w-3xl mx-auto space-y-8">
          <h2 className="text-4xl lg:text-5xl font-headline font-bold">
            So, what can we do?
          </h2>
          <p className="text-lg text-neutral-200 leading-relaxed">
            We built a VQ-VAE/VQ-GAN-style autoencoder that represents photos
            in a compact latent space. Then we perturb that representation
            &mdash; shifting it away from what facial recognition models expect
            &mdash; and reconstruct a plausible image that looks the same to you
            but fools AI.
          </p>
          <ol className="space-y-6 pt-4 text-lg text-neutral-200">
            <li className="flex gap-4">
              <span className="text-accent font-bold font-headline shrink-0">1.</span>
              <span><strong className="text-white">Encode</strong> your image into a compact latent representation.</span>
            </li>
            <li className="flex gap-4">
              <span className="text-accent font-bold font-headline shrink-0">2.</span>
              <span><strong className="text-white">Perturb</strong> the latent, shifting it away from recognizable face embeddings.</span>
            </li>
            <li className="flex gap-4">
              <span className="text-accent font-bold font-headline shrink-0">3.</span>
              <span><strong className="text-white">Reconstruct</strong> an image that looks normal to humans but fools AI.</span>
            </li>
          </ol>
          <div className="pt-8 text-center">
            <Link
              to="/tool"
              className="inline-block bg-accent text-white px-10 py-4 rounded-full text-lg font-semibold hover:bg-accent-hover transition-all hover:scale-[1.02] shadow-lg shadow-black/20"
            >
              Try Now
            </Link>
          </div>
        </div>
      </section>

      {/* Team */}
      <section id="team" className="py-24 px-8 bg-neutral-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl lg:text-5xl font-headline font-bold">
              The Minds Behind VIE
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            {TEAM.map((m) => (
              <div key={m.name} className="space-y-4 group">
                <div className="aspect-square rounded-[1rem] overflow-hidden bg-white shadow-md border-2 border-neutral-200 group-hover:border-accent transition-all">
                  <img
                    className="w-full h-full object-cover"
                    src={m.img}
                    alt={m.name}
                  />
                </div>
                <div className="text-center">
                  <h6 className="font-headline font-bold">{m.name}</h6>
                  <p className="text-xs text-neutral-500">Developer</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Built At */}
      <section className="py-16 bg-white border-t border-neutral-200">
        <div className="max-w-7xl mx-auto px-8 flex flex-col items-center gap-8">
          <p className="text-neutral-500 font-label font-medium uppercase tracking-widest text-xs">
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
