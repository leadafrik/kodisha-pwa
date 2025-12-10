import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Save, AlertCircle, CheckCircle2, Edit2, X } from 'lucide-react';
import { fetchAllContent, updatePageContent } from '../../hooks/usePageContent';

interface ContentItem {
  _id: string;
  key: string;
  section: string;
  page: string;
  label: string;
  content: string;
  defaultContent: string;
  type: 'text' | 'textarea' | 'html';
  order: number;
}

const AdminContentEditor: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [filter, setFilter] = useState('');

  const token = localStorage.getItem('kodisha_admin_token') || localStorage.getItem('kodisha_token');

  // Check if user is super_admin
  useEffect(() => {
    if (user?.role !== 'super_admin') {
      navigate('/admin');
    }
  }, [user, navigate]);

  // Fetch all content
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        if (!token) throw new Error('Not authenticated');
        
        const data = await fetchAllContent(token);
        setContents(data.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      load();
    }
  }, [token]);

  const handleEdit = (item: ContentItem) => {
    setEditing(item._id);
    setEditValue(item.content || item.defaultContent);
  };

  const handleCancel = () => {
    setEditing(null);
    setEditValue('');
  };

  const handleSave = async (item: ContentItem) => {
    try {
      setSuccess(null);
      setError(null);
      
      if (!token) throw new Error('Not authenticated');
      
      await updatePageContent(item.key, editValue, token);
      
      // Update local state
      setContents(contents.map(c => 
        c._id === item._id 
          ? { ...c, content: editValue }
          : c
      ));
      
      setSuccess(`"${item.label}" updated successfully`);
      setEditing(null);
      setEditValue('');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Group content by page
  const groupedContent = contents.reduce((acc, item) => {
    if (!acc[item.page]) acc[item.page] = {};
    if (!acc[item.page][item.section]) acc[item.page][item.section] = [];
    acc[item.page][item.section].push(item);
    return acc;
  }, {} as { [page: string]: { [section: string]: ContentItem[] } });

  // Filter content
  const filteredPages = Object.entries(groupedContent).filter(([page]) =>
    page.toLowerCase().includes(filter.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading content...</p>
        </div>
      </div>
    );
  }

  if (user?.role !== 'super_admin') {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md">
          <AlertCircle className="mx-auto text-red-600 mb-4" size={48} />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">Only super_admin users can access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Website Content Editor</h1>
          <p className="text-gray-600">Edit all text content on the website. Changes apply immediately.</p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <h3 className="font-semibold text-red-900">Error</h3>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <CheckCircle2 className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <h3 className="font-semibold text-green-900">Success</h3>
              <p className="text-sm text-green-700">{success}</p>
            </div>
          </div>
        )}

        {/* Filter */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Filter by page name..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* Content Groups */}
        {filteredPages.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600">No content found. Initialize content in the database first.</p>
          </div>
        ) : (
          filteredPages.map(([page, sections]) => (
            <div key={page} className="mb-8">
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                {/* Page Header */}
                <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
                  <h2 className="text-2xl font-bold text-white capitalize">{page} Page</h2>
                </div>

                {/* Sections */}
                <div className="p-6 space-y-8">
                  {Object.entries(sections).map(([section, items]) => (
                    <div key={section} className="border-l-4 border-green-500 pl-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 capitalize">{section} Section</h3>
                      <div className="space-y-4">
                        {items
                          .sort((a, b) => a.order - b.order)
                          .map((item) => (
                            <div
                              key={item._id}
                              className="border border-gray-200 rounded-lg p-4 hover:border-green-500 transition"
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <h4 className="font-semibold text-gray-900">{item.label}</h4>
                                  <p className="text-xs text-gray-500 mt-1">Key: {item.key}</p>
                                </div>
                                {editing !== item._id && (
                                  <button
                                    onClick={() => handleEdit(item)}
                                    className="text-blue-600 hover:text-blue-700 p-2"
                                    title="Edit"
                                  >
                                    <Edit2 size={18} />
                                  </button>
                                )}
                              </div>

                              {editing === item._id ? (
                                <div className="space-y-3">
                                  {item.type === 'textarea' || item.type === 'html' ? (
                                    <textarea
                                      value={editValue}
                                      onChange={(e) => setEditValue(e.target.value)}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-sm"
                                      rows={6}
                                    />
                                  ) : (
                                    <input
                                      type="text"
                                      value={editValue}
                                      onChange={(e) => setEditValue(e.target.value)}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    />
                                  )}
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleSave(item)}
                                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                                    >
                                      <Save size={16} /> Save
                                    </button>
                                    <button
                                      onClick={handleCancel}
                                      className="flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
                                    >
                                      <X size={16} /> Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="bg-gray-50 rounded p-3 text-sm text-gray-700 whitespace-pre-wrap">
                                  {item.content || (
                                    <span className="text-gray-400 italic">{item.defaultContent}</span>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminContentEditor;
