import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Button, Section, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Nina Armend'
const SITE_URL = 'https://ninaarmend.co'

interface LaunchAnnouncementProps {
  name?: string
}

const LaunchAnnouncementEmail = ({ name }: LaunchAnnouncementProps) => {
  const greeting = name ? `${name}, the` : 'The'
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{SITE_NAME} Is Now Live</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={logo}>{SITE_NAME}</Text>
          <Hr style={divider} />
          <Heading style={{ ...h1, textAlign: 'center' as const, fontSize: '28px', marginBottom: '8px' }}>The Wait Is Over</Heading>
          <Text style={{ ...text, textAlign: 'center' as const, color: '#C9A96E', fontSize: '18px', marginBottom: '24px', fontStyle: 'italic' }}>
            {greeting} moment you've been waiting for is here.
          </Text>
          <Text style={text}>Our curated collection of luxury swimwear is now live and ready for you to explore.</Text>
          <Text style={text}>As one of our earliest supporters, we wanted you to be the first to know.</Text>
          <Section style={{ ...card, textAlign: 'center' as const }}>
            <Text style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#999999', textTransform: 'uppercase' as const, letterSpacing: '2px', fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>Exclusive Welcome Reward</Text>
            <Text style={{ margin: '0 0 8px 0' }}><span style={pointsBadge}>50 POINTS</span></Text>
            <Text style={{ margin: '0', color: '#FFFFFF', fontSize: '15px', fontFamily: 'Georgia, serif' }}>
              Create your account today and receive <span style={highlight}>50 welcome points</span> toward your first purchase.
            </Text>
          </Section>
          <Section style={{ ...btnCenter, padding: '32px 0' }}>
            <Button href={`${SITE_URL}/shop`} style={btn}>Create Your Account</Button>
          </Section>
          <Text style={{ ...muted, textAlign: 'center' as const }}>
            Explore our exclusive collections crafted with intention, designed to make you feel extraordinary.
          </Text>
          <Hr style={footerDivider} />
          <Text style={footer}>© {new Date().getFullYear()} {SITE_NAME}. All rights reserved.</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: LaunchAnnouncementEmail,
  subject: 'Nina Armend Is Now Live',
  displayName: 'Launch announcement',
  previewData: { name: 'Jane' },
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
const pointsBadge: React.CSSProperties = { display: 'inline-block', backgroundColor: '#C9A96E', color: '#000', padding: '4px 14px', borderRadius: '50px', fontSize: '13px', fontWeight: 700, letterSpacing: '1px', fontFamily: "'Helvetica Neue', Arial, sans-serif" }
const btn: React.CSSProperties = { display: 'inline-block', backgroundColor: '#C9A96E', color: '#000000', padding: '16px 40px', borderRadius: '50px', textDecoration: 'none', fontSize: '14px', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', fontFamily: "'Helvetica Neue', Arial, sans-serif" }
const btnCenter: React.CSSProperties = { textAlign: 'center', padding: '24px 0' }
const footerDivider = { borderColor: '#222222', margin: '32px 0 0 0' }
const footer: React.CSSProperties = { color: '#999999', fontSize: '12px', textAlign: 'center', fontFamily: 'Georgia, serif', margin: '16px 0 0 0' }
