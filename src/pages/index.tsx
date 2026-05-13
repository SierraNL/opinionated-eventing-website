import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.css';

const features = [
  {
    icon: '📦',
    title: 'Outbox-first publishing',
    description:
      'Messages are written to the outbox table atomically with your business data. No direct broker publish path — the transactional guarantee is never optional.',
  },
  {
    icon: '🔀',
    title: 'Type-safe routing',
    description:
      'IEvent fans out to all subscribers. ICommand routes point-to-point to exactly one handler. The compiler and DI container enforce the distinction at startup.',
  },
  {
    icon: '🔄',
    title: 'Saga orchestration',
    description:
      'Stateful orchestrated sagas with timeouts and compensation. Or keep it simple with choreography-style ISagaParticipant for event-driven workflows.',
  },
  {
    icon: '🏗️',
    title: 'DDD aggregate support',
    description:
      'Extend AggregateRoot, call RaiseDomainEvent, and SaveChanges does the rest. The DomainEventInterceptor harvests and outboxes events in one transaction.',
  },
  {
    icon: '☁️',
    title: 'Transport-agnostic',
    description:
      'Swap between Azure Service Bus and RabbitMQ with a single DI registration change. Handler, aggregate, and saga code is identical for both transports.',
  },
  {
    icon: '📡',
    title: 'Aspire-ready & observable',
    description:
      'One-line AppHost extensions for local development. Structured logging, distributed tracing, and metrics via standard .NET OpenTelemetry APIs.',
  },
];

const packages = [
  {name: 'OpinionatedEventing', description: 'Runtime hosting, DI extensions, and messaging context'},
  {name: 'OpinionatedEventing.Abstractions', description: 'Pure contracts — IEvent, ICommand, IPublisher, AggregateRoot'},
  {name: 'OpinionatedEventing.Outbox', description: 'Outbox dispatcher background service'},
  {name: 'OpinionatedEventing.Sagas', description: 'Saga orchestration and choreography engine'},
  {name: 'OpinionatedEventing.EntityFramework', description: 'EF Core outbox store and domain event interceptor'},
  {name: 'OpinionatedEventing.Testing', description: 'In-memory stores and fakes for unit tests'},
  {name: 'OpinionatedEventing.AzureServiceBus', description: 'Azure Service Bus transport'},
  {name: 'OpinionatedEventing.RabbitMQ', description: 'RabbitMQ transport with Aspire service discovery'},
  {name: 'OpinionatedEventing.Aspire.AzureServiceBus', description: 'Aspire AppHost extension for the ASB emulator'},
  {name: 'OpinionatedEventing.Aspire.RabbitMQ', description: 'Aspire AppHost extension for RabbitMQ'},
  {name: 'OpinionatedEventing.OpenTelemetry', description: 'Distributed tracing and metrics instrumentation'},
];

function HeroBanner() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className={styles.heroTitle}>
          {siteConfig.title}
        </Heading>
        <p className={styles.heroSubtitle}>{siteConfig.tagline}</p>
        <div className={styles.heroButtons}>
          <Link className="button button--secondary button--lg" to="/docs/getting-started">
            Get Started
          </Link>
          <Link
            className={clsx('button button--outline button--lg', styles.heroButtonOutline)}
            href="https://github.com/SierraNL/OpinionatedEventing">
            View on GitHub
          </Link>
        </div>
        <div className={styles.heroBadges}>
          <img alt="NuGet" src="https://img.shields.io/nuget/v/OpinionatedEventing?style=flat-square&label=nuget&color=7c3aed" />
          <img alt=".NET" src="https://img.shields.io/badge/.NET-8%20%7C%209%20%7C%2010-7c3aed?style=flat-square" />
          <img alt="License" src="https://img.shields.io/github/license/SierraNL/OpinionatedEventing?style=flat-square&color=7c3aed" />
        </div>
      </div>
    </header>
  );
}

function FeaturesSection() {
  return (
    <section className={styles.featuresSection}>
      <div className="container">
        <Heading as="h2" className={styles.sectionTitle}>
          What it does
        </Heading>
        <div className={styles.featuresGrid}>
          {features.map(({icon, title, description}) => (
            <div key={title} className={styles.featureCard}>
              <div className={styles.featureIcon}>{icon}</div>
              <Heading as="h3" className={styles.featureTitle}>{title}</Heading>
              <p className={styles.featureDescription}>{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PackagesSection() {
  return (
    <section className={styles.packagesSection}>
      <div className="container">
        <Heading as="h2" className={styles.sectionTitle}>
          NuGet packages
        </Heading>
        <p className={styles.sectionSubtitle}>
          Install only what you need. All packages are available on{' '}
          <a href="https://www.nuget.org/packages?q=OpinionatedEventing" target="_blank" rel="noreferrer">
            nuget.org
          </a>
          .
        </p>
        <div className={styles.packagesGrid}>
          {packages.map(({name, description}) => (
            <a
              key={name}
              className={styles.packageCard}
              href={`https://www.nuget.org/packages/${name}`}
              target="_blank"
              rel="noreferrer">
              <code className={styles.packageName}>{name}</code>
              <span className={styles.packageDescription}>{description}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function QuickStartSection() {
  return (
    <section className={styles.quickStartSection}>
      <div className="container">
        <div className={styles.quickStartInner}>
          <Heading as="h2">Ready to get started?</Heading>
          <p>Set up outbox-first event publishing in minutes.</p>
          <div className={styles.heroButtons}>
            <Link className="button button--primary button--lg" to="/docs/getting-started">
              Read the docs
            </Link>
            <Link
              className="button button--secondary button--lg"
              href="https://github.com/SierraNL/OpinionatedEventing/issues">
              Open an issue
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={siteConfig.title}
      description="Opinionated event-driven messaging for .NET — outbox-first, type-safe routing, saga orchestration, and transport-agnostic.">
      <HeroBanner />
      <main>
        <FeaturesSection />
        <PackagesSection />
        <QuickStartSection />
      </main>
    </Layout>
  );
}
