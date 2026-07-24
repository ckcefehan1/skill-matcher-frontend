import type { SkillDto } from '@/api/generated/model';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function SkillSelect({
  id,
  value,
  onChange,
  skills,
  placeholder,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  skills?: SkillDto[];
  placeholder: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id} className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {skills?.map((s) => (
          <SelectItem key={s.id} value={s.id ?? ''}>
            {s.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
