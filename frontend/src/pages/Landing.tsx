import { Link } from 'react-router-dom'

const HERO_IMG =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDg8tSaA0cB4U0IT-DVCMVX6JsTueRftKCxm8WVR-gKEAN0vNAqqfU_EHddDRzXg6mhUs3-L_4Li-E8iow-S4s3VieF0U5N8zyiLIoZvHtDnERWAlIh0xuFSHvRxGX3SxFosin0uq6jmP8ib_AmU5FKFXBnSFIWoiEoQ__RD0SLp7zFHFiYlIolfrZxbTJihNWfkyRjZfik3BUFytqS5iUQYuAPm9WCu-CCiifSTOzIFmBNCqpEEVi3pmnsxVM-ouC_EXn2vVwewVg'

const PROBLEM_IMG =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDjt2bGwhaYzTib7XY2QmBwaRSWL_PODqv1v4130ffueXGrpyeUzo-I_slCICxQM7p69eTzUKzn2btDqNobenK1Jvw9yaZbb8qM68rbQtdaXkCV0Mftd3Po6Y6MOdsdIROFRBDNif4-HgU8Phl2r5R6JlqrZ9fZfpuTRZWOFioakt05MbKX-Ovu7T_nIeLKPB_CFELJVwJ9u5m4mc8fZAR2C-e9CzRA88t_rYTT_XF8So74Z-tszU1koKR3VBcin8Pm73SJ3jqhhAE'

const TEAM = [
  { name: 'JongIn Lee', img: '/images/JongInLee.jpeg' },
  { name: 'Tim', img: '/images/Tim.jpeg' },
  { name: 'Benjamin', img: '/images/Benjamin.jpeg' },
  { name: 'Paras', img: '/images/Paras.jpeg' },
  { name: 'Angela', img: '/images/Angela.png' },
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

function IconFilled({
  name,
  className = '',
}: {
  name: string
  className?: string
}) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={{ fontVariationSettings: "'FILL' 1, 'wght' 400" }}
    >
      {name}
    </span>
  )
}

