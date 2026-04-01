import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Button, Section, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Nina Armend'
const SITE_URL = 'https://ninaarmend.co'

interface AbandonedCartProps {
  customerName?: string
  items?: Array<{ title: string; quantity: number; price: string }>
  total?: string
}

const AbandonedCartEmail = ({ customerName = 'there', items = [], total = '0' }: AbandonedCartProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your Nina Armend bag is waiting 🌊</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={logo}>{SITE_NAME}</Text>
        <Hr style={divider} />
        <Heading style={h1}>You left something behind</Heading>
        <Text style={text}>Hi {customerName}, your bag is still waiting for you.</Text>
        <Section style={card}>
          <table style={{ width: '100%', borderCollapse: 'collapse' as const }}>
            <tbody>
              {items.map((item, i) => (
                <tr key={i}>
                  <td style={itemCell}>{item.title} × {item.quantity}</td>
                  <td style={priceCell}>${(parseFloat(item.price) * item.quantity).toFixed(2)}</td>
                </tr>
              ))}
              <tr>
                <td style={totalLabel}>Total</td>
                <td style={totalValue}>${parseFloat(total).toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </Section>
        <Section style={btnCenter}>
          <Button href={`${SITE_URL}/checkout`} style={btn}>Complete Your Order</Button>
        </Section>
        <Text style={{ ...muted, textAlign: 'center' as const }}>This is a one-time reminder. We won't send another.</Text>
        <Hr style={footerDivider} />
        <Text style={footer}>© {new Date().getFullYear()} {SITE_NAME}. All rights reserved.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: AbandonedCartEmail,
  subject: 'Your Nina Armend bag is waiting 🌊',
  displayName: 'Abandoned cart',
  previewData: { customerName: 'Jane', items: [{ title: 'Sunset Bikini Top', quantity: 1, price: '89.00' }], total: '89.00' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Georgia, serif' }
const container = { maxWidth: '600px', margin: '0 auto', backgroundColor: '#000000', padding: '40px 32px' }
const logo: React.CSSProperties = { fontSize: '36px', color: '#C9A96E', fontWeight: 400, fontFamily: 'Georgia, serif', textAlign: 'center', margin: '0 0 24px 0' }
const divider = { borderColor: '#C9A96E', opacity: 0.4, margin: '0 0 32px 0' }
const h1 = { color: '#FFFFFF', fontSize: '24px', fontWeight: 400, margin: '0 0 16px 0', fontFamily: 'Georgia, serif' }
const text: React.CSSProperties = { color: '#FFFFFF', fontSize: '16px', lineHeight: '1.7', margin: '0 0 16px 0', fontFamily: 'Georgia, serif' }
const muted: React.CSSProperties = { color: '#999999', fontSize: '14px', lineHeight: '1.6', fontFamily: 'Georgia, serif' }
const card: React.CSSProperties = { backgroundColor: '#111111', border: '1px solid #222222', borderRadius: '16px', padding: '24px', margin: '16px 0' }
const itemCell: React.CSSProperties = { padding: '10px 0', borderBottom: '1px solid #222222', color: '#FFFFFF', fontSize: '14px', fontFamily: 'Georgia, serif' }
const priceCell: React.CSSProperties = { padding: '10px 0', borderBottom: '1px solid #222222', color: '#C9A96E', fontSize: '14px', textAlign: 'right' as const, fontFamily: 'Georgia, serif' }
const totalLabel: React.CSSProperties = { padding: '16px 0 0', color: '#FFFFFF', fontSize: '16px', fontWeight: 600, fontFamily: 'Georgia, serif' }
const totalValue: React.CSSProperties = { padding: '16px 0 0', color: '#C9A96E', fontSize: '18px', fontWeight: 700, textAlign: 'right' as const, fontFamily: 'Georgia, serif' }
const btn: React.CSSProperties = { display: 'inline-block', backgroundColor: '#C9A96E', color: '#000000', padding: '16px 40px', borderRadius: '50px', textDecoration: 'none', fontSize: '14px', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', fontFamily: "'Helvetica Neue', Arial, sans-serif" }
const btnCenter: React.CSSProperties = { textAlign: 'center', padding: '24px 0' }
const footerDivider = { borderColor: '#222222', margin: '32px 0 0 0' }
const footer: React.CSSProperties = { color: '#999999', fontSize: '12px', textAlign: 'center', fontFamily: 'Georgia, serif', margin: '16px 0 0 0' }
