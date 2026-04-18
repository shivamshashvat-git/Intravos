export const timeAgo = (date: string | Date): string => {
  const now = new Date();
  const past = new Date(date);
  const seconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  
  const days = Math.floor(hours / 24);
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks} weeks ago`;
  
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} months ago`;
  
  return past.toLocaleDateString();
};

export const formatAbsoluteDate = (date: string | Date): string => {
  return new Date(date).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
export function getFinancialYear(date: Date = new Date()): string {
  const month = date.getMonth(); // 0-indexed
  const year = date.getFullYear();
  
  // April is month 3
  if (month >= 3) {
    return `${year}-${String(year + 1).slice(2)}`;
  } else {
    return `${year - 1}-${String(year).slice(2)}`;
  }
}
