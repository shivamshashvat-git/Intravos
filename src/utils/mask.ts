export const maskAadhar = (aadhar: string | null): string => {
  if (!aadhar) return '—';
  const clean = aadhar.replace(/\s/g, '');
  if (clean.length < 4) return aadhar;
  return `**** **** ${clean.slice(-4)}`;
};

export const maskPassport = (passport: string | null): string => {
  if (!passport) return '—';
  if (passport.length < 4) return passport;
  return `****${passport.slice(-4)}`;
};

export const maskPAN = (pan: string | null): string => {
  if (!pan) return '—';
  if (pan.length < 10) return pan;
  return `${pan.slice(0, 5)}*****${pan.slice(-1)}`;
};
