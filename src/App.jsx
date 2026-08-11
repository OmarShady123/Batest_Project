import { useEffect, useState, useRef, lazy, Suspense } from 'react'
import { Routes, Route, Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ShieldCheck, MapTrifold, Eye, LockKey, Database, UserCircle, CheckCircle, CaretLeft, CaretRight, X, FloppyDisk, FileLock, ClockCounterClockwise, Buildings, Path, Books, DeviceMobile, House, ArrowRight, Cube, Camera } from '@phosphor-icons/react'
import { Layout, PageHero, SectionTitle } from './components/Layout'
import { motion, AnimatePresence } from 'framer-motion'
import { gsap } from 'gsap'
import { ThreeJSTempleViewer } from './components/ThreeJSTempleViewer'
import { useI18n } from './i18n'
import { Forward } from './components/Forward'

const MatterportViewer = lazy(() => import('./legacy/matterport/MatterportViewer').then(m => ({ default: m.MatterportViewer })))
// Auth Pages & Guards
import Login from './pages/auth/Login'
import Signup from './pages/auth/Signup'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'
import CheckEmail from './pages/auth/CheckEmail'
import VerifyEmail from './pages/auth/VerifyEmail'
import ConfirmEmailChange from './pages/auth/ConfirmEmailChange'
import AccountLayout from './pages/account/AccountLayout'
import UsersManagement from './pages/admin/UsersManagement'

// Route Guards
import { RequireAuth } from './components/auth/RequireAuth'
import { RequireGuest } from './components/auth/RequireGuest'
import { RequireRole } from './components/auth/RequireRole'

import { TourAccessGate } from './components/TourAccessGate'
import apiClient from './services/apiClient'
import { useAuth } from './context/AuthContext'

/** Step numerals rendered in the numeral system matching the active language. */
function stepNumeral(n, isAr) {
  return isAr ? ['١', '٢', '٣', '٤', '٥'][n - 1] : String(n)
}

function Home() {
  const { t } = useI18n()
  const sectionRef = useRef(null)

  const goals = [
    [t('home.goal1Title'), t('home.goal1Text'), <MapTrifold />],
    [t('home.goal2Title'), t('home.goal2Text'), <Eye />],
    [t('home.goal3Title'), t('home.goal3Text'), <ShieldCheck />]
  ]

  useEffect(() => {
    let ctx = gsap.context(() => {
      if (sectionRef.current) {
        gsap.from(sectionRef.current.children, {
          opacity: 0,
          y: 50,
          stagger: 0.2,
          duration: 0.8,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 80%",
          }
        })
      }
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return <>
  <motion.section
    className="home-hero"
    aria-label={t('home.heroAria')}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.8 }}
  >
    <picture>
      <source media="(max-width: 768px)" srcSet="/assets/bastet-hero.png" />
      <img src="/assets/bastet-hero.png" alt={t('home.heroImageAlt')} loading="eager" fetchPriority="high" decoding="async" width="1200" height="630" />
    </picture>
    <div className="home-hero-overlay page-shell"><div className="hero-copy"><motion.span className="kicker light" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>{t('home.heroLabel')}</motion.span><motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.8 }}>{t('home.title1')}<br />{t('home.title2')}</motion.h1><motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>{t('home.subtitle')}</motion.p><motion.div className="actions" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}><Link className="button primary" to="/virtual-tour" aria-label={t('home.startTour')}>{t('home.startTour')} <Forward /></Link><Link className="button secondary light" to="/about" aria-label={t('home.learnMore')}>{t('home.learnMore')}</Link></motion.div></div></div>
  </motion.section>
  <section ref={sectionRef} className="page-shell section" aria-labelledby="home-goals-title"><SectionTitle title={t('home.goalsTitle')} text={t('home.goalsText')} /><div className="goal-grid">{goals.map(([title,d,i],n)=><motion.article key={title} className={`goal goal-${n+1}`} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: n * 0.1 }}><span aria-hidden="true">{i}</span><h3>{title}</h3><p>{d}</p></motion.article>)}</div></section>
  <motion.section className="tour-preview page-shell" aria-labelledby="tour-preview-title" initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}><div><SectionTitle title={t('home.previewTitle')} text={t('home.previewText')} /><Link className="text-link" to="/virtual-tour" aria-label={t('home.previewLink')}>{t('home.previewLink')} <Forward /></Link></div><img src="/assets/temple-plan.png" alt={t('home.previewImageAlt')} loading="lazy" decoding="async" width="800" height="600" /></motion.section>
  </> }

