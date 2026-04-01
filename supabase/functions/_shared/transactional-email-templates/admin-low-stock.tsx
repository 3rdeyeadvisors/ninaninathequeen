import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Button, Section, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Nina Armend'
const SITE_URL = 'https://ninaarmend.co'

interface AdminLowStockProps {
  productTitle?: string
  inventory?: number
  threshold?: number
}

const AdminLowStockEmail = ({ productTitle = '', inventory = 0, threshold = 10 }: AdminLowStockProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>⚠️ Low Stock Alert — {productTitle}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={logo}>{SITE_NAME}</Text>
        <Hr style={divider} />
        <Heading style={h1}>Low Stock Alert</Heading>
        <Text style={text}>A product in your store is running low and may need restocking.</Text>
        <Section style={card}>
          <Text style={{ ...text, margin: '0 0 8px 0' }}><span style={highlight}>{productTitle}</span></Text>
          <Text style={{ ...muted, margin: '0' }}>Current inventory: <strong style={{ color: '#C9A96E' }}>{inventory} units</strong> (threshold: {threshold})</Text>
        </Section>
        <Section style={btnCenter}>
          <Button href={`${SITE_URL}/admin/products`} style={btn}>Manage Inventory</Button>
        </Section>
        <Hr style={footerDivider} />
        <Text style={footer}>© {new Date().getFullYear()} {SITE_NAME}. All rights reserved.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: AdminLowStockEmail,
  subject: (data: Record<string, any>) => `⚠️ Low Stock Alert — ${data.productTitle || 'Product'}`,
  displayName: 'Admin low stock alert',
  previewData: { productTitle: 'Sunset Bikini Top', inventory: 3, threshold: 10 },
  to: 'support@ninaarmend.co',
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
