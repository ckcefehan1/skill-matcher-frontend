import type { UseFormReturn } from 'react-hook-form';
import {
  COMPANY_SIZE_LABELS,
  COUNTRIES,
  type CompanyFormValues,
} from './company-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function CompanyFormFields({
  form,
  idPrefix,
}: {
  form: UseFormReturn<CompanyFormValues>;
  idPrefix: string;
}) {
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = form;

  const field = (name: keyof CompanyFormValues, label: string) => (
    <div className="flex flex-col gap-2">
      <Label htmlFor={`${idPrefix}-${name}`}>{label}</Label>
      <Input
        id={`${idPrefix}-${name}`}
        aria-invalid={!!errors[name]}
        {...register(name)}
      />
      {errors[name] && (
        <p className="text-sm text-destructive">{errors[name]?.message}</p>
      )}
    </div>
  );

  return (
    <>
      {field('name', 'Firmenname')}
      {field('street', 'Straße und Hausnummer')}
      <div className="grid grid-cols-[1fr_2fr] gap-3">
        {field('zip', 'PLZ')}
        {field('city', 'Ort')}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor={`${idPrefix}-country`}>Land</Label>
        <Select
          value={watch('country')}
          onValueChange={(v) => setValue('country', v)}
        >
          <SelectTrigger id={`${idPrefix}-country`} className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {COUNTRIES.map(({ code, label }) => (
              <SelectItem key={code} value={code}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor={`${idPrefix}-companySize`}>Unternehmensgröße</Label>
        <Select
          value={watch('companySize')}
          onValueChange={(v) =>
            setValue('companySize', v as CompanyFormValues['companySize'])
          }
        >
          <SelectTrigger id={`${idPrefix}-companySize`} className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(COMPANY_SIZE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor={`${idPrefix}-industry`}>Branche (optional)</Label>
        <Input
          id={`${idPrefix}-industry`}
          placeholder="z. B. Maschinenbau"
          {...register('industry')}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor={`${idPrefix}-website`}>Website (optional)</Label>
        <Input
          id={`${idPrefix}-website`}
          type="url"
          placeholder="https://firma.de"
          {...register('website')}
        />
      </div>
      {field('adminEmail', 'E-Mail des Administrators')}
    </>
  );
}