function About() {
  const { t } = useI18n()
  const timeline=[t('about.timeline1'),t('about.timeline2'),t('about.timeline3'),t('about.timeline4')];
  return <>
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
    <PageHero label={t('about.label')} title={t('about.title')} text={t('about.text')} image="/assets/current-condition.png" />
    <motion.section className="page-shell section two-column" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
      <div><SectionTitle title={t('about.importanceTitle')} /><p>{t('about.importanceText')}</p></div>
      <div className="fact-panel"><Buildings size={38}/><h3>{t('about.spatialTitle')}</h3><p>{t('about.spatialText')}</p></div>
    </motion.section>
    <section className="page-shell section"><SectionTitle title={t('about.timelineTitle')} /><div className="timeline">{timeline.map((label,i)=><div key={label}><b>{String(i+1).padStart(2,'0')}</b><h3>{label}</h3></div>)}</div></section>
  </motion.div>
  </> }

function CurrentCondition() {
  const { t } = useI18n()
  const gallery=[
    ['/assets/current-condition.png',t('condition.caption1')],
    ['/assets/temple-plan.png',t('condition.caption2')],
    ['/assets/digital-reconstruction.png',t('condition.caption3')]
  ];
  return <>
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <PageHero label={t('condition.label')} title={t('condition.title')} text={t('condition.text')} image="/assets/current-condition.png"/>
      <motion.section className="page-shell condition-gallery" aria-labelledby="condition-gallery-title" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
        <SectionTitle title={t('condition.galleryTitle')} text={t('condition.galleryText')}/>
        <div>
          {gallery.map(([src,caption],i)=><motion.figure key={caption} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}><img src={src} alt={caption} loading="lazy"/><figcaption>{caption}</figcaption></motion.figure>)}
        </div>
      </motion.section>
      <motion.section className="page-shell section feature-lines" aria-labelledby="feature-lines-title" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
        {[
          [t('condition.feature1Title'),t('condition.feature1Text')],
          [t('condition.feature2Title'),t('condition.feature2Text')],
          [t('condition.feature3Title'),t('condition.feature3Text')]
        ].map(([title,d],i)=><motion.article key={title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}><h3>{title}</h3><p>{d}</p></motion.article>)}
      </motion.section>
    </motion.div>
  </>
}

function Reconstruction() {
  const { t } = useI18n()
  return <>
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <PageHero label={t('reconstruction.label')} title={t('reconstruction.title')} text={t('reconstruction.text')} image="/assets/digital-reconstruction.png"/>
      <motion.section className="page-shell section reconstruction-grid" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
        {[[t('reconstruction.card1Title'),t('reconstruction.card1Text')],[t('reconstruction.card2Title'),t('reconstruction.card2Text')],[t('reconstruction.card3Title'),t('reconstruction.card3Text')]].map(([title,d],i)=><motion.article key={title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}><b>0{i+1}</b><h2>{title}</h2><p>{d}</p></motion.article>)}
      </motion.section>
      <motion.div className="center-action" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.3 }}>
        <Link className="button primary" to="/virtual-tour">{t('reconstruction.goToTour')} <Forward/></Link>
      </motion.div>
    </motion.div>
  </>
}

