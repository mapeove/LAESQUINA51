import type { SupabaseClient } from '@supabase/supabase-js';

export interface StoreStatusResult {
  isOpen: boolean;
  reason: string;
}

function getMadridCurrentTime() {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-CA', { timeZone: 'Europe/Madrid' }); // YYYY-MM-DD
  const timeStr = now.toLocaleTimeString('en-GB', { timeZone: 'Europe/Madrid', hour12: false }); // HH:mm:ss
  
  const weekdayStr = now.toLocaleDateString('en-US', { timeZone: 'Europe/Madrid', weekday: 'short' });
  const weekdays: Record<string, number> = { 'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6 };
  const dayOfWeek = weekdays[weekdayStr];
  
  // Calculate yesterday's date and day of week
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayDateStr = yesterday.toLocaleDateString('en-CA', { timeZone: 'Europe/Madrid' });
  const yesterdayWeekdayStr = yesterday.toLocaleDateString('en-US', { timeZone: 'Europe/Madrid', weekday: 'short' });
  const yesterdayDayOfWeek = weekdays[yesterdayWeekdayStr];

  return { dateStr, timeStr, dayOfWeek, yesterdayDateStr, yesterdayDayOfWeek };
}

function isTimeInShift(currentTime: string, openTime: string, closeTime: string, isYesterdayShift: boolean) {
  // Pad with seconds if not present
  const normalize = (t: string) => t.length === 5 ? `${t}:00` : t;
  const current = normalize(currentTime);
  const open = normalize(openTime);
  const close = normalize(closeTime);

  if (open <= close) {
    if (isYesterdayShift) return false;
    return current >= open && current <= close;
  }
  
  if (isYesterdayShift) {
    return current <= close;
  } else {
    return current >= open;
  }
}

export async function getStoreStatus(supabase: SupabaseClient): Promise<StoreStatusResult> {
  const { dateStr, timeStr, dayOfWeek, yesterdayDateStr, yesterdayDayOfWeek } = getMadridCurrentTime();

  // 1. Check manual override (store_open = 'false')
  const { data: settings } = await supabase.from('store_settings').select('value').eq('key', 'store_open').single();
  if (settings && settings.value === 'false') {
    return { isOpen: false, reason: 'FORCED_CLOSED' };
  }

  // 2. Fetch special hours for today and yesterday
  const { data: specialHours } = await supabase
    .from('special_opening_hours')
    .select('*')
    .in('special_date', [dateStr, yesterdayDateStr]);

  const todaySpecial = specialHours?.filter(s => s.special_date === dateStr) || [];
  const yesterdaySpecial = specialHours?.filter(s => s.special_date === yesterdayDateStr) || [];

  // Check today special exception
  if (todaySpecial.length > 0) {
    const isClosedAllDay = todaySpecial.some(s => s.is_closed);
    if (isClosedAllDay) {
      return { isOpen: false, reason: 'SPECIAL_CLOSED_TODAY' };
    }
    
    // Evaluate special shifts
    for (const shift of todaySpecial) {
      if (isTimeInShift(timeStr, shift.open_time, shift.close_time, false)) {
        return { isOpen: true, reason: 'SPECIAL_OPEN' };
      }
    }
    // Also check if yesterday's special shift rolled over to today
    for (const shift of yesterdaySpecial) {
      if (!shift.is_closed && isTimeInShift(timeStr, shift.open_time, shift.close_time, true)) {
        return { isOpen: true, reason: 'SPECIAL_OPEN_YESTERDAY_ROLLOVER' };
      }
    }
    
    return { isOpen: false, reason: 'SPECIAL_CLOSED_NOW' };
  }

  // 3. Normal weekly schedule
  // If there wasn't a special override for today, we evaluate normal schedule.
  // We also must check if yesterday had a normal schedule that rolled over, 
  // EXCEPT if yesterday was a special day.
  const { data: normalHours } = await supabase
    .from('opening_hours')
    .select('*')
    .eq('active', true)
    .in('day_of_week', [dayOfWeek, yesterdayDayOfWeek]);

  const todayNormal = normalHours?.filter(h => h.day_of_week === dayOfWeek) || [];
  const yesterdayNormal = normalHours?.filter(h => h.day_of_week === yesterdayDayOfWeek) || [];

  // Evaluate today normal
  for (const shift of todayNormal) {
    if (isTimeInShift(timeStr, shift.open_time, shift.close_time, false)) {
      return { isOpen: true, reason: 'NORMAL_OPEN' };
    }
  }

  // Evaluate yesterday normal rollover (only if yesterday WASN'T a special day overriding it)
  if (yesterdaySpecial.length === 0) {
    for (const shift of yesterdayNormal) {
      if (isTimeInShift(timeStr, shift.open_time, shift.close_time, true)) {
        return { isOpen: true, reason: 'NORMAL_OPEN_YESTERDAY_ROLLOVER' };
      }
    }
  } else {
    // If yesterday WAS a special day, evaluate yesterday's special rollover
    for (const shift of yesterdaySpecial) {
      if (!shift.is_closed && isTimeInShift(timeStr, shift.open_time, shift.close_time, true)) {
        return { isOpen: true, reason: 'SPECIAL_OPEN_YESTERDAY_ROLLOVER' };
      }
    }
  }

  return { isOpen: false, reason: 'CLOSED_NOW' };
}