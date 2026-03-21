import { useEffect, useState } from 'react';
import { adminApiRequest, API_BASE_URL } from '../config/api';

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
        const response = await fetch(`${API_BASE_URL}/content/public/${pageKey}`);
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
        const response = await fetch(`${API_BASE_URL}/content/page/${pageName}`);
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

export const updatePageContent = async (key: string, content: string, _token: string) => {
  return adminApiRequest(`${API_BASE_URL}/admin/content/${key}`, {
    method: 'PUT',
    body: JSON.stringify({ content }),
  });
};

export const fetchAllContent = async (_token: string) => {
  return adminApiRequest(`${API_BASE_URL}/admin/content`);
};