function VirtualTour() {
  const { t, isAr } = useI18n()
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTour = searchParams.get('tour') || localStorage.getItem('bastet_selected_tour') || 'threejs';
  const validInitialTour = ['threejs', 'matterport'].includes(initialTour) ? initialTour : 'threejs';

  const [tourType, setTourType] = useState(validInitialTour);

  const handleTourChange = (newTour) => {
    setTourType(newTour);
    localStorage.setItem('bastet_selected_tour', newTour);
    setSearchParams(prev => {
      prev.set('tour', newTour);
      return prev;
    }, { replace: true });
  };

  useEffect(() => {
    const tourQuery = searchParams.get('tour');
    if (tourQuery && tourQuery !== tourType) {
      const validTour = (tourQuery === 'matterport' || tourQuery === 'threejs') ? tourQuery : 'threejs';
      setTourType(validTour);
      localStorage.setItem('bastet_selected_tour', validTour);
    }
  }, [searchParams, tourType]);

  const steps3d = [t('tour.step3d1'), t('tour.step3d2'), t('tour.step3d3'), t('tour.step3d4'), t('tour.step3d5')]
  const steps360 = [t('tour.step3601'), t('tour.step3602'), t('tour.step3603'), t('tour.step3604'), t('tour.step3605')]
  const steps = tourType === 'threejs' ? steps3d : steps360

  return <>
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <PageHero label={t('tour.label')} title={t('tour.title')} text={t('tour.text')} />

      <motion.section className="page-shell tour-layout" aria-label={t('tour.mapAria')} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
        <div className="tour-content" style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>

          <div className="tour-switcher" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', backgroundColor: 'var(--paper)', padding: '6px', borderRadius: 'var(--radius)', border: '1px solid var(--line)', width: 'fit-content' }}>
              <button
                onClick={() => handleTourChange('threejs')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: 'calc(var(--radius) - 4px)', border: 'none',
                  backgroundColor: tourType === 'threejs' ? 'var(--accent)' : 'transparent',
                  color: tourType === 'threejs' ? '#000' : 'var(--ink)',
                  fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                <Cube size={20} weight={tourType === 'threejs' ? "fill" : "regular"} />
                {t('tour.switch3d')}
              </button>
              <button
                onClick={() => handleTourChange('matterport')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: 'calc(var(--radius) - 4px)', border: 'none',
                  backgroundColor: tourType === 'matterport' ? 'var(--accent)' : 'transparent',
                  color: tourType === 'matterport' ? '#000' : 'var(--ink)',
                  fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                <Camera size={20} weight={tourType === 'matterport' ? "fill" : "regular"} />
                {t('tour.switch360')}
              </button>
            </div>

            <p style={{ fontSize: '14px', color: 'var(--muted)', margin: 0, paddingInline: '8px' }}>
              {tourType === 'threejs' ? t('tour.desc3d') : t('tour.desc360')}
            </p>
          </div>

          <div className="map-wrap tour-viewer-shell">
            <TourAccessGate>
              {tourType === 'threejs' ? (
                <ThreeJSTempleViewer />
              ) : (
                <Suspense fallback={
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#fff', gap: '12px' }}>
                    <div className="loading-spinner" style={{ width: '40px', height: '40px' }} />
                    <span style={{ color: 'var(--accent)' }}>{t('tour.loading360')}</span>
                  </div>
                }>
                  <MatterportViewer spaceId="SFcW4AeVYWM" />
                </Suspense>
              )}
            </TourAccessGate>
          </div>
        </div>

        <aside className="point-list" aria-label={t('tour.instructionsAria')}>
          <div style={{ backgroundColor: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: '20px', marginBottom: '20px' }}>
            <h3 style={{ margin: '0 0 15px', color: 'var(--accent)', fontSize: '18px', fontWeight: 'bold' }}>
              {tourType === 'threejs' ? t('tour.instructions3dTitle') : t('tour.instructions360Title')}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {steps.map((step, i) => (
                <div key={step} style={{ display: 'flex', gap: '10px', alignItems: 'start' }}>
                  <span style={{ display: 'grid', placeItems: 'center', width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--soft)', color: 'var(--accent)', fontWeight: 'bold', fontSize: '14px', flexShrink: 0 }}>{stepNumeral(i + 1, isAr)}</span>
                  <p style={{ fontSize: '15px', margin: 0, color: 'var(--ink)' }}>{step}</p>
                </div>
              ))}
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: '20px' }}>
            <h3 style={{ margin: '0 0 15px', color: 'var(--accent)', fontSize: '18px', fontWeight: 'bold' }}>{t('tour.historyTitle')}</h3>
            <ul style={{ margin: 0, paddingInlineStart: '20px', paddingInlineEnd: 0, fontSize: '15px', lineHeight: '1.6', color: 'var(--muted)' }}>
              <li>{t('tour.history1')}</li>
              <li style={{ marginTop: '10px' }}>{t('tour.history2')}</li>
              <li style={{ marginTop: '10px' }}>{t('tour.history3')}</li>
            </ul>
            <div style={{ marginTop: '20px' }}>
              <Link className="button primary full" to="/evaluation" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>{t('tour.goToEvaluation')}</Link>
            </div>
          </div>
        </aside>
      </motion.section>
    </motion.div>
  </>
}

function VisitorExperience() {
  const { t } = useI18n()
  const steps=[
    [t('visitor.step1Title'),t('visitor.step1Text')],
    [t('visitor.step2Title'),t('visitor.step2Text')],
    [t('visitor.step3Title'),t('visitor.step3Text')],
    [t('visitor.step4Title'),t('visitor.step4Text')]
  ];
  return <>
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <PageHero label={t('visitor.label')} title={t('visitor.title')} text={t('visitor.text')}/>
      <motion.section className="page-shell section journey" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
        {steps.map(([title,d],i)=><motion.article key={title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}><span>{i+1}</span><Path/><h2>{title}</h2><p>{d}</p></motion.article>)}
      </motion.section>
      <motion.section className="page-shell section benefits" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
        <SectionTitle title={t('visitor.valueTitle')}/>
        <div>
          {[t('visitor.value1'),t('visitor.value2'),t('visitor.value3'),t('visitor.value4')].map((label,i)=><motion.p key={label} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}><CheckCircle/>{label}</motion.p>)}
        </div>
      </motion.section>
    </motion.div>
  </>
}

