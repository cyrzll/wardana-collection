export const useAlert = () => {
  const isOpen = useState<boolean>('alert-is-open', () => false)
  const message = useState<string>('alert-message', () => '')
  const title = useState<string>('alert-title', () => 'Notification')
  const type = useState<string>('alert-type', () => 'info') // info, success, error, warning
  const isConfirm = useState<boolean>('alert-is-confirm', () => false)
  const onConfirm = useState<any>('alert-on-confirm', () => null)

  const showAlert = (msg: string, t: string = 'info', ttl: string = 'Notification') => {
    message.value = msg
    type.value = t
    title.value = ttl
    isConfirm.value = false
    isOpen.value = true
    
    setTimeout(() => {
      if (!isConfirm.value) isOpen.value = false
    }, 5000)
  }

  const showConfirm = (msg: string, onOk: () => void, ttl: string = 'Confirmation') => {
    message.value = msg
    type.value = 'warning'
    title.value = ttl
    isConfirm.value = true
    onConfirm.value = onOk
    isOpen.value = true
  }

  const closeAlert = () => {
    isOpen.value = false
  }

  const handleConfirm = () => {
    if (onConfirm.value) onConfirm.value()
    isOpen.value = false
  }

  return {
    isOpen,
    message,
    title,
    type,
    isConfirm,
    showAlert,
    showConfirm,
    closeAlert,
    handleConfirm
  }
}
