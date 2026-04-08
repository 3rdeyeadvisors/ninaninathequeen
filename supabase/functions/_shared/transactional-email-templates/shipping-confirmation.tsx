import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Button, Section, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Nina Armend'
const SITE_URL = 'https://ninaarmend.co'

interface ShippingConfirmationProps {
  orderId?: string
  customerName?: string
  trackingNumber?: string
  items?: Array<{ title: string; quantity: number; price: string; size?: string }>
  total?: string
}

const ShippingConfirmationEmail = ({ orderId = '', customerName = '', trackingNumber = '', items = [], total = '0' }: ShippingConfirmationProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your Nina Armend Order Has Shipped — {orderId.slice(0, 8).toUpperCase()}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={logo}>{SITE_NAME}</Text>
        <Hr style={divider} />
        <Heading style={h1}>Your Order Is On Its Way</Heading>
        <Text style={text}>
          Great news, {customerName || 'there'} — your order has shipped and is heading to you now.
        </Text>
        <Section style={card}>
          <Text style={muted}>Order Reference: <strong style={{ color: '#C9A96E' }}>{orderId.slice(0, 8).toUpperCase()}</strong></Text>
          {trackingNumber && (
            <Text style={{ ...text, margin: '0 0 8px 0' }}>Tracking Number: <strong style={{ color: '#C9A96E' }}>{trackingNumber}</strong></Text>
          )}
          <table style={{ width: '100%', borderCollapse: 'collapse' as const, marginTop: '16px' }}>
            <tbody>
              {items.map((item, i) => (
                <tr key={i}>
                  <td style={itemCell}>
                    {item.title}{item.size ? <span style={{ color: '#999' }}> ({item.size})</span> : ''} × {item.quantity}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
        <Text style={muted}>International orders typically arrive within 7–14 business days. Domestic orders within 3–7 business days.</Text>
        <Section style={btnCenter}>
          <Button href={`${SITE_URL}/account`} style={btn}>Track Your Order</Button>
        </Section>
        <Hr style={footerDivider} />
        <Text style={footer}>© {new Date().getFullYear()} {SITE_NAME}. All rights reserved.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: ShippingConfirmationEmail,
  subject: (data: Record<string, unknown>) => `Your Nina Armend Order Has Shipped — ${(data.orderId as string || '').slice(0, 8).toUpperCase()}`,
  displayName: 'Shipping confirmation',
  previewData: { orderId: 'abc12345-xyz', customerName: 'Jane', trackingNumber: '1Z999AA10123456784', items: [{ title: 'Sunset Bikini Top', quantity: 1, price: '89.00', size: 'M' }], total: '89.00' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Georgia, serif' }
const container = { maxWidth: '600px', margin: '0 auto', backgroundColor: '#000000', padding: '40px 32px' }
const logo: React.CSSProperties = { fontSize: '36px', color: '#C9A96E', fontWeight: 400, fontFamily: 'Georgia, serif', textAlign: 'center', margin: '0 0 24px 0' }
const divider = { borderColor: '#C9A96E', opacity: 0.4, margin: '0 0 32px 0' }
const h1 = { color: '#FFFFFF', fontSize: '24px', fontWeight: 400, margin: '0 0 16px 0', fontFamily: 'Georgia, serif' }
const text: React.CSSProperties = { color: '#FFFFFF', fontSize: '16px', lineHeight: '1.7', margin: '0 0 16px 0', fontFamily: 'Georgia, serif' }
const muted: React.CSSProperties = { color: '#999999', fontSize: '14px', lineHeight: '1.6', fontFamily: 'Georgia, serif', margin: '0 0 16px 0' }
const card: React.CSSProperties = { backgroundColor: '#111111', border: '1px solid #222222', borderRadius: '16px', padding: '24px', margin: '16px 0' }
const itemCell: React.CSSProperties = { padding: '10px 0', borderBottom: '1px solid #222222', color: '#FFFFFF', fontSize: '14px', fontFamily: 'Georgia, serif' }
const btn: React.CSSProperties = { display: 'inline-block', backgroundColor: '#C9A96E', color: '#000000', padding: '16px 40px', borderRadius: '50px', textDecoration: 'none', fontSize: '14px', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', fontFamily: "'Helvetica Neue', Arial, sans-serif" }
const btnCenter: React.CSSProperties = { textAlign: 'center', padding: '24px 0' }
const footerDivider = { borderColor: '#222222', margin: '32px 0 0 0' }
const footer: React.CSSProperties = { color: '#999999', fontSize: '12px', textAlign: 'center', fontFamily: 'Georgia, serif', margin: '16px 0 0 0' }
