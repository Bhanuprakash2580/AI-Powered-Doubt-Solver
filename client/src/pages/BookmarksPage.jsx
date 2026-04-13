import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, Loader2, Trash2, MessageSquare } from 'lucide-react';
import Navbar from '../components/Layout/Navbar';
import { chatAPI } from '../services/api';
import toast from 'react-hot-toast';

const SUBJECT_COLORS = {
  Mathematics: 'bg-blue-100 text-blue-700',
  Physics: 'bg-purple-100 text-purple-700',
  Chemistry: 'bg-green-100 text-green-700',
  Biology: 'bg-emerald-100 text-emerald-700',
  General: 'bg-gray-100 text-gray-700',
};

export default function BookmarksPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [bookmarks, setBookmarks] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await chatAPI.getBookmarks();
      setBookmarks(data.bookmarks || []);
    } catch {
      toast.error('Failed to load bookmarks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const removeBookmark = async (e, item) => {
    e.stopPropagation();
    try {
      await chatAPI.setBookmark(item.chatId, item.messageId, false);
      setBookmarks(prev => prev.filter(b => b.messageId !== item.messageId));
      toast.success('Removed bookmark');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove bookmark');
    }
  };

  const time = (ts) => {
    if (!ts) return '';
    return new Date(ts).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
            <Bookmark className="w-5 h-5 text-yellow-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bookmarks</h1>
            <p className="text-sm text-gray-500">Save important AI answers and revisit them anytime.</p>
          </div>
        </div>

        <div className="card">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
            </div>
          ) : bookmarks.length === 0 ? (
            <div className="text-center py-16">
              <Bookmark className="w-8 h-8 text-yellow-500 mx-auto mb-4" />
              <h3 className="font-medium text-gray-900 mb-2">No bookmarks yet</h3>
              <p className="text-sm text-gray-500">Open a chat and bookmark any AI answer.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {bookmarks.map((b) => (
                <div
                  key={b.messageId}
                  onClick={() => navigate(`/chat/${b.chatId}`)}
                  className="flex items-start gap-3 py-4 px-2 -mx-2 rounded-lg hover:bg-gray-50 cursor-pointer group transition-colors"
                >
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{b.chatTitle}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${SUBJECT_COLORS[b.chatSubject] || SUBJECT_COLORS.General}`}>
                        {b.chatSubject}
                      </span>
                      <span className="text-xs text-gray-400">{time(b.timestamp)}</span>
                    </div>
                    <p className="text-sm text-gray-700 line-clamp-3 whitespace-pre-wrap">
                      {b.content}
                    </p>
                  </div>
                  <button
                    onClick={(e) => removeBookmark(e, b)}
                    className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    title="Remove bookmark"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

