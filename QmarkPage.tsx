import { Link } from 'react-router-dom'

const POWERPACK_MIX = [
  { count: 5, type: 'Multiple-choice', detail: 'High-yield facts, vocabulary, or foundational concepts with instant feedback.' },
  { count: 3, type: 'Multiple-select', detail: 'Choose every correct symptom, formula, or criterion that applies.' },
  { count: 3, type: 'Fill-in-the-blank', detail: 'Precision-test key terms inside the question stem.' },
  { count: 3, type: 'Matching', detail: 'Link terms to definitions, classifications, or diagram labels.' },
  { count: 2, type: 'Ordering', detail: 'Reorder steps in a process, timeline, or code execution flow.' },
  { count: 2, type: 'Short-answer', detail: 'Exact derivations, numeric results, or recall without hints.' },
  { count: 2, type: 'True / false', detail: 'Lock in foundational rules and core statements quickly.' },
]

const DISCIPLINES = [
  {
    title: 'Medical students & educators',
    text: 'Link a screenshot of an anatomical diagram, radiograph, or pathology slide through the core asset preloader, then run board-style drills with multiple-choice or multiple-select items (for example, selecting every matching symptom).',
  },
  {
    title: 'Law students & legal authors',
    text: 'Attach screenshots of opinions, contracts, or statutory excerpts, then use short-answer and fill-in-the-blank items for exact terminology—or ordering questions for step-by-step procedural workflows.',
  },
  {
    title: 'Engineering professionals & students',
    text: 'Embed schematics, blueprints, or circuit diagrams via image linking and pair them with short-answer numeric items. Compile to HTML slides with crisp SVG-friendly output for problem sets.',
  },
  {
    title: 'Music theorists & educators',
    text: 'Link score snippets or waveform visuals alongside matching and ordering formats to test ear training, chord progressions, or structural analysis.',
  },
  {
    title: 'Graphic artists & design students',
    text: 'Link mockups, typography samples, or layout screenshots and use matching or multiple-choice items for terminology, color theory, and tool workflows—great for portfolio courses and studio critiques.',
  },
  {
    title: 'Mathematicians & statisticians',
    text: 'Link screenshots of proofs or complex figures and use short-answer or fill-in-the-blank items for derivations. Export clean PDF or SVG sets for distribution.',
  },
  {
    title: 'Scientists & researchers',
    text: 'Link lab readings, microscopy, or chart screenshots. Use matching maps for taxonomy or structures and export high-resolution SVG or PNG assets for lab manuals.',
  },
  {
    title: 'Software developers & tech lead trainers',
    text: 'Include architecture diagrams or IDE code blocks, then use fill-in-the-blank or ordering items in YAML to check syntax, trace logic, or verify build steps—ideal for brown bag warm-ups and certification prep.',
  },
]

export function QmarkPage() {
  return (
    <>
      <section className="hero">
        <p className="eyebrow">qmark</p>
        <h1>Master any subject with Qmark.</h1>
        <p className="lede">
          Qmark is for <strong>academe</strong>, <strong>enterprise learning teams</strong>, and{' '}
          <strong>working professionals</strong> who want review to feel like practice—not paperwork.
          Turn slides, textbooks, and notes into self-grading quizzes with seven item types and optional
          images linked through the core asset preloader.
        </p>
        <div className="cta-row">
          <Link className="button primary" to="/qmark/docs/how-to">
            Build your first quiz
          </Link>
          <Link className="button" to="/qmark/docs/tiers">
            Free vs Pro
          </Link>
        </div>
      </section>

      <section className="prose-block">
        <h2>Who is Qmark for?</h2>
        <div className="cards three-up" aria-label="Primary audiences">
          <article className="card">
            <h3>Academe</h3>
            <p>
              <strong>K–12</strong> teachers, <strong>undergraduate</strong> and <strong>graduate</strong>{' '}
              students, and faculty who need chapter quizzes, exam reviews, and lab follow-ups in a format
              students can reuse all term. Section types can stay singular for one unit or vary when a course
              mixes skills.
            </p>
          </article>
          <article className="card">
            <h3>Enterprise</h3>
            <p>
              Learning and development teams that run brown bag sessions, onboarding, and compliance refreshers.
              Publish a short diagnostic before the talk, compile PDF or HTML once, and iterate the YAML after
              each cohort.
            </p>
          </article>
          <article className="card">
            <h3>Professionals</h3>
            <p>
              Specialists preparing for boards, bar exams, certifications, or continuing education—authors who
              already live in docs and repos and want question banks beside their study materials, not locked
              in a slide deck.
            </p>
          </article>
        </div>
      </section>

      <section className="prose-block">
        <h2>Visual and image-based questions</h2>
        <p>
          Anatomy slides, legal excerpts, circuit diagrams, musical scores, and other figure-heavy material
          are first-class: attach a <strong>screenshot or image link</strong> to any question stem with the{' '}
          <strong>core asset preloader</strong> so the prompt and the picture stay together in the deck.
        </p>
      </section>

      <section className="prose-block">
        <h2>Tailored to specialized disciplines</h2>
        <p className="muted">
          The same compose format adapts to how each field teaches and assesses. Examples below show typical
          pairings of image linking and item types—not limits on what you can author.
        </p>
        <div className="cards discipline-grid" aria-label="Discipline examples">
          {DISCIPLINES.map((field) => (
            <article className="card" key={field.title}>
              <h3>{field.title}</h3>
              <p>{field.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="prose-block">
        <h2>The 20-item quiz powerpack (or any size you need)</h2>
        <p>
          A balanced <strong>20-item diagnostic</strong> is a popular starting point—seven interactive types
          in one deck. Qmark does not cap you at twenty: compose <strong>X items</strong> across one section
          or many.           For larger banks (more than 20 items), <strong>QMark Pro</strong> supports scale—branded
          themes, collaboration, timers, org-wide workflows, and <strong>no export watermark</strong>.
        </p>
        <ul className="type-mix" aria-label="Example 20-item mix">
          {POWERPACK_MIX.map((item) => (
            <li key={item.type}>
              <strong>
                {item.count} {item.type}
              </strong>
              <span>{item.detail}</span>
            </li>
          ))}
        </ul>
        <p className="muted">
          Counts above are one suggested powerpack layout. Your compose file can include fewer or more
          questions of any supported type.
        </p>
      </section>

      <section className="cards" aria-label="Why Qmark">
        <article className="card">
          <h2>Study anywhere</h2>
          <p>
            Export PDF, PNG, or SVG for print and desktop review, or HTML slides for the browser. One YAML
            source, several outputs. Free-tier exports include a small{' '}
            <code>silverio-labs/qmark</code> watermark; <strong>QMark Pro</strong> removes it.
          </p>
        </article>
        <article className="card">
          <h2>Powered by code</h2>
          <p>
            Banks live as <code>qmark-compose.yml</code> and <code>*.qmc.yml</code> next to course repos,
            lab notes, and internal docs—reviewable and ready for <code>qmark compile</code>.
          </p>
        </article>
        <article className="card">
          <h2>Goal</h2>
          <p>
            Quizzes should be an enjoyable part of learning. Qmark pairs pedagogy with technology so active
            recall stays quick to update and honest about what you still need to study.
          </p>
        </article>
      </section>
    </>
  )
}
