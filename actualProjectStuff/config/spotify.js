/*
Make later

getCurrentSong()
skipSong()
playTrack()
pausePlayback()
deleteFromPlaylist()
addToPlaylist()
*/
const axios = require("axios")

let access_token = "BQAIeULPkBnc01gwzhNHzr7wtE6ZkG0jp4YD7EjA3UVLN-cjyU0n7eny5MKCcPj-3FByvE0JDaHsMsemMFt-vJSwa_0_E7_p3mztcf0rDgsI3OQUpzT0w3ZD91gHm_s6yLROOUbX7xw"
function setAccessToken(token) {
  access_token = token
}
async function getCurrentSong() {
  const res = await axios.get(
    "https://api.spotify.com/v1/me/player/currently-playing",
    {
      headers: { Authorization: `Bearer ${access_token}` }
    }
  )
  return res.data
}
async function skipSong() {
  await axios.post(
    "https://api.spotify.com/v1/me/player/next",
    {},
    { headers: { Authorization: `Bearer ${access_token}` } }
  )
}
async function pauseSong() {
  await axios.put(
    "https://api.spotify.com/v1/me/player/pause",
    {},
    { headers: { Authorization: `Bearer ${access_token}` } }
  )
}

async function playSong() {
  await axios.put(
    "https://api.spotify.com/v1/me/player/play",
    {},
    { headers: { Authorization: `Bearer ${access_token}` } }
  );
}

async function addToPlaylist(trackUri) {
  // You need to specify playlist ID
  const playlistId = "YOUR_PLAYLIST_ID";
  await axios.post(
    `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
    { uris: [trackUri] },
    { headers: { Authorization: `Bearer ${access_token}` } }
  );
}

async function deleteFromPlaylist(trackUri) {
  const playlistId = "YOUR_PLAYLIST_ID";
  await axios.delete(
    `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
    {
      headers: { Authorization: `Bearer ${access_token}` },
      data: { tracks: [{ uri: trackUri }] }
    }
  );
}


module.exports = {
  setAccessToken,
  getCurrentSong,
  skipSong,
  pauseSong,
  playSong,
  addToPlaylist,
  deleteFromPlaylist
}