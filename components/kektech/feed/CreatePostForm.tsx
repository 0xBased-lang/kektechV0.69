/**
 * KEKTECH 3.0 - Create Post Form
 * Twitter-style post creation form
 */
'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { Send, Image as ImageIcon, Link as LinkIcon, X } from 'lucide-react';

const MAX_POST_LENGTH = 500;

/**
 * Post creation form component
 */
export function CreatePostForm() {
  const { address } = useAccount();
  const [content, setContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const remainingChars = MAX_POST_LENGTH - content.length;
  const isOverLimit = remainingChars < 0;
  const isEmpty = content.trim().length === 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEmpty || isOverLimit || !address) return;

    setIsPosting(true);
    try {
      // TODO: Implement actual post submission
      console.log('Posting:', { content, userAddress: address });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Clear form on success
      setContent('');
      setShowAdvanced(false);

      // TODO: Refresh feed
    } catch (error) {
      console.error('Failed to create post:', error);
      // TODO: Show error message
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="terminal-card p-4">
      <form onSubmit={handleSubmit}>
        {/* User Info */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-kek-green/10 border border-kek-green/20 flex items-center justify-center flex-shrink-0">
            <span className="text-kek-green font-bold text-sm">
              {address ? address.slice(2, 4).toUpperCase() : '??'}
            </span>
          </div>

          <div className="flex-1">
            {/* Text Area */}
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's happening in the markets?"
              className="w-full min-h-[100px] bg-transparent border-none text-terminal-primary placeholder:text-terminal-tertiary focus:outline-none resize-none text-sm"
              disabled={isPosting}
            />

            {/* Character Counter */}
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2">
                {/* Advanced Options Toggle */}
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="p-2 hover:bg-terminal-elevated rounded transition"
                  title="Advanced options"
                >
                  <ImageIcon className="w-4 h-4 text-terminal-tertiary hover:text-[#3fb8bd] transition" />
                </button>
                <button
                  type="button"
                  className="p-2 hover:bg-terminal-elevated rounded transition"
                  title="Add link"
                >
                  <LinkIcon className="w-4 h-4 text-terminal-tertiary hover:text-kek-green transition" />
                </button>
              </div>

              <span className={`text-xs mono-numbers font-semibold ${
                isOverLimit
                  ? 'text-bearish'
                  : remainingChars < 50
                  ? 'text-[#d29922]'
                  : 'text-terminal-tertiary'
              }`}>
                {remainingChars}
              </span>
            </div>

            {/* Advanced Options */}
            {showAdvanced && (
              <div className="mt-3 p-3 bg-terminal-elevated rounded-lg border border-terminal">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-terminal-primary">Advanced Options</h4>
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(false)}
                    className="p-1 hover:bg-terminal-bg-hover rounded transition"
                  >
                    <X className="w-3 h-3 text-terminal-tertiary" />
                  </button>
                </div>
                <p className="text-xs text-terminal-tertiary">
                  Advanced posting options coming soon: images, polls, market references
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-terminal">
          {!isEmpty && (
            <button
              type="button"
              onClick={() => {
                setContent('');
                setShowAdvanced(false);
              }}
              className="px-4 py-2 text-sm font-medium text-terminal-tertiary hover:text-terminal-secondary transition"
              disabled={isPosting}
            >
              Clear
            </button>
          )}

          <button
            type="submit"
            disabled={isEmpty || isOverLimit || isPosting}
            className={`
              px-6 py-2 rounded-lg font-semibold text-sm transition flex items-center gap-2
              ${isEmpty || isOverLimit || isPosting
                ? 'bg-terminal-elevated text-terminal-tertiary cursor-not-allowed'
                : 'bg-kek-green hover:bg-kek-green/90 text-terminal-black shadow-lg shadow-kek-green/10'
              }
            `}
          >
            {isPosting ? (
              <>
                <div className="w-4 h-4 border-2 border-terminal-black/20 border-t-terminal-black rounded-full animate-spin" />
                Posting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Post
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
