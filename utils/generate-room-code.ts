export function generateRoomCode(): string {
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789'
  const length = 6
  let result = ''
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length)
    result += characters[randomIndex]
  }
  
  return result
}

