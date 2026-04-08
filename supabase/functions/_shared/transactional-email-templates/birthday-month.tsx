import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Button, Section, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Nina Armend'
const SITE_URL = 'https://ninaarmend.co'

interface BirthdayMonthProps {
  name?: string
}

const BirthdayMonthEmail = ({ name = 'there' }: BirthdayMonthProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Happy Birthday Month, {name}! 🎂</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={logo}>{SITE_NAME}</Text>
        <Hr style={divider} />
        <Heading style={{ ...h1, textAlign: 'center' as const }}>Happy Birthday Month!</Heading>
        <Text style={{ ...text, textAlign: 'center' as const }}>
          To celebrate your special month, we've activated an exclusive <strong>$5 birthday discount</strong> for you.
        </Text>
        <Section style={{ ...card, textAlign: 'center' as const }}>
          <Text style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#999999', textTransform: 'uppercase' as const, letterSpacing: '2px', fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>Your Gift</Text>
          <Text style={{ margin: '0 0 8px 0' }}><span style={pointsBadge}>$5.00 OFF</span></Text>
          <Text style={{ margin: '0', color: '#FFFFFF', fontSize: '15px', fontFamily: 'Georgia, serif' }}>This discount will be auto-applied at checkout all month long.</Text>
        </Section>
        <Section style={btnCenter}>
          <Button href={`${SITE_URL}/shop`} style={btn}>Shop Now</Button>
        </Section>
        <Text style={{ ...muted, textAlign: 'center' as const }}>Wishing you a beautiful month ahead.</Text>
        <Hr style={footerDivider} />
        <Text style={footer}>© {new Date().getFullYear()} {SITE_NAME}. All rights reserved.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: BirthdayMonthEmail,
  subject: (data: Record<string, unknown>) => `Happy Birthday Month, ${data.name as string || 'there'}! 🎂`,
  displayName: 'Birthday month',
  previewData: { name: 'Jane' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Georgia, serif' }
const container = { maxWidth: '600px', margin: '0 auto', backgroundColor: '#000000', padding: '40px 32px' }
const logo: React.CSSProperties = { fontSize: '36px', color: '#C9A96E', fontWeight: 400, fontFamily: 'Georgia, serif', textAlign: 'center', margin: '0 0 24px 0' }
const divider = { borderColor: '#C9A96E', opacity: 0.4, margin: '0 0 32px 0' }
const h1 = { color: '#FFFFFF', fontSize: '24px', fontWeight: 400, margin: '0 0 16px 0', fontFamily: 'Georgia, serif' }
const text: React.CSSProperties = { color: '#FFFFFF', fontSize: '16px', lineHeight: '1.7', margin: '0 0 16px 0', fontFamily: 'Georgia, serif' }
const muted: React.CSSProperties = { color: '#999999', fontSize: '14px', lineHeight: '1.6', fontFamily: 'Georgia, serif' }
const card: React.CSSProperties = { backgroundColor: '#111111', border: '1px solid #222222', borderRadius: '16px', padding: '24px', margin: '16px 0' }
const pointsBadge: React.CSSProperties = { display: 'inline-block', backgroundColor: '#C9A96E', color: '#000', padding: '4px 14px', borderRadius: '50px', fontSize: '13px', fontWeight: 700, letterSpacing: '1px', fontFamily: "'Helvetica Neue', Arial, sans-serif" }
const btn: React.CSSProperties = { display: 'inline-block', backgroundColor: '#C9A96E', color: '#000000', padding: '16px 40px', borderRadius: '50px', textDecoration: 'none', fontSize: '14px', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', fontFamily: "'Helvetica Neue', Arial, sans-serif" }
const btnCenter: React.CSSProperties = { textAlign: 'center', padding: '24px 0' }
const footerDivider = { borderColor: '#222222', margin: '32px 0 0 0' }
const footer: React.CSSProperties = { color: '#999999', fontSize: '12px', textAlign: 'center', fontFamily: 'Georgia, serif', margin: '16px 0 0 0' }