function Landing() {
  return (
    <main className="pt-24 overflow-x-hidden bg-background text-on-surface font-body">
      {/* Hero */}
      <section className="min-h-[870px] flex items-center relative px-8 py-16 lg:py-32 overflow-hidden bg-gradient-to-br from-surface-container-lowest via-surface-container-low to-primary-fixed/20">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center z-10">
          <div className="space-y-8">
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary-fixed text-on-primary-fixed-variant font-label text-sm font-bold tracking-wider uppercase">
              YOUR PRIVACY, PROTECTED
            </span>
            <h1 className="text-5xl lg:text-7xl font-headline font-extrabold leading-[1.1] tracking-tight">
              Your face is already in their database.{' '}
              <span className="text-primary">Take it back.</span>
            </h1>
            <p className="text-xl text-on-surface-variant max-w-xl leading-relaxed">
              VIE uses advanced adversarial machine learning to protect your
              digital identity. We make your photos invisible to facial
              recognition AI while keeping them perfectly clear to your friends.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <Link
                to="/tool"
                className="bg-primary text-on-primary px-10 py-4 rounded-full text-lg font-semibold hover:scale-[1.02] transition-transform shadow-lg shadow-primary/20"
              >
                Protect My Photo &rarr;
              </Link>
            </div>
          </div>
          <div className="relative">
            <div className="w-full aspect-square rounded-xl overflow-hidden shadow-2xl relative group">
              <img
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                src={HERO_IMG}
                alt="Friends looking at a smartphone together"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/40 to-transparent" />
              <div className="absolute bottom-8 left-8 right-8 bg-white/70 backdrop-blur-xl p-6 rounded-[1rem] border border-white/20">
                <div className="flex items-center gap-3">
                  <IconFilled
                    name="verified_user"
                    className="text-primary"
                  />
                  <span className="font-medium">
                    Privacy perturbation active
                  </span>
                </div>
              </div>
            </div>
            <div className="absolute -top-6 -right-6 w-32 h-32 bg-tertiary-fixed rounded-[1rem] -z-10 opacity-50 blur-2xl" />
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

      {/* Feature Cards */}
      <section className="py-24 lg:py-32 px-8 bg-surface-container-lowest">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 space-y-4">
            <h2 className="text-4xl lg:text-5xl font-headline font-bold">
              What VIE Does For You.
            </h2>
            <p className="text-on-surface-variant max-w-2xl mx-auto">
              The only protection that works in real-time across all modern
              surveillance models.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: 'face_retouching_off',
                title: 'Protects Every Face',
                desc: 'Automatically detects and encodes every face in your group photos, ensuring total collective privacy.',
              },
              {
                icon: 'visibility_off',
                title: 'Invisible to Humans',
                desc: 'Our proprietary perturbations are mathematically optimized to be imperceptible to the human eye.',
              },
              {
                icon: 'query_stats',
                title: 'Privacy Score Per Face',
                desc: 'Real-time metrics showing how difficult it is for multiple AI models to recognize you.',
              },
            ].map((f) => (
              <div
                key={f.title}
                className="p-10 rounded-[1rem] bg-surface-container-low border border-transparent hover:border-primary/20 transition-all duration-300 flex flex-col h-full group"
              >
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                  <Icon name={f.icon} className="text-primary text-3xl" />
                </div>
                <h3 className="text-2xl font-headline font-bold mb-4">
                  {f.title}
                </h3>
                <p className="text-on-surface-variant leading-relaxed flex-grow">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section
        id="how-it-works"
        className="py-24 lg:py-32 px-8 bg-on-primary-container relative"
      >
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl lg:text-5xl font-headline font-bold text-primary mb-20">
            Privacy in Three Steps.
          </h2>
          <div className="grid md:grid-cols-3 gap-12 relative">
            {[
              { num: '01', title: 'Upload', desc: 'Drag and drop your favorite high-res photos.' },
              { num: '02', title: 'Choose', desc: 'Select the level of protection you need.' },
              { num: '03', title: 'Download', desc: 'Get your protected file in seconds.' },
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
        </div>
      </section>

      {/* Stats Band */}
      <section className="py-24 bg-[#111827] text-white">
        <div className="max-w-7xl mx-auto px-8 grid md:grid-cols-3 gap-16 text-center">
          {[
            { val: '30B+', label: 'faces scraped by AI' },
            { val: '4,000+', label: 'active data brokers' },
            { val: '0', label: 'laws requiring consent' },
          ].map((s) => (
            <div key={s.label} className="space-y-2">
              <div className="text-5xl lg:text-6xl font-headline font-bold text-primary-fixed">
                {s.val}
              </div>
              <p className="text-slate-400 font-label uppercase tracking-widest text-sm">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Problem Section */}
      <section
        id="about"
        className="py-24 lg:py-40 px-8 bg-surface-container-lowest overflow-hidden"
      >
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-24 items-center">
          <div className="order-2 lg:order-1 relative">
            <div className="relative rounded-xl overflow-hidden shadow-2xl">
              <img
                className="w-full aspect-[4/5] object-cover"
                src={PROBLEM_IMG}
                alt="Person behind glass, atmospheric lighting"
              />
              <div className="absolute inset-0 bg-primary/10 mix-blend-multiply" />
            </div>
          </div>
          <div className="space-y-8 order-1 lg:order-2">
            <h2 className="text-4xl lg:text-6xl font-headline font-bold leading-tight">
              The Problem Is Bigger Than You Think.
            </h2>
            <div className="space-y-6 text-lg text-on-surface-variant leading-relaxed">
              <p>
                Every photo you post&mdash;on Instagram, LinkedIn, or even a
                local news site&mdash;is being vacuumed into massive datasets by
                companies like Clearview AI and PimEyes.
              </p>
              <p className="font-medium text-primary">
                They don&rsquo;t ask for permission. They don&rsquo;t offer an
                opt-out. They build a permanent, searchable visual fingerprint
                of your life.
              </p>
              <p>
                VIE was born to give you the only weapon that works:
                mathematical certainty that an AI cannot &ldquo;see&rdquo; who
                you are, even if they have the photo.
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
            {[
              {
                icon: 'psychology',
                title: 'Encode',
                desc: 'We extract the feature vector that AI uses to identify you.',
              },
              {
                icon: 'blur_on',
                title: 'Perturb',
                desc: 'We shift that vector into "adversarial space" using our proprietary model.',
              },
              {
                icon: 'check_circle',
                title: 'Reconstruct',
                desc: 'We rebuild the image so it looks identical to you, but gibberish to AI.',
              },
            ].map((s) => (
              <div key={s.title} className="space-y-6">
                <div className="mx-auto w-24 h-24 rounded-2xl bg-white flex items-center justify-center shadow-lg">
                  <Icon name={s.icon} className="text-4xl text-primary" />
                </div>
                <h4 className="text-xl font-headline font-bold">{s.title}</h4>
                <p className="text-on-surface-variant text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why VIE Is Different */}
      <section className="py-24 lg:py-32 px-8 bg-surface-container-lowest">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-24">
            <div className="space-y-10">
              <h2 className="text-4xl lg:text-5xl font-headline font-bold">
                Why VIE Is Different.
              </h2>
              <ul className="space-y-6">
                {[
                  {
                    title: 'Every Face, Every Time',
                    desc: "Don't just protect yourself; protect the whole family in one click.",
                  },
                  {
                    title: 'Multi-Model Defense',
                    desc: "We don't target one specific AI; we perturb against generalized latent structures.",
                  },
                  {
                    title: 'Live Privacy Score',
                    desc: 'Know exactly how safe your photo is before you ever click upload.',
                  },
                ].map((item) => (
                  <li key={item.title} className="flex items-start gap-4">
                    <div className="mt-1 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon name="done" className="text-primary text-sm" />
                    </div>
                    <div>
                      <h5 className="font-bold">{item.title}</h5>
                      <p className="text-on-surface-variant">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-surface-container p-8 rounded-[1rem] overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant/30">
                    <th className="py-4 font-bold">Feature</th>
                    <th className="py-4 font-bold text-on-surface-variant">
                      Fawkes
                    </th>
                    <th className="py-4 font-bold text-primary">VIE</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {[
                    ['Multiple Faces', 'Limited', 'Full Support'],
                    ['Processing Time', 'Minutes', 'Seconds'],
                    ['Image Artifacts', 'Visible', 'Imperceptible'],
                    ['Cloud Free', 'Yes', 'Yes'],
                  ].map(([feature, fawkes, vie], i) => (
                    <tr
                      key={feature}
                      className={
                        i < 3 ? 'border-b border-outline-variant/10' : ''
                      }
                    >
                      <td className="py-4 font-medium">{feature}</td>
                      <td className="py-4 text-on-surface-variant">{fawkes}</td>
                      <td className="py-4 text-primary font-bold">{vie}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
            Innovation Roots
          </p>
          <div className="flex flex-wrap justify-center items-center gap-16 grayscale opacity-50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-on-surface rounded-full flex items-center justify-center text-white font-headline font-bold">
                P
              </div>
              <span className="text-xl font-headline font-bold">
                Purdue University
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary rounded-[1rem] flex items-center justify-center text-white font-headline font-bold">
                C
              </div>
              <span className="text-xl font-headline font-bold">
                Catapult Hackathon
              </span>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default Landing
