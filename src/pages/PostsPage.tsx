import React, { useCallback, useEffect, useState } from 'react';
import { Heart, Image as ImageIcon, MessageSquare, Plus, Search, Share2, Trash2, X } from 'lucide-react';
import { api, ApiError } from '../services/api.ts';
import type { PostItem, SocialPlatform } from '../types/index.ts';
import { PlatformLogo, PLATFORM_META } from '../components/PlatformIcon.tsx';
import { formatDateShort, formatNumber } from '../utils/format.ts';

function PostThumbnail({ src, title, platform }: { src: string; title: string; platform: SocialPlatform }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="w-full h-44 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex flex-col items-center justify-center p-4 text-slate-400">
        <ImageIcon className="w-7 h-7 mb-1.5 opacity-60" />
        <span className="text-[11px] font-medium text-center line-clamp-1">
          {PLATFORM_META[platform].name} Media
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={title}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className="w-full h-44 object-cover"
    />
  );
}

export function PostsPage() {
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [platform, setPlatform] = useState<SocialPlatform | 'all'>('all');
  const [mediaType, setMediaType] = useState('all');
  const [sortBy, setSortBy] = useState('engagementRate');

  // Create Post modal
  const [modalOpen, setModalOpen] = useState(false);
  const [newPlatform, setNewPlatform] = useState<SocialPlatform>('instagram');
  const [newTitle, setNewTitle] = useState('');
  const [newCaption, setNewCaption] = useState('');
  const [newMediaType, setNewMediaType] = useState<'image' | 'video' | 'carousel' | 'short' | 'thread'>('image');
  const [newLikes, setNewLikes] = useState('');
  const [newComments, setNewComments] = useState('');
  const [newShares, setNewShares] = useState('');
  const [newImpressions, setNewImpressions] = useState('');
  const [saving, setSaving] = useState(false);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const qs = new URLSearchParams({
        search,
        platform,
        mediaType,
        sortBy,
      }).toString();
      const data = await api.get<{ posts: PostItem[] }>(`/api/posts?${qs}`);
      setPosts(data.posts);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to load posts.');
    } finally {
      setLoading(false);
    }
  }, [search, platform, mediaType, sortBy]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadPosts();
    }, 180);
    return () => clearTimeout(timer);
  }, [loadPosts]);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/api/posts', {
        platform: newPlatform,
        title: newTitle,
        caption: newCaption,
        mediaType: newMediaType,
        likes: Number(newLikes) || 0,
        comments: Number(newComments) || 0,
        shares: Number(newShares) || 0,
        impressions: newImpressions ? Number(newImpressions) : undefined,
      });
      setModalOpen(false);
      setNewTitle('');
      setNewCaption('');
      setNewLikes('');
      setNewComments('');
      setNewShares('');
      setNewImpressions('');
      await loadPosts();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to log post.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePost = async (id: string) => {
    try {
      await api.del(`/api/posts/${id}`);
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to remove post.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Posts Analytics
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Inspect published posts, compare engagement rates, and surface top-performing formats.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="px-4 py-2 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white inline-flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Log Post</span>
        </button>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search post titles or captions…"
            className="w-full pl-10 pr-3.5 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            aria-label="Filter by platform"
            value={platform}
            onChange={(e) => setPlatform(e.target.value as SocialPlatform | 'all')}
            className="px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] cursor-pointer"
          >
            <option value="all">All Platforms</option>
            <option value="instagram">Instagram</option>
            <option value="tiktok">TikTok</option>
            <option value="youtube">YouTube</option>
            <option value="facebook">Facebook</option>
            <option value="x">X (Twitter)</option>
          </select>

          <select
            aria-label="Filter by media format"
            value={mediaType}
            onChange={(e) => setMediaType(e.target.value)}
            className="px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] cursor-pointer"
          >
            <option value="all">All Formats</option>
            <option value="image">Image</option>
            <option value="video">Video</option>
            <option value="carousel">Carousel</option>
            <option value="short">Short</option>
            <option value="thread">Thread</option>
          </select>

          <select
            aria-label="Sort posts"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] cursor-pointer"
          >
            <option value="engagementRate">Highest Engagement Rate</option>
            <option value="likes">Most Likes</option>
            <option value="comments">Most Comments</option>
            <option value="shares">Most Shares</option>
            <option value="newest">Newest Published</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-[360px] rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0F172A] animate-pulse"
            />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0F172A] p-12 text-center">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            No matching posts found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 max-w-md mx-auto">
            Try clearing your search filter, or log a published post to track its likes, comments, shares, and engagement rate.
          </p>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="mt-4 px-4 py-2 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
          >
            Log First Post
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {posts.map((post) => {
            const meta = PLATFORM_META[post.platform];
            return (
              <article
                key={post.id}
                className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0F172A] overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <PostThumbnail src={post.thumbnailUrl} title={post.title} platform={post.platform} />

                  <div className="p-5">
                    {/* Clean unboxed metadata row */}
                    <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <PlatformLogo platform={post.platform} className={`w-3.5 h-3.5 shrink-0 ${meta.textClass}`} />
                        <span className="font-medium text-slate-700 dark:text-slate-300 truncate">
                          {meta.name}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="capitalize">{post.mediaType}</span>
                      </div>
                      <span className="font-mono tabular-nums whitespace-nowrap">
                        {formatDateShort(post.publishedAt)}
                      </span>
                    </div>

                    <h3 className="mt-2.5 text-sm font-semibold text-slate-900 dark:text-white line-clamp-2">
                      {post.title}
                    </h3>

                    {post.caption && (
                      <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {post.caption}
                      </p>
                    )}
                  </div>
                </div>

                <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-4 font-mono tabular-nums text-slate-600 dark:text-slate-300">
                    <span className="inline-flex items-center gap-1" title="Likes">
                      <Heart className="w-3.5 h-3.5 text-slate-400" />
                      {formatNumber(post.likes)}
                    </span>
                    <span className="inline-flex items-center gap-1" title="Comments">
                      <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                      {formatNumber(post.comments)}
                    </span>
                    <span className="inline-flex items-center gap-1" title="Shares">
                      <Share2 className="w-3.5 h-3.5 text-slate-400" />
                      {formatNumber(post.shares)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <span className="font-mono tabular-nums font-semibold text-blue-600 dark:text-blue-400">
                      {post.engagementRate.toFixed(2)}%
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeletePost(post.id)}
                      aria-label={`Remove post ${post.title}`}
                      className="p-1 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Log Post Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] shadow-xl">
            <div className="px-6 py-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Log Published Post
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Platform</label>
                  <select
                    value={newPlatform}
                    onChange={(e) => setNewPlatform(e.target.value as SocialPlatform)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  >
                    <option value="instagram">Instagram</option>
                    <option value="tiktok">TikTok</option>
                    <option value="youtube">YouTube</option>
                    <option value="facebook">Facebook</option>
                    <option value="x">X (Twitter)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Format</label>
                  <select
                    value={newMediaType}
                    onChange={(e) =>
                      setNewMediaType(e.target.value as 'image' | 'video' | 'carousel' | 'short' | 'thread')
                    }
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  >
                    <option value="image">Image</option>
                    <option value="video">Video</option>
                    <option value="carousel">Carousel</option>
                    <option value="short">Short</option>
                    <option value="thread">Thread</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Post Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Product Design Teardown Reel"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Caption</label>
                <textarea
                  rows={2}
                  value={newCaption}
                  onChange={(e) => setNewCaption(e.target.value)}
                  placeholder="Optional summary or copy excerpt"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Likes</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={newLikes}
                    onChange={(e) => setNewLikes(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Comments</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={newComments}
                    onChange={(e) => setNewComments(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Shares</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={newShares}
                    onChange={(e) => setNewShares(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Impressions (optional)</label>
                <input
                  type="number"
                  min={0}
                  value={newImpressions}
                  onChange={(e) => setNewImpressions(e.target.value)}
                  placeholder="Used to calculate engagement rate"
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {saving ? 'Saving…' : 'Add Post'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
