export const toast = {
  success: (message: string) => {
    console.log('✅ Success:', message)
    // In a real implementation, you'd use a toast library like sonner or react-hot-toast
    alert(`Success: ${message}`)
  },
  error: (message: string) => {
    console.log('❌ Error:', message)
    alert(`Error: ${message}`)
  },
  info: (message: string) => {
    console.log('ℹ️ Info:', message)
    alert(`Info: ${message}`)
  }
}