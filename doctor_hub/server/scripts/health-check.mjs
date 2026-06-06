const baseUrl = process.env.API_URL || 'http://localhost:5050'

const run = async () => {
  const response = await fetch(`${baseUrl}/api/health`)
  if (!response.ok) {
    throw new Error(`Health check failed: ${response.status}`)
  }
  const payload = await response.json().catch(() => ({}))
  if (!payload?.ok) {
    throw new Error('Health check failed: invalid response.')
  }
  console.log(`Health check OK at ${baseUrl}`)
}

run().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
