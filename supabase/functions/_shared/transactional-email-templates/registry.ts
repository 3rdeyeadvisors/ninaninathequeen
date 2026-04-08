/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  // deno-lint-ignore no-explicit-any
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, unknown>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, unknown>
}

import { template as welcome } from './welcome.tsx'
import { template as orderConfirmation } from './order-confirmation.tsx'
import { template as shippingConfirmation } from './shipping-confirmation.tsx'
import { template as contactFormToSupport } from './contact-form-to-support.tsx'
import { template as contactFormToCustomer } from './contact-form-to-customer.tsx'
import { template as referralSuccess } from './referral-success.tsx'
import { template as shippingUpdate } from './shipping-update.tsx'
import { template as waitlistConfirmation } from './waitlist-confirmation.tsx'
import { template as waitlistNotification } from './waitlist-notification.tsx'
import { template as discountApplied } from './discount-applied.tsx'
import { template as birthdayMonth } from './birthday-month.tsx'
import { template as adminBirthdayReport } from './admin-birthday-report.tsx'
import { template as adminLowStock } from './admin-low-stock.tsx'
import { template as adminReturnRequest } from './admin-return-request.tsx'
import { template as abandonedCart } from './abandoned-cart.tsx'
import { template as launchAnnouncement } from './launch-announcement.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'welcome': welcome,
  'order-confirmation': orderConfirmation,
  'shipping-confirmation': shippingConfirmation,
  'contact-form-to-support': contactFormToSupport,
  'contact-form-to-customer': contactFormToCustomer,
  'referral-success': referralSuccess,
  'shipping-update': shippingUpdate,
  'waitlist-confirmation': waitlistConfirmation,
  'waitlist-notification': waitlistNotification,
  'discount-applied': discountApplied,
  'birthday-month': birthdayMonth,
  'admin-birthday-report': adminBirthdayReport,
  'admin-low-stock': adminLowStock,
  'admin-return-request': adminReturnRequest,
  'abandoned-cart': abandonedCart,
  'launch-announcement': launchAnnouncement,
}
