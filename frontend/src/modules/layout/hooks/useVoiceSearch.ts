"use client"

import { useCallback, useEffect, useRef, useState } from "react"

type SpeechRecognitionConstructor = new () => SpeechRecognition

declare global {
  interface Window {
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
}

type UseVoiceSearchArgs = {
  language?: string
  onResult?: (value: string) => void
}

export const useVoiceSearch = ({
  language = "en-US",
  onResult,
}: UseVoiceSearchArgs = {}) => {
  const [isSupported, setIsSupported] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const onResultRef = useRef<(value: string) => void>()

  useEffect(() => {
    onResultRef.current = onResult
  }, [onResult])

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const speechWindow = window as Window & {
      SpeechRecognition?: SpeechRecognitionConstructor
    }

    const RecognitionConstructor =
      speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition

    if (!RecognitionConstructor) {
      setIsSupported(false)
      return
    }

    const recognition = new RecognitionConstructor()
    recognition.lang = language
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      setIsListening(true)
      setTranscript("")
      setError(null)
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setError(event.error)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const text = Array.from(event.results)
        .map((result) => result[0]?.transcript ?? "")
        .join(" ")
        .trim()

      setTranscript(text)

      const lastResult = event.results[event.results.length - 1]
      if (lastResult?.isFinal && text) {
        onResultRef.current?.(text)
      }
    }

    recognitionRef.current = recognition
    setIsSupported(true)

    return () => {
      recognition.stop()
      recognitionRef.current = null
    }
  }, [language])

  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      return
    }

    setTranscript("")
    setError(null)

    try {
      recognitionRef.current.start()
    } catch (err) {
      if (err instanceof DOMException && err.name === "InvalidStateError") {
        // Already started; ignore
        return
      }

      setError(err instanceof Error ? err.message : "Unable to access microphone")
    }
  }, [])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
  }, [])

  return {
    isSupported,
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
  }
}