function Security() {
  const { t } = useI18n()
  const roles=[
    [t('security.role1'),t('security.role1Text'),t('security.role1Access')],
    [t('security.role2'),t('security.role2Text'),t('security.role2Access')]
  ];
  const protections=[
    t('security.protection1'),
    t('security.protection2'),
    t('security.protection3'),
    t('security.protection4'),
    t('security.protection5')
  ];
  const backup=[
    t('security.backup1'),
    t('security.backup2'),
    t('security.backup3'),
    t('security.backup4')
  ];
  return <>
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <PageHero label={t('security.label')} title={t('security.title')} text={t('security.text')}/>
      <motion.section className="page-shell security-layout" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
        <form className="login-mock" onSubmit={e=>e.preventDefault()}>
          <LockKey size={38}/>
          <h2>{t('security.loginMockTitle')}</h2>
          <label>{t('common.email')}<input type="email" placeholder="researcher@example.edu" /></label>
          <label>{t('common.password')}<input type="password" placeholder="••••••••" /></label>
          <label>{t('security.roleLabel')}<select><option>{t('security.role1')}</option><option>{t('security.role2')}</option></select></label>
          <button className="button primary">{t('security.mockLogin')}</button>
          <small>{t('security.mockNote')}</small>
        </form>
        <div className="role-stack">
          <h2>{t('security.rolesTitle')}</h2>
          {roles.map(([title,d,access],i)=><motion.article key={title} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}><UserCircle/><div><b>{title}</b><p>{d}</p></div><span>{access}</span></motion.article>)}
        </div>
      </motion.section>
      <motion.section className="page-shell access-flow" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
        <SectionTitle title={t('security.accessFlowTitle')} text={t('security.accessFlowText')}/>
        <div>
          {roles.map(([role,,access],i)=><motion.article key={role} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}><b>{role}</b><span aria-hidden="true">←</span><strong>{access}</strong><small>0{i+1}</small></motion.article>)}
        </div>
      </motion.section>
      <motion.section className="page-shell protection-layout" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
        <article>
          <FileLock/>
          <h2>{t('security.protectionTitle')}</h2>
          <ul>
            {protections.map((item,i)=><motion.li key={item} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}><CheckCircle/>{item}</motion.li>)}
          </ul>
        </article>
        <article>
          <FloppyDisk/>
          <h2>{t('security.backupTitle')}</h2>
          <ol>
            {backup.map((item,i)=><motion.li key={item} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}><span>{i+1}</span>{item}</motion.li>)}
          </ol>
        </article>
      </motion.section>
      <motion.section className="page-shell section security-cards" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
        {[[<ClockCounterClockwise/>,t('security.changeLogCardTitle'),t('security.changeLogCardText')],[<Database/>,t('security.adminOnlyTitle'),t('security.adminOnlyText')]].map(([icon,title,d],idx)=><motion.article key={title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.1 }}>{icon}<h2>{title}</h2><p>{d}</p></motion.article>)}
      </motion.section>
      <motion.section className="page-shell change-log" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
        <h2>{t('security.changeLogTitle')}</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>{t('security.colAction')}</th><th>{t('security.colUser')}</th><th>{t('security.colDate')}</th><th>{t('security.colType')}</th></tr>
            </thead>
            <tbody>
              <tr><td>{t('security.row1Action')}</td><td>{t('security.adminActor')}</td><td>{t('security.sampleDate')}</td><td>{t('security.row1Type')}</td></tr>
              <tr><td>{t('security.row2Action')}</td><td>{t('security.adminActor')}</td><td>{t('security.sampleDate')}</td><td>{t('security.row2Type')}</td></tr>
              <tr><td>{t('security.row3Action')}</td><td>{t('security.adminActor')}</td><td>{t('security.sampleDate')}</td><td>{t('security.row3Type')}</td></tr>
            </tbody>
          </table>
        </div>
      </motion.section>
    </motion.div>
  </>
}

