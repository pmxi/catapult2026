import { Link } from 'react-router-dom'

function Home() {
  return (
    <main className="pt-20 overflow-x-hidden font-body">
      {/* Hero Section */}
      <section className="min-h-[85vh] flex items-center relative px-8 py-16 lg:py-32 overflow-hidden bg-gradient-to-br from-surface-container-lowest via-surface-container-low to-primary-fixed/20">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center z-10">
          <div className="space-y-8">
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary-fixed text-on-primary-fixed-variant font-label text-sm font-bold tracking-wider uppercase">
              YOUR PRIVACY, PROTECTED
            </span>
            <h1 className="text-5xl lg:text-7xl font-headline font-extrabold text-on-surface leading-[1.1] tracking-tight">
              Your face is already in their database.{' '}
              <span className="text-primary">Take it back.</span>
            </h1>
            <p className="text-xl text-on-surface-variant max-w-xl leading-relaxed">
              VIE imperceptibly tweaks every face in your photo so facial
              recognition systems can't identify anyone — while looking
              completely identical to you.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <Link
                to="/upload"
                className="inline-block bg-primary text-on-primary px-10 py-4 rounded-full text-lg font-semibold hover:scale-[1.02] transition-transform shadow-lg shadow-primary/20"
              >
                Protect My Photo &rarr;
              </Link>
            </div>
          </div>
          <div className="relative hidden lg:block">
            <div className="w-full aspect-square rounded-xl overflow-hidden shadow-2xl bg-gradient-to-br from-primary/10 to-primary-fixed/30 flex items-center justify-center">
              <div className="text-center p-12 space-y-6">
                <span className="material-symbols-outlined text-primary text-8xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  shield
                </span>
                <p className="text-on-surface-variant text-lg font-medium">
                  Invisible protection for every face
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="py-12 bg-surface-container-lowest border-y border-outline-variant/10">
        <div className="max-w-7xl mx-auto px-8 flex flex-wrap justify-center md:justify-between items-center gap-8 opacity-60">
          <span className="flex items-center gap-2 font-medium text-sm">
            <span className="material-symbols-outlined text-sm">cloud_off</span> No data stored
          </span>
          <span className="flex items-center gap-2 font-medium text-sm">
            <span className="material-symbols-outlined text-sm">code</span> Open source ML
          </span>
          <span className="flex items-center gap-2 font-medium text-sm">
            <span className="material-symbols-outlined text-sm">school</span> Built at Purdue
          </span>
          <span className="flex items-center gap-2 font-medium text-sm">
            <span className="material-symbols-outlined text-sm">favorite</span> Free to use
          </span>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="py-24 lg:py-32 px-8 bg-surface-container-lowest">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 space-y-4">
            <h2 className="text-4xl lg:text-5xl font-headline font-bold text-on-surface">
              What VIE Does For You.
            </h2>
            <p className="text-on-surface-variant max-w-2xl mx-auto">
              The only protection that works in real-time across all modern surveillance models.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-10 rounded-[1rem] bg-surface-container-low hover:border-primary/20 border border-transparent transition-all duration-300 flex flex-col h-full group">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-primary text-3xl">face_retouching_off</span>
              </div>
              <h3 className="text-2xl font-headline font-bold mb-4">Protects Every Face</h3>
              <p className="text-on-surface-variant leading-relaxed flex-grow">
                We detect and protect every person in the frame, not just the person uploading.
              </p>
            </div>
            <div className="p-10 rounded-[1rem] bg-surface-container-low hover:border-primary/20 border border-transparent transition-all duration-300 flex flex-col h-full group">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-primary text-3xl">visibility_off</span>
              </div>
              <h3 className="text-2xl font-headline font-bold mb-4">Invisible to Humans</h3>
              <p className="text-on-surface-variant leading-relaxed flex-grow">
                Your photo looks completely identical. To a facial recognition system, no one exists.
              </p>
            </div>
            <div className="p-10 rounded-[1rem] bg-surface-container-low hover:border-primary/20 border border-transparent transition-all duration-300 flex flex-col h-full group">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-primary text-3xl">query_stats</span>
              </div>
              <h3 className="text-2xl font-headline font-bold mb-4">Privacy Score Per Face</h3>
              <p className="text-on-surface-variant leading-relaxed flex-grow">
                After processing, you see exactly how protected each person in your photo is.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 lg:py-32 px-8 bg-on-primary-container relative">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl lg:text-5xl font-headline font-bold text-primary mb-20">
            Privacy in Three Steps.
          </h2>
          <div className="grid md:grid-cols-3 gap-12 relative">
            <div className="relative z-10 bg-white p-8 rounded-[1rem] shadow-sm">
              <div className="text-6xl font-headline font-black text-primary/10 mb-4">01</div>
              <h4 className="text-xl font-bold mb-2">Upload</h4>
              <p className="text-on-surface-variant">
                Drag and drop any JPG or PNG with one or more faces.
              </p>
            </div>
            <div className="relative z-10 bg-white p-8 rounded-[1rem] shadow-sm">
              <div className="text-6xl font-headline font-black text-primary/10 mb-4">02</div>
              <h4 className="text-xl font-bold mb-2">Choose</h4>
              <p className="text-on-surface-variant">
                Protect everyone at once or select specific faces.
              </p>
            </div>
            <div className="relative z-10 bg-white p-8 rounded-[1rem] shadow-sm">
              <div className="text-6xl font-headline font-black text-primary/10 mb-4">03</div>
              <h4 className="text-xl font-bold mb-2">Download</h4>
              <p className="text-on-surface-variant">
                Get back a photo that looks identical — but defeats any recognition system.
              </p>
            </div>
            <div className="hidden md:block absolute top-1/2 left-[15%] right-[15%] h-0.5 border-t-2 border-dashed border-primary/20 -z-0" />
          </div>
        </div>
      </section>

      {/* Stats Band */}
      <section className="py-24 bg-navy text-white">
        <div className="max-w-7xl mx-auto px-8 grid md:grid-cols-3 gap-16 text-center">
          <div className="space-y-2">
            <div className="text-5xl lg:text-6xl font-headline font-bold text-primary-fixed-dim">
              30B+
            </div>
            <p className="text-slate-400 uppercase tracking-widest text-sm">
              faces scraped by Clearview AI alone
            </p>
          </div>
          <div className="space-y-2">
            <div className="text-5xl lg:text-6xl font-headline font-bold text-primary-fixed-dim">
              4,000+
            </div>
            <p className="text-slate-400 uppercase tracking-widest text-sm">
              data brokers operating in the US
            </p>
          </div>
          <div className="space-y-2">
            <div className="text-5xl lg:text-6xl font-headline font-bold text-primary-fixed-dim">
              0
            </div>
            <p className="text-slate-400 uppercase tracking-widest text-sm">
              laws requiring your consent
            </p>
          </div>
        </div>
      </section>

      {/* The Problem Section */}
      <section id="about" className="py-24 lg:py-40 px-8 bg-surface-container-lowest overflow-hidden">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-24 items-center">
          <div className="order-2 lg:order-1 relative">
            <div className="relative rounded-xl overflow-hidden shadow-2xl bg-gradient-to-br from-primary/5 to-primary-fixed/20 aspect-[4/5] flex items-center justify-center">
              <span
                className="material-symbols-outlined text-primary/20"
                style={{ fontSize: '12rem' }}
              >
                fingerprint
              </span>
            </div>
          </div>
          <div className="space-y-8 order-1 lg:order-2">
            <h2 className="text-4xl lg:text-6xl font-headline font-bold text-on-surface leading-tight">
              The Problem Is Bigger Than You Think.
            </h2>
            <div className="space-y-6 text-lg text-on-surface-variant leading-relaxed">
              <p>
                Every photo you post — on Instagram, LinkedIn, or even a local news
                site — is being vacuumed into massive datasets by companies like
                Clearview AI and PimEyes. They build permanent, searchable databases
                that link every photo of a person across every platform, without
                their knowledge or consent.
              </p>
              <p className="font-medium text-primary">
                Over 4,000 data brokers operate in the US. Their databases contain
                over 30 billion faces. There are no federal laws requiring consent.
                Until now, there was nothing you could do about it.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Technical Section */}
      <section className="py-24 px-8 bg-on-primary-container">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl lg:text-5xl font-headline font-bold text-primary mb-4">
              How VIE Works
            </h2>
            <p className="text-on-surface-variant">
              Breaking the link between data and identity.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-12 text-center">
            <div className="space-y-6">
              <div className="mx-auto w-24 h-24 rounded-2xl bg-white flex items-center justify-center shadow-lg">
                <span className="material-symbols-outlined text-4xl text-primary">psychology</span>
              </div>
              <h4 className="text-xl font-bold">Encode</h4>
              <p className="text-on-surface-variant text-sm">
                Your face is compressed into a mathematical representation in latent space.
              </p>
            </div>
            <div className="space-y-6">
              <div className="mx-auto w-24 h-24 rounded-2xl bg-white flex items-center justify-center shadow-lg">
                <span className="material-symbols-outlined text-4xl text-primary">blur_on</span>
              </div>
              <h4 className="text-xl font-bold">Perturb</h4>
              <p className="text-on-surface-variant text-sm">
                An imperceptible adversarial shift is applied — too small for humans
                to see, fatal for recognition systems.
              </p>
            </div>
            <div className="space-y-6">
              <div className="mx-auto w-24 h-24 rounded-2xl bg-white flex items-center justify-center shadow-lg">
                <span className="material-symbols-outlined text-4xl text-primary">check_circle</span>
              </div>
              <h4 className="text-xl font-bold">Reconstruct</h4>
              <p className="text-on-surface-variant text-sm">
                Your image is rebuilt pixel by pixel — identical to you, invisible to machines.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why VIE Is Different */}
      <section className="py-24 lg:py-32 px-8 bg-surface-container-lowest">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-24">
            <div className="space-y-10">
              <h2 className="text-4xl lg:text-5xl font-headline font-bold text-on-surface">
                Why VIE Is Different.
              </h2>
              <p className="text-on-surface-variant text-lg">
                Fawkes proved this concept works in 2020. We built what comes next.
              </p>
              <ul className="space-y-6">
                <li className="flex items-start gap-4">
                  <div className="mt-1 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary text-sm">done</span>
                  </div>
                  <div>
                    <h5 className="font-bold">Every Face, Every Time</h5>
                    <p className="text-on-surface-variant">
                      Protects every face in the frame — not just the person uploading.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="mt-1 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary text-sm">done</span>
                  </div>
                  <div>
                    <h5 className="font-bold">Multi-Model Defense</h5>
                    <p className="text-on-surface-variant">
                      Evaluated against multiple recognition systems simultaneously.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="mt-1 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary text-sm">done</span>
                  </div>
                  <div>
                    <h5 className="font-bold">Live Privacy Score</h5>
                    <p className="text-on-surface-variant">
                      Privacy score per face so you know exactly what you're getting.
                    </p>
                  </div>
                </li>
              </ul>
            </div>
            <div className="bg-surface-container p-8 rounded-[1rem] overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant/30">
                    <th className="py-4 font-bold">Feature</th>
                    <th className="py-4 font-bold text-on-surface-variant">Fawkes</th>
                    <th className="py-4 font-bold text-primary">VIE</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  <tr className="border-b border-outline-variant/10">
                    <td className="py-4 font-medium">Multiple Faces</td>
                    <td className="py-4 text-on-surface-variant">Limited</td>
                    <td className="py-4 text-primary font-bold">Full Support</td>
                  </tr>
                  <tr className="border-b border-outline-variant/10">
                    <td className="py-4 font-medium">Processing Time</td>
                    <td className="py-4 text-on-surface-variant">Minutes</td>
                    <td className="py-4 text-primary font-bold">Seconds</td>
                  </tr>
                  <tr className="border-b border-outline-variant/10">
                    <td className="py-4 font-medium">Image Artifacts</td>
                    <td className="py-4 text-on-surface-variant">Visible</td>
                    <td className="py-4 text-primary font-bold">Imperceptible</td>
                  </tr>
                  <tr>
                    <td className="py-4 font-medium">Cloud Free</td>
                    <td className="py-4 text-on-surface-variant">Yes</td>
                    <td className="py-4 text-primary font-bold">Yes</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section id="team" className="py-24 px-8 bg-on-primary-container">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl lg:text-5xl font-headline font-bold text-primary">
              The Minds Behind VIE
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            {[
              { name: 'Alex Rivera', role: 'ML Lead' },
              { name: 'Maya Chen', role: 'Backend Engineer' },
              { name: 'Julian Grant', role: 'Security Research' },
              { name: 'Sarah Lopez', role: 'Product Design' },
              { name: 'David Kim', role: 'Privacy Advocate' },
            ].map((member) => (
              <div key={member.name} className="space-y-4 group">
                <div className="aspect-square rounded-[1rem] overflow-hidden bg-white shadow-sm border-2 border-white group-hover:border-primary transition-all flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary/30 text-5xl">person</span>
                </div>
                <div className="text-center">
                  <h6 className="font-bold text-on-surface">{member.name}</h6>
                  <p className="text-xs text-on-surface-variant">{member.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Built At */}
      <section className="py-16 bg-surface-container-lowest border-t border-outline-variant/10">
        <div className="max-w-7xl mx-auto px-8 flex flex-col items-center gap-8">
          <p className="text-on-surface-variant font-medium uppercase tracking-widest text-xs">
            Innovation Roots
          </p>
          <div className="flex flex-wrap justify-center items-center gap-16 opacity-60">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-on-surface rounded-full flex items-center justify-center text-white font-bold">
                P
              </div>
              <span className="text-xl font-bold text-on-surface">Purdue University</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary rounded-[0.5rem] flex items-center justify-center text-white font-bold">
                C
              </div>
              <span className="text-xl font-bold text-on-surface">Catapult Hackathon</span>
            </div>
          </div>
          <p className="text-on-surface-variant text-sm">
            Developed at the Catapult ML Hackathon, Spring 2025.
          </p>
        </div>
      </section>
    </main>
  )
}

export default Home
