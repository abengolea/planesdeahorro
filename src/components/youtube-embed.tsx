type YoutubeEmbedProps = {
  videoId: string;
  title: string;
};

export function YoutubeEmbed({ videoId, title }: YoutubeEmbedProps) {
  return (
    <div className="relative w-full overflow-hidden rounded-lg border border-border bg-muted shadow-sm">
      <div className="relative aspect-video w-full">
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube.com/embed/${encodeURIComponent(videoId)}?rel=0`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    </div>
  );
}
