'use client'

import { useEffect, useState } from 'react'
import type { CronHistoryEntry } from '../types/cron'
import { formatDistanceToNow } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Copy, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface CronHistoryProps {
  history: CronHistoryEntry[]
}

export function CronHistory({ history }: CronHistoryProps) {
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set())
  const { toast } = useToast()

  const handleCopy = async (expression: string) => {
    await navigator.clipboard.writeText(expression)
    toast({
      title: "Copied!",
      description: "Cron expression copied to clipboard",
      duration: 2000,
    })
  }

  const toggleExpand = (id: string) => {
    setExpandedEntries(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  return (
    <div className="space-y-2 mt-8">
      {history.slice(0, 5).map((entry, index) => {
        const isExpanded = expandedEntries.has(entry.id)
        return (
          <div
            key={entry.id}
            className={`p-2 rounded-lg ${entry.isNonsensical ? 'bg-purple-900/30' : 'bg-white/5'} ring-1 ${entry.isNonsensical ? 'ring-purple-500/30' : 'ring-white/20'} transition-all duration-300 ${index === 0 ? 'bg-blue-500/20' : ''}`}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0 flex-1 max-w-full text-center">
                <p className="text-xs text-gray-400 whitespace-nowrap shrink-0">
                  {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })}
                </p>
                <p className={`text-base font-mono font-medium truncate flex-1 ${entry.isNonsensical ? 'text-purple-300' : 'text-white'}`}>
                  {entry.expression.split('#')[0].trim()}
                </p>
              </div>
              <div className="flex items-center space-x-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleCopy(entry.expression)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => toggleExpand(entry.id)}
                >
                  {expandedEntries.has(entry.id) ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            {expandedEntries.has(entry.id) && (
              <div className="mt-2 pt-2 border-t border-white/10 space-y-2">
                <p className="text-sm text-gray-400">{entry.prompt}</p>
                {entry.comment && (
                  <p className="text-xs text-purple-300 italic">{entry.comment}</p>
                )}
                {entry.isNonsensical && entry.responseMessage && (
                  <p className="text-purple-300 font-medium">{entry.responseMessage}</p>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  );
}
