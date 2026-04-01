import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Section, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Nina Armend'

interface WaitlistNotificationProps {
  name?: string
  email?: string
}

const WaitlistNotificationEmail = ({ name = '', email = '' }: WaitlistNotificationProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>New Waitlist Signup: {email}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={logo}>{SITE_NAME}</Text>
        <Hr style={divider} />
        <Heading style={h1}>New Waitlist Signup</Heading>
        <Section style={card}>
          <Text style={{ ...text, margin: '0 0 8px 0' }}><strong style={{ color: '#C9A96E' }}>Email:</strong> {email}</Text>
          <Text style={{ ...text, margin: '0' }}><strong style={{ color: '#C9A96E' }}>Name:</strong> {name || 'Not provided'}</Text>
        </Section>
        <Text style={muted}>A new visitor has joined the launch waitlist.</Text>
        <Hr style={footerDivider} />
        <Text style={footer}>© {new Date().getFullYear()} {SITE_NAME}. All rights reserved.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: WaitlistNotificationEmail,
  subject: (data: Record<string, any>) => `New Waitlist Signup: ${data.email || ''}`,
  displayName: 'Waitlist notification (admin)',
  previewData: { name: 'Jane', email: 'jane@example.com' },
  to: 'support@ninaarmend.co',
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Georgia, serif' }
const container = { maxWidth: '600px', margin: '0 auto', backgroundColor: '#000000', padding: '40px 32px' }
const logo: React.CSSProperties = { fontSize: '36px', color: '#C9A96E', fontWeight: 400, fontFamily: 'Georgia, serif', textAlign: 'center', margin: '0 0 24px 0' }
const divider = { borderColor: '#C9A96E', opacity: 0.4, margin: '0 0 32px 0' }
const h1 = { color: '#FFFFFF', fontSize: '24px', fontWeight: 400, margin: '0 0 16px 0', fontFamily: 'Georgia, serif' }
const text: React.CSSProperties = { color: '#FFFFFF', fontSize: '16px', lineHeight: '1.7', margin: '0 0 16px 0', fontFamily: 'Georgia, serif' }
const muted: React.CSSProperties = { color: '#999999', fontSize: '14px', lineHeight: '1.6', fontFamily: 'Georgia, serif' }
const card: React.CSSProperties = { backgroundColor: '#111111', border: '1px solid #222222', borderRadius: '16px', padding: '24px', margin: '16px 0' }
const footerDivider = { borderColor: '#222222', margin: '32px 0 0 0' }
const footer: React.CSSProperties = { color: '#999999', fontSize: '12px', textAlign: 'center', fontFamily: 'Georgia, serif', margin: '16px 0 0 0' }
