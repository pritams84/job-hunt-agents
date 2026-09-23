import { useState, useCallback } from 'react'

export type AgentOperationalState =
  | 'idle'
  | 'discovering'
  | 'matching'
  | 'tailoring'
  | 'submitting'
  | 'paused'
  | 'emergency_stopped'

export interface AgentMetricSnapshot {
  jobsScanned: number
  jobsMatched: number
  applicationsSubmitted: number
  captchaEncounters: number
}

export function useAgentStatus() {
  const [state, setState] = useState<AgentOperationalState>('idle')
  const [activeStepText, setActiveStepText] = useState<string>('Ready for assignment')
  const [metrics, setMetrics] = useState<AgentMetricSnapshot>({
    jobsScanned: 0,
    jobsMatched: 0,
    applicationsSubmitted: 0,
    captchaEncounters: 0,
  })

  const setOperationalState = useCallback((newState: AgentOperationalState, message?: string) => {
    setState(newState)
    if (message) {
      setActiveStepText(message)
    }
  }, [])

  const emergencyStop = useCallback(() => {
    setState('emergency_stopped')
    setActiveStepText('🚨 Emergency kill switch activated. All worker tasks terminated.')
  }, [])

  const resume = useCallback(() => {
    setState('idle')
    setActiveStepText('Agent standing by')
  }, [])

  const incrementMetric = useCallback((key: keyof AgentMetricSnapshot, delta: number = 1) => {
    setMetrics((prev) => ({
      ...prev,
      [key]: prev[key] + delta,
    }))
  }, [])

  return {
    state,
    activeStepText,
    metrics,
    isBusy: state === 'discovering' || state === 'matching' || state === 'tailoring' || state === 'submitting',
    isEmergencyStopped: state === 'emergency_stopped',
    isPaused: state === 'paused',
    setOperationalState,
    emergencyStop,
    resume,
    incrementMetric,
  }
}
