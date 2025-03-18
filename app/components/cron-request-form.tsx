'use client'

import { useState, useEffect } from 'react'
import { useActionState } from 'react'
import { generateCronExpression } from '../actions/cron'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'
import { useToast } from "@/components/ui/use-toast"

interface CronRequestFormProps {
  onSuccess: (count: number) => void;
}

export function CronRequestForm({ onSuccess }: CronRequestFormProps) {
  const [state, formAction, isPending] = useActionState(generateCronExpression, null)
  const [prompt, setPrompt] = useState('')
  const [cronExpression, setCronExpression] = useState('')
  const { toast } = useToast()

  useEffect(() => {
    if (state?.success) {
      toast({
        title: "Success!",
        description: state.message,
        duration: 5000,
      })
      if (state.count) {
        onSuccess(state.count)
      }
      if (state.cronExpression) {
        setCronExpression(state.cronExpression)
      }
      // Don't clear the prompt so users can see what they entered
    } else if (state?.success === false) {
      toast({
        title: "Error",
        description: state.message,
        variant: "destructive",
        duration: 5000,
      })
    }
  }, [state, toast, onSuccess])

  const handleSubmit = async (formData: FormData) => {
    await formAction(formData)
  }

  return (
    <div className="w-full space-y-4 mb-8">
      <form action={handleSubmit} className="w-full">
        <div className="flex overflow-hidden rounded-xl bg-white/5 p-1 ring-1 ring-white/20 focus-within:ring-2 focus-within:ring-blue-500">
          <Input
            id="prompt"
            name="prompt"
            type="text"
            placeholder="Eg. Every tuesday at 3PM"
            required
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            aria-describedby="prompt-error"
            className="w-full border-0 bg-transparent text-white placeholder:text-gray-400 focus:ring-0 focus:border-transparent focus-visible:border-transparent focus:outline-none active:ring-0 active:outline-none focus-visible:ring-0 focus-visible:outline-none active:border-transparent focus-visible:ring-offset-0"
          />
          <Button 
            type="submit" 
            disabled={isPending} 
            className="bg-black hover:bg-gray-800 text-white font-semibold px-4 rounded-xl transition-all duration-300 ease-in-out focus:outline-none w-[120px]"
          >
            {isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              'Generate'
            )}
          </Button>
        </div>
      </form>
      
      {cronExpression && (
        <div className="mt-4 p-4 rounded-xl bg-white/5 ring-1 ring-white/20">
          <p className="text-sm text-gray-400 mb-1">Generated Cron Expression:</p>
          <p className="text-lg font-mono text-white">{cronExpression}</p>
        </div>
      )}
    </div>
  )
}
