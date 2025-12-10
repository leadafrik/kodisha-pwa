import { useEffect, useState } from 'react';

export interface PageContentItem {
  key: string;
  content: string;
  defaultContent: string;
}

export const usePageContent = (pageKey: string) => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/content/public/${pageKey}`);
        if (!response.ok) throw new Error('Failed to fetch content');
        
        const data = await response.json();
        setContent(data.data.content || data.data.defaultContent || '');
      } catch (err: any) {
        setError(err.message);
        setContent('');
      } finally {
        setLoading(false);
      }
    };

    if (pageKey) {
      fetchContent();
    }
  }, [pageKey]);

  return { content, loading, error };
};

export const usePageContents = (pageName: string) => {
  const [contents, setContents] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContents = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/content/page/${pageName}`);
        if (!response.ok) throw new Error('Failed to fetch page content');
        
        const data = await response.json();
        setContents(data.data || {});
      } catch (err: any) {
        setError(err.message);
        setContents({});
      } finally {
        setLoading(false);
      }
    };

    if (pageName) {
      fetchContents();
    }
  }, [pageName]);

  return { contents, loading, error };
};

export const updatePageContent = async (key: string, content: string, token: string) => {
  const response = await fetch(`/api/admin/content/${key}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update content');
  }

  return response.json();
};

export const fetchAllContent = async (token: string) => {
  const response = await fetch('/api/admin/content', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch content');
  }

  return response.json();
};
