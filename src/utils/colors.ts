const AVATAR_COLORS = [
  '#01696f', '#006494', '#7a39bb', '#437a22', 
  '#964219', '#d19900', '#a13544', '#da7101'
];

export const getAvatarColor = (name: string): string => {
  if (!name) return AVATAR_COLORS[0];
  const hash = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % 8];
};

export const getInitials = (name: string): string => {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};
