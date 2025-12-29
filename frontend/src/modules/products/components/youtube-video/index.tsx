type YouTubeVideoProps = {
  videoUrl?: string | null
}

const YouTubeVideo = ({ videoUrl }: YouTubeVideoProps) => {
  if (!videoUrl) {
    return null
  }

  const videoId = extractVideoId(videoUrl)

  if (!videoId) {
    return null
  }

  return (
    <div className="w-full rounded-xl overflow-hidden my-6">
      <div className="aspect-video w-full">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}`}
          title="YouTube video player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
          className="w-full h-full border-0"
        />
      </div>
    </div>
  )
}

const extractVideoId = (url: string): string | null => {
  if (!url || typeof url !== "string") {
    return null
  }

  // Match various YouTube URL formats:
  // - youtube.com/watch?v=VIDEO_ID
  // - youtu.be/VIDEO_ID
  // - youtube.com/embed/VIDEO_ID
  // - youtube.com/v/VIDEO_ID
  // - Direct video ID (11 characters)
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }

  return null
}

export default YouTubeVideo
