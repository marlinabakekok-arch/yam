class PaymentPoller {
  private pollingIntervals: Map<string, NodeJS.Timeout> = new Map()
  private readonly POLL_INTERVAL = 30000 // 30 seconds
  private readonly MAX_POLLS = 120 // 1 hour max

  startPolling(txId: string) {
    // Clear any existing polling for this txId
    this.stopPolling(txId)

    let pollCount = 0

    const poll = async () => {
      try {
        pollCount++

        // Stop polling after max attempts
        if (pollCount > this.MAX_POLLS) {
          this.stopPolling(txId)
          return
        }

        const response = await fetch(`/api/qris/status/${txId}`)
        if (!response.ok) {
          console.error('Failed to check payment status:', response.statusText)
          return
        }

        const data = await response.json()

        // Dispatch custom event with updated status
        window.dispatchEvent(new CustomEvent('transaction-updated', {
          detail: { txId, status: data.status }
        }))

        // Stop polling if payment is completed or failed
        if (data.status === 'success' || data.status === 'failed' || data.status === 'cancelled') {
          this.stopPolling(txId)
        }
      } catch (error) {
        console.error('Error polling payment status:', error)
      }
    }

    // Start polling immediately, then every POLL_INTERVAL
    poll()
    const interval = setInterval(poll, this.POLL_INTERVAL)
    this.pollingIntervals.set(txId, interval)
  }

  stopPolling(txId: string) {
    const interval = this.pollingIntervals.get(txId)
    if (interval) {
      clearInterval(interval)
      this.pollingIntervals.delete(txId)
    }
  }

  stopAllPolling() {
    for (const [txId, interval] of this.pollingIntervals) {
      clearInterval(interval)
    }
    this.pollingIntervals.clear()
  }
}

export const paymentPoller = new PaymentPoller()
