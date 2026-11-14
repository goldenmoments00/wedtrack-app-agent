import { StudioBranding } from '@/types/auth';

export const DEMO_STUDIOS: Record<string, StudioBranding> = {
  aura: {
    id: 'studio-aura-01',
    name: 'Aura Wedding Studios',
    subdomain: 'aura',
    primaryColor: '#D97706',
    currency: 'INR',
    currencySymbol: '₹',
    proEnabled: true,
    termsText: 'Standard 50% advance to confirm dates. Balance payable 7 days prior to the first event. Raw footage retained for 60 days.',
    customDomain: 'crew.aurastudios.in',
    domainStatus: 'verified',
    adminUpiId: 'aurastudios@oksbi',
    adminUpiName: 'Aura Wedding Studios LLP',
  },
  pixelcraft: {
    id: 'studio-pixel-02',
    name: 'PixelCraft Photography',
    subdomain: 'pixelcraft',
    primaryColor: '#0284C7',
    currency: 'INR',
    currencySymbol: '₹',
    proEnabled: false, // Pro disabled studio!
    termsText: '30% booking advance required. All deliveries within 4 weeks of final event.',
    customDomain: undefined,
    domainStatus: undefined,
    adminUpiId: 'pixelcraft@okaxis',
    adminUpiName: 'PixelCraft Creative Co',
  },
};