function Evaluation() {
  const { t } = useI18n()
  const { isAuthenticated } = useAuth();
  const [done,setDone]=useState(false);
  const [error,setError]=useState('');
  const submit=async e=>{
    e.preventDefault();
    if (!isAuthenticated) {
      setError(t('evaluation.mustLogin'));
      return;
    }
    const formData=Object.fromEntries(new FormData(e.currentTarget));
    if(!formData.userType||!formData.usability||!formData.clarity||!formData.tourRating||!formData.understanding){
      setError(t('evaluation.incomplete'));
      return;
    }
    setError('');
    try {
      await apiClient.post('/api/v1/evaluations/', {
        name: formData.name || null,
        user_type: formData.userType,
        usability: parseInt(formData.usability),
        clarity: parseInt(formData.clarity),
        tour_rating: parseInt(formData.tourRating),
        understanding: formData.understanding,
        notes: formData.notes || null,
      });
      setDone(true);
      e.target.reset();
    } catch (err) {
      setError(err.response?.data?.detail || t('evaluation.submitFailed'));
    }
  };
  // Values are persisted to the API, so they stay language-independent;
  // only the visible label follows the active language.
  const understandingOptions = [
    ['yes', t('evaluation.answerYes')],
    ['partly', t('evaluation.answerPartly')],
    ['no', t('evaluation.answerNo')]
  ];
  const userTypeOptions = [
    ['visitor', t('evaluation.typeVisitor')],
    ['student', t('evaluation.typeStudent')],
    ['researcher', t('evaluation.typeResearcher')],
    ['specialist', t('evaluation.typeSpecialist')]
  ];
  return <>
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <PageHero label={t('evaluation.label')} title={t('evaluation.title')} text={t('evaluation.text')}/>
      <motion.section className="page-shell evaluation-wrap" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
        {done&&<motion.div className="success" role="status" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}><CheckCircle/>{t('evaluation.successMessage')}</motion.div>}
        <form className="evaluation-form" onSubmit={submit}>
          <label>{t('common.name')} <small>{t('common.optional')}</small><input name="name" /></label>
          <label>{t('evaluation.userType')}<select name="userType" defaultValue=""><option value="" disabled>{t('evaluation.chooseType')}</option>{userTypeOptions.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
          {[
            ['usability',t('evaluation.usability')],
            ['clarity',t('evaluation.clarity')],
            ['tourRating',t('evaluation.tourRating')]
          ].map(([name,label])=><fieldset key={name}><legend>{t('evaluation.ratePrefix')} {label}</legend><div className="rating">{[1,2,3,4,5].map(n=><label key={n}><input type="radio" name={name} value={n}/><span>{n}</span></label>)}</div></fieldset>)}
          <fieldset><legend>{t('evaluation.understandingQuestion')}</legend><div className="choices">{understandingOptions.map(([value,label])=><label key={value}><input type="radio" name="understanding" value={value}/>{label}</label>)}</div></fieldset>
          <label>{t('evaluation.notes')}<textarea name="notes" rows="5" /></label>
          {error&&<p className="form-error" role="alert">{error}</p>}
          <button className="button primary">{t('evaluation.submit')}</button>
          <small className="privacy-note">{t('evaluation.privacyNote')}</small>
        </form>
      </motion.section>
    </motion.div>
  </>
}

