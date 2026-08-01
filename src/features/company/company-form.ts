import { z } from 'zod';
import type { RegisterCompanyRequest } from '@/api/generated/model';

export const COMPANY_SIZE_LABELS = {
  SIZE_1_10: '1–10 Mitarbeitende',
  SIZE_11_50: '11–50 Mitarbeitende',
  SIZE_51_200: '51–200 Mitarbeitende',
  SIZE_201_1000: '201–1000 Mitarbeitende',
  SIZE_1000_PLUS: 'Mehr als 1000 Mitarbeitende',
} as const;

const regionNames = new Intl.DisplayNames('de', { type: 'region' });
export const COUNTRIES = [
  'DE',
  'AT',
  'CH',
  'NL',
  'BE',
  'LU',
  'FR',
  'IT',
  'ES',
  'PL',
  'GB',
  'US',
]
  .map((code) => ({ code, label: regionNames.of(code) ?? code }))
  .sort((a, b) => a.label.localeCompare(b.label, 'de'));

export const companySchema = z.object({
  name: z.string().min(1, 'Firmenname erforderlich'),
  street: z.string().min(1, 'Straße und Hausnummer erforderlich'),
  zip: z.string().min(1, 'PLZ erforderlich'),
  city: z.string().min(1, 'Ort erforderlich'),
  country: z.string().regex(/^[A-Z]{2}$/, 'Land erforderlich'),
  industry: z.string(),
  companySize: z.enum(
    Object.keys(COMPANY_SIZE_LABELS) as [keyof typeof COMPANY_SIZE_LABELS],
  ),
  website: z.string(),
  adminEmail: z.email('Ungültige E-Mail-Adresse'),
});

export type CompanyFormValues = z.infer<typeof companySchema>;

export const companyFormDefaults = {
  name: '',
  street: '',
  zip: '',
  city: '',
  country: 'DE',
  industry: '',
  companySize: 'SIZE_1_10',
  website: '',
  adminEmail: '',
} satisfies CompanyFormValues;

/** Empty optional strings would be stored verbatim, so they are dropped here. */
export function toCompanyRequest(
  values: CompanyFormValues,
): RegisterCompanyRequest {
  return {
    ...values,
    industry: values.industry.trim() || undefined,
    website: values.website.trim() || undefined,
  };
}
