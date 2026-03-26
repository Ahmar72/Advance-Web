'use client';

import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface ReviewItem {
  id: string;
  title: string;
  description: string;
  status: string;
  user: { email: string };
  media: Array<{ original_url: string }>;
}

export default function ModeratorQueuePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [queue, setQueue] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (
      !isLoading &&
      (!user ||
        (user.role !== 'moderator' && user.role !== 'admin' && user.role !== 'super_admin'))
    ) {
      router.push('/signin');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      fetchQueue();
    }
  }, [user]);

  const fetchQueue = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/moderator?limit=50`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        }
      );

      if (response.ok) {
        const { data } = await response.json();
        setQueue(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch queue:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (adId: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/moderator/${adId}/review`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
          body: JSON.stringify({ approved: true }),
        }
      );

      if (response.ok) {
        setQueue(queue.filter((item) => item.id !== adId));
      }
    } catch (error) {
      console.error('Failed to approve ad:', error);
    }
  };

  const handleReject = async (adId: string, reason: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/moderator/${adId}/review`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
          body: JSON.stringify({ approved: false, rejection_reason: reason }),
        }
      );

      if (response.ok) {
        setQueue(queue.filter((item) => item.id !== adId));
      }
    } catch (error) {
      console.error('Failed to reject ad:', error);
    }
  };

  const handleFlag = async (adId: string) => {
    // PDF requires moderators to be able to flag suspicious media/content.
    const reason = prompt('Flag reason (min 10 chars):') || '';
    if (reason.trim().length < 10) {
      alert('Reason must be at least 10 characters.');
      return;
    }
    const severityInput = prompt('Severity (low | medium | high):', 'medium') || 'medium';
    const severity = severityInput.toLowerCase();
    if (severity !== 'low' && severity !== 'medium' && severity !== 'high') {
      alert('Invalid severity. Use: low, medium, or high.');
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/moderator/${adId}/flag`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
          body: JSON.stringify({ reason, severity }),
        }
      );

      if (!response.ok) throw new Error(`Flag failed: ${response.status}`);
      alert('Content flagged.');
    } catch (e) {
      console.error('Failed to flag content:', e);
      alert('Failed to flag content.');
    }
  };

  if (isLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-900 to-slate-800">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-white">Content Review Queue</h1>
          <p className="text-slate-400">Moderate submitted ads for quality and policy fit</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center text-slate-400">Loading queue...</div>
        ) : queue.length === 0 ? (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-12 text-center">
            <p className="text-slate-400 text-lg">No ads to review</p>
            <p className="text-slate-500 text-sm">All pending ads have been reviewed!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {queue.map((item) => (
              <div key={item.id} className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                <div className="grid md:grid-cols-3 gap-6">
                  {/* Preview */}
                  <div>
                    <div className="h-48 bg-slate-700 rounded mb-4"></div>
                    <p className="text-slate-400 text-sm">Submitted by: {item.user.email}</p>
                  </div>

                  {/* Content */}
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
                    <p className="text-slate-400 mb-4 line-clamp-3">{item.description}</p>
                    <div className="bg-slate-700 rounded px-3 py-1 text-xs text-slate-300 inline-block">
                      {item.status}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => handleApprove(item.id)}
                      className="bg-green-600 hover:bg-green-700 text-white py-2 rounded font-semibold transition"
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() =>
                        handleReject(
                          item.id,
                          'Content does not meet policy guidelines'
                        )
                      }
                      className="bg-red-600 hover:bg-red-700 text-white py-2 rounded font-semibold transition"
                    >
                      ✗ Reject
                    </button>
                    <button
                      onClick={() => handleFlag(item.id)}
                      className="bg-slate-700 hover:bg-slate-600 text-white py-2 rounded font-semibold transition"
                    >
                      🚩 Flag
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
