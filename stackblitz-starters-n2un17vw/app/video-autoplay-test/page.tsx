export default function VideoAutoplayTest() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#000",
        display: "grid",
        placeItems: "center",
        margin: 0,
      }}
    >
      <video
        src="https://vosko-cdn.b-cdn.net/hero_web_4k_hevc.mp4"
        autoPlay
        muted
        playsInline
        controls
        preload="auto"
        loop
        style={{ width: "100vw", height: "100vh", objectFit: "contain", background: "#000" }}
      />
    </main>
  );
}
