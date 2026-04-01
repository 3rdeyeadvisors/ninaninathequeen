import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Button, Section, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Nina Armend'
const SITE_URL = 'https://ninaarmend.co'

interface WelcomeProps {
  name?: string
  referralCode?: string
}

const WelcomeEmail = ({ name, referralCode }: WelcomeProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Welcome to {SITE_NAME} — 50 points await you</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={logo}>{SITE_NAME}</Text>
        <Hr style={divider} />
        <Heading style={h1}>Welcome, {name || 'there'}</Heading>
        <Text style={text}>
          We're thrilled to have you join the Nina Armend family. Your account has been created and you've earned your first reward.
        </Text>
        <Section style={card}>
          <Text style={{ ...text, margin: '0 0 8px 0' }}>
            <span style={highlight}>50 Welcome Points</span> have been added to your account.
          </Text>
          <Text style={{ ...muted, margin: '0' }}>
            Use your points toward exclusive discounts on future orders.
          </Text>
        </Section>
        {referralCode && (
          <Section style={card}>
            <Text style={{ ...text, margin: '0 0 8px 0' }}>
              Share Nina Armend with a friend and earn <span style={highlight}>25 bonus points</span> when they sign up.
            </Text>
            <Text style={{ ...muted, margin: '0' }}>
              Your referral code: <strong style={{ color: '#C9A96E' }}>{referralCode}</strong>
            </Text>
          </Section>
        )}
        <Section style={btnCenter}>
          <Button href={`${SITE_URL}/shop`} style={btn}>Start Shopping</Button>
        </Section>
        <Hr style={footerDivider} />
        <Text style={footer}>© {new Date().getFullYear()} {SITE_NAME}. All rights reserved.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: WelcomeEmail,
  subject: 'Welcome to Nina Armend',
  displayName: 'Welcome',
  previewData: { name: 'Jane', referralCode: 'JANE50' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Georgia, serif' }
const container = { maxWidth: '600px', margin: '0 auto', backgroundColor: '#000000', padding: '40px 32px' }
const logo: React.CSSProperties = { fontSize: '36px', color: '#C9A96E', fontWeight: 400, fontFamily: 'Georgia, serif', textAlign: 'center', margin: '0 0 24px 0' }
const divider = { borderColor: '#C9A96E', opacity: 0.4, margin: '0 0 32px 0' }
const h1 = { color: '#FFFFFF', fontSize: '24px', fontWeight: 400, margin: '0 0 16px 0', fontFamily: 'Georgia, serif' }
const text: React.CSSProperties = { color: '#FFFFFF', fontSize: '16px', lineHeight: '1.7', margin: '0 0 16px 0', fontFamily: 'Georgia, serif' }
const muted: React.CSSProperties = { color: '#999999', fontSize: '14px', lineHeight: '1.6', fontFamily: 'Georgia, serif' }
const highlight: React.CSSProperties = { color: '#C9A96E', fontWeight: 600 }
const card: React.CSSProperties = { backgroundColor: '#111111', border: '1px solid #222222', borderRadius: '16px', padding: '24px', margin: '16px 0' }
const btn: React.CSSProperties = { display: 'inline-block', backgroundColor: '#C9A96E', color: '#000000', padding: '16px 40px', borderRadius: '50px', textDecoration: 'none', fontSize: '14px', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', fontFamily: "'Helvetica Neue', Arial, sans-serif" }
const btnCenter: React.CSSProperties = { textAlign: 'center', padding: '24px 0' }
const footerDivider = { borderColor: '#222222', margin: '32px 0 0 0' }
const footer: React.CSSProperties = { color: '#999999', fontSize: '12px', textAlign: 'center', fontFamily: 'Georgia, serif', margin: '16px 0 0 0' }
