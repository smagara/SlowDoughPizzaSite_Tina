import React, { useState } from 'react';
import { BLOG_POSTS } from '../data/pizzaShopData';
import { BlogPost } from '../types';
import { BookOpen, Calendar, Clock, User, X, CheckCircle, Quote } from 'lucide-react';
import { DoughHandlingArt, WoodOvenArt } from './MinimalArt';

interface ArticlesSectionProps {
  selectedPostId?: string | null;
  onSelectPost?: (postId: string | null) => void;
}

export const ArticlesSection: React.FC<ArticlesSectionProps> = () => {
  const [activeModalPost, setActiveModalPost] = useState<BlogPost | null>(null);

  const openPostModal = (post: BlogPost) => {
    setActiveModalPost(post);
    document.body.style.overflow = 'hidden';
  };

  const closePostModal = () => {
    setActiveModalPost(null);
    document.body.style.overflow = 'auto';
  };

  return (
    <section id="journal" className="py-16 sm:py-24 border-b border-[#e6ddd2] bg-[#faf7f2]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f0e7dc] text-xs font-semibold text-[#8a4224] tracking-widest uppercase">
            <BookOpen className="w-3.5 h-3.5" />
            <span>The Baker’s Journal</span>
          </div>
          <h2 className="mt-3 font-serif text-3xl sm:text-4xl font-bold text-[#24211e]">
            Dough Aging & Flour Selection
          </h2>
          <p className="mt-3 text-base text-[#615448]">
            Explore the biological sciences and agricultural choices behind our 72-hour dough.
          </p>
        </div>

        {/* Blog Post Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {BLOG_POSTS.map((post) => (
            <article
              key={post.id}
              id={`blog-card-${post.id}`}
              className="bg-[#fffdfa] rounded-2xl border border-[#e5dcce] p-6 sm:p-8 flex flex-col justify-between shadow-xs hover:border-[#cfbeaa] transition-all"
            >
              <div>
                {/* Meta details */}
                <div className="flex flex-wrap items-center gap-3 text-xs text-[#75685c] pb-4 border-b border-[#eee5d8]">
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-[#c85a32]" />
                    <span>{post.author} ({post.authorRole})</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{post.publishedDate}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{post.readTime}</span>
                  </span>
                </div>

                {/* Title & Subtitle */}
                <h3 className="mt-5 font-serif text-2xl font-bold text-[#24211e] leading-snug">
                  {post.title}
                </h3>
                <p className="mt-2 text-sm italic font-serif text-[#78695c]">
                  "{post.subtitle}"
                </p>

                {/* Excerpt */}
                <p className="mt-4 text-sm sm:text-base text-[#52483e] leading-relaxed">
                  {post.excerpt}
                </p>

                {/* Key Takeaways summary pills */}
                <div className="mt-5 p-4 rounded-xl bg-[#f7f2ea] border border-[#e8dfd2] space-y-2">
                  <span className="block text-xs font-mono font-semibold uppercase tracking-wider text-[#8a4224]">
                    Essential Insights:
                  </span>
                  <ul className="space-y-1.5 text-xs text-[#54483e]">
                    {post.keyTakeaways.map((takeaway, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle className="w-3.5 h-3.5 text-[#c85a32] shrink-0 mt-0.5" />
                        <span>{takeaway}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Read Full Post Button */}
              <div className="mt-8 pt-4 border-t border-[#eee5d8] flex items-center justify-between">
                <span className="text-xs font-mono text-[#8d7e70]">
                  Essay • Complete Text Available
                </span>
                <button
                  id={`read-article-btn-${post.id}`}
                  onClick={() => openPostModal(post)}
                  className="px-4 py-2 rounded-lg bg-[#24211e] hover:bg-[#383029] text-[#faf8f5] text-xs font-semibold tracking-wide transition-colors cursor-pointer"
                >
                  Read Full Essay →
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Full Article Reading Modal */}
      {activeModalPost && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-[#1b1714]/70 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
          id="article-reading-modal"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative bg-[#faf7f2] w-full max-w-3xl rounded-2xl border border-[#ded2c3] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="sticky top-0 bg-[#faf7f2]/95 backdrop-blur-sm border-b border-[#e2d5c5] px-6 py-4 flex items-center justify-between z-10">
              <span className="text-xs font-mono text-[#8a4224] uppercase tracking-wider">
                The Baker's Journal • Slow Dough Pizza Co.
              </span>
              <button
                id="close-article-modal-btn"
                onClick={closePostModal}
                className="p-1.5 rounded-lg text-[#615448] hover:bg-[#ede3d5] hover:text-[#24211e] transition-colors cursor-pointer"
                aria-label="Close article view"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Content */}
            <div className="overflow-y-auto p-6 sm:p-10 space-y-8 font-sans">
              <div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-[#75685c] mb-3">
                  <span>By {activeModalPost.author}, {activeModalPost.authorRole}</span>
                  <span>•</span>
                  <span>{activeModalPost.publishedDate}</span>
                  <span>•</span>
                  <span>{activeModalPost.readTime}</span>
                </div>
                <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#24211e] leading-tight">
                  {activeModalPost.title}
                </h2>
                <p className="mt-2 text-base font-serif italic text-[#756557]">
                  {activeModalPost.subtitle}
                </p>
              </div>

              {/* Minimal Art embedded inside essay */}
              <div className="my-6">
                {activeModalPost.artType === 'dough' ? (
                  <DoughHandlingArt caption="Figure 1.1: Cellular alveoli distribution during gentle hand-stretching." />
                ) : (
                  <WoodOvenArt caption="Figure 1.2: The wood-fired hearth chamber firing at 900°F." />
                )}
              </div>

              {/* Key Takeaways Box in Essay */}
              <div className="p-5 rounded-xl bg-[#f2eade] border border-[#ded1c0] space-y-2">
                <span className="block text-xs font-mono font-bold uppercase tracking-wider text-[#8a4224]">
                  Key Takeaways for the Curious Eater:
                </span>
                <ul className="space-y-2 text-sm text-[#4d4237]">
                  {activeModalPost.keyTakeaways.map((takeaway, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <CheckCircle className="w-4 h-4 text-[#c85a32] shrink-0 mt-0.5" />
                      <span>{takeaway}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Article Content Sections */}
              <div className="space-y-8 text-base text-[#383028] leading-relaxed">
                {activeModalPost.content.map((sec, idx) => (
                  <div key={idx} className="space-y-4">
                    {sec.sectionHeading && (
                      <h3 className="font-serif text-2xl font-bold text-[#24211e] pt-2">
                        {sec.sectionHeading}
                      </h3>
                    )}
                    {sec.paragraphs.map((p, pIdx) => (
                      <p key={pIdx} className="leading-relaxed">
                        {p}
                      </p>
                    ))}
                    {sec.quote && (
                      <div className="my-6 p-5 border-l-3 border-[#c85a32] bg-[#f4ece0]/60 rounded-r-lg">
                        <Quote className="w-5 h-5 text-[#c85a32] mb-1" />
                        <p className="font-serif italic text-lg text-[#24211e]">
                          {sec.quote}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Author sign-off */}
              <div className="pt-6 border-t border-[#e2d5c5] flex items-center justify-between text-xs text-[#706356]">
                <div>
                  <span className="font-bold text-[#24211e] block">{activeModalPost.author}</span>
                  <span>{activeModalPost.authorRole} • Slow Dough Pizza Co.</span>
                </div>
                <button
                  onClick={closePostModal}
                  className="px-4 py-2 rounded-md bg-[#24211e] text-[#faf8f5] hover:bg-[#3d342d] transition-colors cursor-pointer"
                >
                  Close Essay
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
