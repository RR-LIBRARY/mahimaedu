import { useEffect } from "react";

interface PlyrPlayerProps {
  videoId: string;
  poster?: string;
}

const PlyrPlayer = ({ videoId, poster }: PlyrPlayerProps) => {
  useEffect(() => {
    const style = document.createElement("style");
    style.id = "video-saffron-theme";
    style.textContent = `
      .video-container iframe {
        width: 100%;
        height: 100%;
        border: none;
      }
    `;
    if (!document.getElementById("video-saffron-theme")) {
      document.head.appendChild(style);
    }
  }, []);

  return (
    <div className="relative rounded-xl overflow-hidden shadow-2xl bg-black">
      <div className="aspect-video video-container">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&color=white`}
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          className="w-full h-full"
        />
      </div>
      <div className="absolute top-4 right-4 text-white/30 text-sm font-semibold pointer-events-none z-10">
        Mahima Academy
      </div>
    </div>
  );
};

export default PlyrPlayer;
