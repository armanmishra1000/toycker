export default function medusaError(error: any): never {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    const u = new URL(error.config.url, error.config.baseURL)
    console.error("Resource:", u.toString())
    console.error("Response data:", error.response.data)
    console.error("Status code:", error.response.status)

    // Extracting the error message from the response data
    const message =
      error.response.data.message ||
      error.response.data.error ||
      error.response.data

    throw new Error(String(message).charAt(0).toUpperCase() + String(message).slice(1) + ".")
  } else if (error.request) {
    // The request was made but no response was received
    // IMPORTANT: Do not throw error.request as it is not serializable and causes 500 errors in Next.js 15 Server Actions
    console.error("No response received for request:", error.config?.url)
    throw new Error(
      "No response received from the server. Please check your backend connection and environment variables."
    )
  } else {
    // Something happened in setting up the request that triggered an Error
    console.error("Request setup error:", error.message)
    throw new Error("Error setting up the request: " + error.message)
  }
}
