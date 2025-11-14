/**
 * NFT Timeline Component
 * Shows offer history in a clean, organized timeline
 * Uses progressive disclosure to avoid information overload
 */

'use client'

import { useState } from 'react'
import { useOfferTimeline, type OfferTimeline } from '@/lib/hooks/useOfferHistory'
import { formatUnits } from 'ethers'
import type { TradingEvent } from '@/lib/services/explorer-api'

interface NFTTimelineProps {
  tokenId: number
}

export function NFTTimeline({ tokenId }: NFTTimelineProps) {
  const { timeline, isLoading, error } = useOfferTimeline(tokenId)

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#daa520] mx-auto mb-4"></div>
        <p className="text-gray-400">Loading history...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 text-center">
        <p className="text-red-400">Failed to load history. Please try again.</p>
      </div>
    )
  }

  if (!timeline || timeline.length === 0) {
    return (
      <div className="bg-gray-900/60 rounded-lg border border-gray-700/50 p-8 text-center">
        <div className="text-6xl mb-4">📜</div>
        <p className="text-xl font-fredoka text-gray-400 mb-2">No history yet</p>
        <p className="text-sm text-gray-500">Be the first to make an offer on this NFT!</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-[#daa520] font-fredoka">
          📜 Offer History ({timeline.length})
        </h3>
        <p className="text-xs text-gray-500">Newest first</p>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-700"></div>

        {/* Timeline items */}
        <div className="space-y-6">
          {timeline.map((offer) => (
            <TimelineItem key={offer.offerId} offer={offer} />
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * Individual timeline item (one offer)
 */
function TimelineItem({ offer }: { offer: OfferTimeline }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="relative pl-12">
      {/* Timeline dot */}
      <div
        className={`absolute left-[7px] w-6 h-6 rounded-full border-4 border-gray-900 ${getStatusColor(
          offer.status
        )}`}
      />

      {/* Card */}
      <div className="bg-gray-900/60 rounded-lg border border-gray-700/50 hover:border-gray-600/50 transition">
        {/* Header */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full p-4 text-left flex items-start justify-between gap-4"
        >
          <div className="flex-1 min-w-0">
            {/* Status and date */}
            <div className="flex items-center gap-3 mb-2">
              <StatusBadge status={offer.status} />
              <span className="text-xs text-gray-500">
                {formatDate(offer.createdAt)}
              </span>
            </div>

            {/* Offer details */}
            <div className="space-y-1">
              <p className="text-sm text-gray-300">
                <span className="text-gray-500">Offer #</span>
                <span className="text-white font-mono">{offer.offerId}</span>
              </p>
              <p className="text-lg font-bold text-[#daa520]">
                {formatUnits(offer.offerPrice, 18)} TECH
              </p>
              <p className="text-xs text-gray-500">
                {offer.amount} voucher{offer.amount !== '1' ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Expand icon */}
          <div className="flex-shrink-0 text-gray-400">
            {expanded ? '▲' : '▼'}
          </div>
        </button>

        {/* Expanded details */}
        {expanded && (
          <div className="px-4 pb-4 border-t border-gray-700/50 pt-4">
            <div className="space-y-3">
              {/* Parties involved */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <InfoRow label="Offerer" value={offer.offerer} isAddress />
                <InfoRow label="Voucher Owner" value={offer.voucherOwner} isAddress />
              </div>

              {/* Event history */}
              {offer.events.length > 1 && (
                <div className="mt-4 pt-4 border-t border-gray-700/50">
                  <h5 className="text-sm font-bold text-gray-300 mb-3">
                    📋 Event History ({offer.events.length})
                  </h5>
                  <div className="space-y-2">
                    {offer.events.map((event, i) => (
                      <EventRow key={i} event={event} />
                    ))}
                  </div>
                </div>
              )}

              {/* Transaction link */}
              <a
                href={`https://explorer.bf1337.org/tx/${offer.events[0].transactionHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#daa520] hover:underline inline-flex items-center gap-1"
              >
                View on Explorer →
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Status badge
 */
function StatusBadge({ status }: { status: OfferTimeline['status'] }) {
  const config = {
    active: { label: 'Active', bg: 'bg-blue-500/20', text: 'text-blue-400', icon: '🔄' },
    accepted: { label: 'Accepted', bg: 'bg-green-500/20', text: 'text-green-400', icon: '✅' },
    cancelled: { label: 'Cancelled', bg: 'bg-gray-500/20', text: 'text-gray-400', icon: '❌' },
    rejected: { label: 'Rejected', bg: 'bg-red-500/20', text: 'text-red-400', icon: '🚫' },
  }

  const { label, bg, text, icon } = config[status]

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${bg} ${text}`}>
      <span>{icon}</span>
      <span>{label}</span>
    </span>
  )
}

/**
 * Info row for key-value pairs
 */
function InfoRow({ label, value, isAddress }: { label: string; value: string; isAddress?: boolean }) {
  const displayValue = isAddress ? shortenAddress(value) : value

  return (
    <div>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-sm text-white font-mono" title={value}>
        {displayValue}
      </p>
    </div>
  )
}

/**
 * Event row (shows individual events in timeline)
 */
function EventRow({ event }: { event: TradingEvent }) {
  return (
    <div className="flex items-center gap-3 text-xs bg-gray-800/50 rounded p-2">
      <span className="flex-shrink-0">{getEventIcon(event.eventType)}</span>
      <div className="flex-1 min-w-0">
        <p className="text-gray-300">{getEventLabel(event.eventType)}</p>
        <p className="text-gray-500">{formatDate(event.timestamp)}</p>
      </div>
      <a
        href={`https://explorer.bf1337.org/tx/${event.transactionHash}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[#daa520] hover:underline flex-shrink-0"
      >
        TX →
      </a>
    </div>
  )
}

/**
 * Helper functions
 */
function getStatusColor(status: OfferTimeline['status']): string {
  switch (status) {
    case 'active':
      return 'bg-blue-500'
    case 'accepted':
      return 'bg-green-500'
    case 'cancelled':
      return 'bg-gray-500'
    case 'rejected':
      return 'bg-red-500'
  }
}

function getEventIcon(eventType: TradingEvent['eventType']): string {
  switch (eventType) {
    case 'OfferMade':
      return '💰'
    case 'OfferAccepted':
      return '✅'
    case 'OfferCancelled':
      return '❌'
    case 'OfferRejected':
      return '🚫'
    case 'VoucherSold':
      return '💸'
    case 'VoucherListed':
      return '🏪'
    case 'ListingCancelled':
      return '🚫'
  }
}

function getEventLabel(eventType: TradingEvent['eventType']): string {
  switch (eventType) {
    case 'OfferMade':
      return 'Offer Created'
    case 'OfferAccepted':
      return 'Offer Accepted'
    case 'OfferCancelled':
      return 'Offer Cancelled'
    case 'OfferRejected':
      return 'Offer Rejected'
    case 'VoucherSold':
      return 'Voucher Sold'
    case 'VoucherListed':
      return 'Voucher Listed'
    case 'ListingCancelled':
      return 'Listing Cancelled'
  }
}

function shortenAddress(address: string): string {
  if (address === '0x0000000000000000000000000000000000000000') {
    return 'Anyone'
  }
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp * 1000)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`

  return date.toLocaleDateString()
}