function References() {
  const { t } = useI18n()
  return <>
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <PageHero label={t('references.label')} title={t('references.title')} text={t('references.text')}/>
      <motion.section className="page-shell references-grid" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
        <article>
          <Books/>
          <h2>{t('references.card1Title')}</h2>
          <p>{t('references.card1Text')}</p>
        </article>
        <article>
          <MapTrifold/>
          <h2>{t('references.card2Title')}</h2>
          <p>{t('references.card2Text')}</p>
        </article>
        <article>
          <DeviceMobile/>
          <h2>{t('references.card3Title')}</h2>
          <p>{t('references.card3Text')}</p>
        </article>
      </motion.section>
      <motion.section className="page-shell academic-note" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
        <ShieldCheck/>
        <div>
          <h2>{t('references.noteTitle')}</h2>
          <p>{t('references.noteText')}</p>
        </div>
      </motion.section>
    </motion.div>
  </>
}

function NotFound() {
  const { t } = useI18n()
  const navigate = useNavigate()
  return <>
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <section className="page-shell" style={{minHeight:'60vh',display:'grid',placeItems:'center',textAlign:'center'}}>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <House size={64} style={{color:'var(--accent)',marginBottom:'20px'}}/>
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} style={{fontSize:'clamp(48px,6vw,72px)',marginBottom:'16px'}}>
          {t('notFound.title')}
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} style={{fontSize:'20px',color:'var(--muted)',marginBottom:'32px'}}>
          {t('notFound.text')}
        </motion.p>
        <motion.button initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="button primary" onClick={()=>navigate('/')} style={{display:'inline-flex',alignItems:'center',gap:'8px'}}>
          {t('notFound.backHome')} <Forward/>
        </motion.button>
      </section>
    </motion.div>
  </>
}

function ScrollTop(){
  const {pathname}=useLocation();
  useEffect(()=>{window.scrollTo({top:0,behavior:'instant'})},[pathname]);
  return null
}

export default function App(){
  return <Layout>
    <ScrollTop/>
    <Routes>
      <Route path="/" element={<Home/>}/>
      <Route path="/about" element={<About/>}/>
      <Route path="/current-condition" element={<CurrentCondition/>}/>
      <Route path="/digital-reconstruction" element={<Reconstruction/>}/>
      <Route path="/virtual-tour" element={<VirtualTour/>}/>
      <Route path="/visitor-experience" element={<VisitorExperience/>}/>
      <Route path="/information-security" element={<Security/>}/>
      <Route path="/evaluation" element={<Evaluation/>}/>
      <Route path="/references" element={<References/>}/>

      {/* Guest Auth Routes */}
      <Route path="/login" element={<RequireGuest><Login/></RequireGuest>}/>
      <Route path="/signup" element={<RequireGuest><Signup/></RequireGuest>}/>
      <Route path="/forgot-password" element={<RequireGuest><ForgotPassword/></RequireGuest>}/>
      <Route path="/reset-password" element={<RequireGuest><ResetPassword/></RequireGuest>}/>
      <Route path="/check-email" element={<RequireGuest><CheckEmail/></RequireGuest>}/>
      <Route path="/verify-email" element={<VerifyEmail/>}/>
      <Route path="/confirm-email-change" element={<ConfirmEmailChange/>}/>


      {/* Authenticated User Account Settings */}
      <Route path="/account" element={<RequireAuth><AccountLayout/></RequireAuth>}/>

      {/* Admin Management Routes */}
      <Route path="/admin/users" element={<RequireRole allowedRoles={['admin']}><UsersManagement/></RequireRole>}/>

      <Route path="*" element={<NotFound/>}/>
    </Routes>
  </Layout>
}
