import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Button, Section, Hr, Link,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Nina Armend'
const SITE_URL = 'https://ninaarmend.co'
const SUPPORT_EMAIL = 'support@ninaarmend.co'

interface ContactFormToCustomerProps {
  name?: string
  message?: string
}

const ContactFormToCustomerEmail = ({ name = '', message = '' }: ContactFormToCustomerProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>We've received your message — {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={logo}>{SITE_NAME}</Text>
        <Hr style={divider} />
        <Heading style={h1}>Thank You, {name || 'there'}</Heading>
        <Text style={text}>
          We've received your inquiry and our concierge team will respond within 24 hours.
        </Text>
        <Section style={card}>
          <Text style={{ ...muted, margin: '0 0 8px 0' }}>Your message:</Text>
          <Text style={{ ...text, margin: '0', fontStyle: 'italic' }}>"{message}"</Text>
        </Section>
        <Text style={muted}>
          If you need immediate assistance, please reach out to <Link href={`mailto:${SUPPORT_EMAIL}`} style={{ color: '#C9A96E', textDecoration: 'none' }}>{SUPPORT_EMAIL}</Link>.
        </Text>
        <Section style={btnCenter}>
          <Button href={`${SITE_URL}/shop`} style={btn}>Continue Shopping</Button>
        </Section>
        <Hr style={footerDivider} />
        <Text style={footer}>© {new Date().getFullYear()} {SITE_NAME}. All rights reserved.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: ContactFormToCustomerEmail,
  subject: "We've received your message",
  displayName: 'Contact form (to customer)',
  previewData: { name: 'Jane', message: 'I have a question about sizing.' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Georgia, serif' }
const container = { maxWidth: '600px', margin: '0 auto', backgroundColor: '#000000', padding: '40px 32px' }
const logo: React.CSSProperties = { fontSize: '36px', color: '#C9A96E', fontWeight: 400, fontFamily: 'Georgia, serif', textAlign: 'center', margin: '0 0 24px 0' }
const divider = { borderColor: '#C9A96E', opacity: 0.4, margin: '0 0 32px 0' }
const h1 = { color: '#FFFFFF', fontSize: '24px', fontWeight: 400, margin: '0 0 16px 0', fontFamily: 'Georgia, serif' }
const text: React.CSSProperties = { color: '#FFFFFF', fontSize: '16px', lineHeight: '1.7', margin: '0 0 16px 0', fontFamily: 'Georgia, serif' }
const muted: React.CSSProperties = { color: '#999999', fontSize: '14px', lineHeight: '1.6', fontFamily: 'Georgia, serif' }
const card: React.CSSProperties = { backgroundColor: '#111111', border: '1px solid #222222', borderRadius: '16px', padding: '24px', margin: '16px 0' }
const btn: React.CSSProperties = { display: 'inline-block', backgroundColor: '#C9A96E', color: '#000000', padding: '16px 40px', borderRadius: '50px', textDecoration: 'none', fontSize: '14px', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', fontFamily: "'Helvetica Neue', Arial, sans-serif" }
const btnCenter: React.CSSProperties = { textAlign: 'center', padding: '24px 0' }
const footerDivider = { borderColor: '#222222', margin: '32px 0 0 0' }
const footer: React.CSSProperties = { color: '#999999', fontSize: '12px', textAlign: 'center', fontFamily: 'Georgia, serif', margin: '16px 0 0 0' }
