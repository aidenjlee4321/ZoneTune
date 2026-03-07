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

let access_token = "BQBIbgtV5R__myzqLTYLRbOYNnvxd4nFMQltC-Q7J4t7W0irdEzFJOpJgA0iGbpboJqelSbD8bxYa8eM3nYmBsc32QpJk0au4p0fKGE_GmnVCveZSLaeM07JlgXP0FEfNjSN1P2dbCE"

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

/*TO FINISH*/
async function addToPlaylist() {
  const res = await axios.get(
    "https://api.spotify.com/v1/me/player/currently-playing",
    {
      headers: { Authorization: `Bearer ${access_token}` }
    }
  )
  return res.data
}
async function deleteFromPlaylist() {
  const res = await axios.get(
    "https://api.spotify.com/v1/me/player/currently-playing",
    {
      headers: { Authorization: `Bearer ${access_token}` }
    }
  )
  return res.data
}


module.exports = {
  setAccessToken,
  getCurrentSong,
  skipSong,
  pauseSong
}