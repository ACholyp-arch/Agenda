const clientId = "767b285b46a5456bb19d3e9e04052285";
const redirectUri = "https://acholyp-arch.github.io/Agenda/";

// LOGIN (Implicit Grant)
function loginSpotify() {
    const scopes = [
        "user-read-playback-state",
        "user-read-currently-playing"
    ];

    const authUrl =
        "https://accounts.spotify.com/authorize" +
        "?response_type=token" +
        "&client_id=" + encodeURIComponent(clientId) +
        "&scope=" + encodeURIComponent(scopes.join(" ")) +
        "&redirect_uri=" + encodeURIComponent(redirectUri);

    window.location.href = authUrl;
}

// SI VOLVEMOS DEL LOGIN → GUARDAR TOKEN
if (window.location.hash.includes("access_token")) {
    const params = new URLSearchParams(window.location.hash.substring(1));
    const token = params.get("access_token");
    localStorage.setItem("spotify_token", token);

    // limpiar el hash (#)
    window.location.hash = "";

    console.log("Token guardado:", token);
}

// LEER TOKEN LOCAL
let token = localStorage.getItem("spotify_token");

if (token) {
    getCurrentSong();
    setInterval(getCurrentSong, 5000);
}

// FUNCIÓN PRINCIPAL
function getCurrentSong() {
    fetch("https://api.spotify.com/v1/me/player/currently-playing", {
        headers: { Authorization: "Bearer " + token }
    })
    .then(res => {
        if (res.status === 204) {
            document.getElementById("nowPlaying").innerHTML = "Nada se está reproduciendo.";
            return null;
        }
        return res.json();
    })
    .then(data => {
        if (!data || !data.item) return;

        const song = data.item;
        const progress = data.progress_ms;
        const duration = song.duration_ms;

        const html = `
            <div class="now-playing-container">
                <img src="${song.album.images[0].url}" class="album-cover">

                <div class="track-info">
                    <h3>${song.name}</h3>
                    <p>${song.artists.map(a => a.name).join(", ")}</p>

                    <div class="progress-container">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width:${(progress / duration) * 100}%"></div>
                        </div>
                        <div class="progress-times">
                            <span>${msToTime(progress)}</span>
                            <span>${msToTime(duration)}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById("nowPlaying").innerHTML = html;
    })
    .catch(err => {
        console.error("Spotify error:", err);
    });
}

// FORMATEO DE TIEMPO
function msToTime(ms) {
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
}
