"use client"

import { useState, useEffect } from "react"
import { XIcon } from "./icons/x-icon"
import { InstagramIcon } from "./icons/instagram-icon"
import { DiscordIcon } from "./icons/discord-icon"
import { FacebookIcon } from "./icons/facebook-icon"
import { LinkedInIcon } from "./icons/linkedin-icon"
import { Avatar } from "./avatar"
import { SocialIcon } from "./social-icon"
import { CronForm } from "./cron-form"
import { CronHistory } from "./cron-history"
import type { CronHistoryEntry } from "../types/cron"

export function CronGenerator() {
  const [generationCount, setGenerationCount] = useState(100)
  const [history, setHistory] = useState<CronHistoryEntry[]>([])

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch('/api/history')
        const data = await response.json()
        setHistory(data)
      } catch (error) {
        console.error('Error fetching history:', error)
      }
    }
    fetchHistory()
  }, [])

  const handleSuccess = (count: number) => {
    setGenerationCount(count)
  }

  return (
    <div className="w-full max-w-xl mx-auto p-8 flex flex-col justify-between min-h-screen">
      <div className="flex-1 flex flex-col justify-center items-center text-center">
        <div>
        </div>
        <div>
          <p className="text-4xl mb-8 text-gray-300">
          Create cron expressions from natural language descriptions
          </p>
        </div>
        <div className="w-full">
          <CronForm onSuccess={handleSuccess} />
          <CronHistory history={history} />
        </div>
        <div>
          <div className="flex items-center justify-center mt-8">
            <div className="flex -space-x-2 mr-4">
              <Avatar initials="JD" index={0} />
              <Avatar initials="AS" index={1} />
              <Avatar initials="MK" index={2} />
            </div>
            <p className="text-white font-semibold">{generationCount}+ generated cron expressions</p>
          </div>
        </div>
      </div>
      <div className="pt-8 flex justify-center space-x-6">
        <SocialIcon
          href="https://x.com"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="X (formerly Twitter)"
          icon={<XIcon className="w-6 h-6" />}
        />
        <SocialIcon
          href="https://linkedin.com"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="LinkedIn"
          icon={<LinkedInIcon className="w-6 h-6" />}
        />
      </div>
    </div>
  )
}