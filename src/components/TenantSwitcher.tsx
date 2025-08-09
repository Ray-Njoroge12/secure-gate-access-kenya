import { useTenant } from '@/context/TenantProvider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMemo } from 'react';

export function TenantSwitcher() {
  const { memberships, activeCommunityId, setActiveCommunity, loading } = useTenant();

  const options = useMemo(() => memberships.map((m) => ({
    id: m.community_id,
    label: m.community_name || m.community_id,
  })), [memberships]);

  const handleChange = async (value: string) => {
    if (value && value !== activeCommunityId) {
      await setActiveCommunity(value);
    }
  };

  return (
    <div className="w-56">
      <Select value={activeCommunityId ?? undefined} onValueChange={handleChange} disabled={loading || options.length <= 1}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={loading ? 'Loading...' : 'Select Community'} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.id} value={opt.id}>{opt.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
