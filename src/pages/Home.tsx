import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  Clock3,
  MapPin,
  MessageCircle,
  Search,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usePageContent } from '../hooks/usePageContent';
import RaffleCampaign from '../components/RaffleCampaign';

const MILLISECONDS_IN_DAY = 1000 * 60 * 60 * 24;
const launchFeeDeadline = new Date('2026-03-08T23:59:59+03:00');
const launchFeeDeadlineLabel = launchFeeDeadline.toLocaleDateString('en-KE', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

const sellerAdvantages = [
  {
    title: 'Buyers find you first',
    copy: 'Early verified sellers get the first conversations and build repeat buyer relationships faster.',
  },
  {
    title: 'Verified badge closes deals',
    copy: 'Identity-verified profiles reduce hesitation and improve trust before pricing discussions start.',
  },
  {
    title: 'Consistency compounds',
    copy: 'Frequent, clear listings keep your profile active while demand grows in your county.',
  },
];

const tradeSteps = [
  {
    title: 'Create account',
    copy: 'Sign up and complete your profile in minutes.',
  },
  {
    title: 'Browse or list',
    copy: 'Post what you are selling or scan active requests and inventory.',
  },
  {
    title: 'Connect and trade',
    copy: 'Chat directly, agree terms, and close deals without middle layers.',
  },
];

const trustFeatures = [
  {
    title: 'Verified traders',
    copy: 'ID and selfie verification for safer and more credible trade.',
    icon: ShieldCheck,
  },
  {
    title: 'Instant messaging',
    copy: 'Real-time buyer and seller chat to move from inquiry to agreement quickly.',
    icon: MessageCircle,
  },
  {
    title: '47 counties covered',
    copy: 'Find supply and demand across Kenya with county-specific discovery.',
    icon: MapPin,
  },
  {
    title: 'Smart search filters',
    copy: 'Filter listings by location, category, and pricing expectations.',
    icon: Search,
  },
  {
    title: 'Launch fee waiver',
    copy: `List at KSh 0 during the early window ending ${launchFeeDeadlineLabel}.`,
    icon: Clock3,
  },
  {
    title: 'Trust-backed growth',
    copy: 'Build your public reputation with transparent profile and listing activity.',
    icon: BadgeCheck,
  },
];

const Home: React.FC = () => {
  const { user } = useAuth();

  const { content: heroHeadline } = usePageContent('home.hero.headline');
  const { content: heroDescription } = usePageContent('home.hero.description');
  const { content: announcementText } = usePageContent('home.announcement.banner');

  const daysLeft = Math.max(
    0,
    Math.ceil((launchFeeDeadline.getTime() - Date.now()) / MILLISECONDS_IN_DAY)
  );
  const launchWindowLabel =
    daysLeft > 0 ? `${daysLeft} day${daysLeft === 1 ? '' : 's'} left at KSh 0` : 'Launch fee window ended';

  const displayHeadline = heroHeadline || 'Become the go-to seller in your county';
  const displayDescription =
    heroDescription ||
    'Join farmers, traders, and agrovets building trusted seller profiles now. Verify once, list for free, and start direct buyer conversations.';
  const displayAnnouncement =
    announcementText || 'In new markets, the first trusted sellers usually capture long-term buyer loyalty.';

  const primaryCtaTo = user ? '/create-listing' : '/login?next=/create-listing';

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@500;700&family=Sora:wght@400;500;600;700&display=swap');
        .home-shell {
          font-family: "Sora", "Segoe UI", "Tahoma", sans-serif;
        }
        .home-title {
          font-family: "Fraunces", "Georgia", serif;
        }
      `}</style>

      <div className="home-shell">
        <section className="relative overflow-hidden border-b border-slate-200 bg-white">
          <div className="pointer-events-none absolute -top-16 left-1/3 h-72 w-72 rounded-full bg-emerald-200/40 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-12 right-0 h-72 w-72 rounded-full bg-amber-200/35 blur-3xl" />

          <div className="relative mx-auto max-w-7xl px-4 pb-12 pt-14 md:pb-16 md:pt-20">
            <div className="max-w-4xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-amber-800">
                <Sparkles className="h-3.5 w-3.5" />
                Launch Fee Alert
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] tracking-[0.12em]">
                  {launchWindowLabel}
                </span>
              </div>

              <h1 className="home-title mt-5 text-4xl leading-tight text-slate-900 md:text-6xl">{displayHeadline}</h1>
              <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-600 md:text-lg">
                {displayDescription}
              </p>
              <p className="mt-3 text-sm font-medium text-slate-500">{displayAnnouncement}</p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link
                  to={primaryCtaTo}
                  className="inline-flex min-h-[46px] items-center justify-center rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-300/40 transition hover:bg-emerald-700"
                >
                  List for Free
                  <span className="ml-1 text-xs text-emerald-100">(takes ~3 mins)</span>
                </Link>
                <Link
                  to="/request"
                  className="inline-flex min-h-[46px] items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
                >
                  Browse Active Demand
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-slate-200 bg-slate-900 px-4 py-4 text-white">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 text-sm font-medium">
            <span className="inline-flex items-center gap-2">
              <BadgeCheck className="h-4 w-4 text-emerald-300" />
              47 counties live
            </span>
            <span className="inline-flex items-center gap-2">
              <BadgeCheck className="h-4 w-4 text-emerald-300" />
              Verified seller profiles
            </span>
            <span className="inline-flex items-center gap-2">
              <BadgeCheck className="h-4 w-4 text-emerald-300" />
              Direct buyer chat
            </span>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-14">
          <div className="grid items-start gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">Why now</p>
              <h2 className="home-title mt-3 text-3xl text-slate-900 md:text-4xl">
                Early sellers on Agrisoko build the strongest edge
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 md:text-base">
                Trust takes time to build. The launch window gives you a head start while listing stays free until{' '}
                {launchFeeDeadlineLabel}.
              </p>
              <Link
                to={primaryCtaTo}
                className="mt-6 inline-flex min-h-[44px] items-center rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                List for Free
              </Link>
            </div>

            <div className="grid gap-4">
              {sellerAdvantages.map((item) => (
                <article key={item.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-base font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">{item.copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-slate-200 bg-white px-4 py-10">
          <div className="mx-auto max-w-7xl">
            <RaffleCampaign />
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-14">
          <div className="mb-7">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">Choose your path</p>
            <h2 className="home-title mt-2 text-3xl text-slate-900 md:text-4xl">Buy or sell with verified confidence</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <article className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
              <p className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-700">
                I&apos;m buying
              </p>
              <h3 className="mt-3 text-2xl font-semibold text-slate-900">Find verified sellers fast</h3>
              <p className="mt-2 text-sm text-slate-600">Compare options and negotiate directly without middle layers.</p>
              <ul className="mt-5 space-y-2 text-sm text-slate-700">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                  Produce and livestock
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                  Inputs and equipment
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                  Verified service providers
                </li>
              </ul>
              <Link
                to="/browse"
                className="mt-6 inline-flex min-h-[44px] items-center rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
              >
                Browse Marketplace
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </article>

            <article className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-7 shadow-sm">
              <p className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-800">
                I&apos;m selling
              </p>
              <h3 className="mt-3 text-2xl font-semibold text-slate-900">Reach buyers already searching</h3>
              <p className="mt-2 text-sm text-slate-600">Build a trusted profile and turn one listing into repeat business.</p>
              <ul className="mt-5 space-y-2 text-sm text-slate-700">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                  Live buyer demand by county
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                  Verification badge advantage
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                  Faster repeat deals
                </li>
              </ul>
              <Link
                to={primaryCtaTo}
                className="mt-6 inline-flex min-h-[44px] items-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                List for Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </article>
          </div>
        </section>

        <section className="border-y border-slate-200 bg-white px-4 py-14">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">How it works</p>
              <h2 className="home-title mt-2 text-3xl text-slate-900 md:text-4xl">
                Three simple steps to trusted trade
              </h2>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {tradeSteps.map((step, index) => (
                <article key={step.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                    {index + 1}
                  </span>
                  <h3 className="mt-3 text-lg font-semibold text-slate-900">{step.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{step.copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-14">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">Why Agrisoko</p>
            <h2 className="home-title mt-2 text-3xl text-slate-900 md:text-4xl">Built to turn trust into transactions</h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {trustFeatures.map((feature) => (
              <article key={feature.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <feature.icon className="h-5 w-5 text-emerald-700" />
                <h3 className="mt-3 text-lg font-semibold text-slate-900">{feature.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{feature.copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-slate-200 bg-white px-4 py-14">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">Top categories</p>
              <h2 className="home-title mt-2 text-3xl text-slate-900 md:text-4xl">What you can find on Agrisoko</h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <article className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
                <h3 className="text-2xl font-semibold text-slate-900">Agricultural produce</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Fresh produce and livestock from trusted sellers in active counties.
                </p>
                <Link
                  to="/browse"
                  className="mt-5 inline-flex items-center text-sm font-semibold text-emerald-700 transition hover:text-emerald-800"
                >
                  Browse produce
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </article>
              <article className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
                <h3 className="text-2xl font-semibold text-slate-900">Agricultural services</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Transport, equipment hire, and technical farm support from verified providers.
                </p>
                <Link
                  to="/browse"
                  className="mt-5 inline-flex items-center text-sm font-semibold text-emerald-700 transition hover:text-emerald-800"
                >
                  Browse services
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </article>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-16 pt-14">
          <div className="rounded-3xl bg-gradient-to-r from-emerald-700 to-teal-700 p-8 text-white shadow-lg md:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-100">Final call</p>
            <h2 className="home-title mt-3 text-3xl md:text-4xl">Ready to launch your first listing?</h2>
            <p className="mt-3 max-w-2xl text-sm text-emerald-100 md:text-base">
              Create your account, complete verification once, and start selling in minutes while launch listing is still free.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                to={primaryCtaTo}
                className="inline-flex min-h-[46px] items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
              >
                List for Free
              </Link>
              <Link
                to="/browse"
                className="inline-flex min-h-[46px] items-center justify-center rounded-xl border border-white/80 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Browse Marketplace
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default Home;
