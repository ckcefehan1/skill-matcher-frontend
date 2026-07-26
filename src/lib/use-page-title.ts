import { useEffect } from 'react';

export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = `matchpoint — ${title}`;
    return () => {
      document.title = 'matchpoint';
    };
  }, [title]);
}
