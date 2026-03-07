const express = require("express")
const axios = require("axios")
const app = express()

app.use(express.json())

//Do later

const token = "SPOTIFY_ACCESS_TOKEN"

app.post("/next", async (req,res) => {
  await axios.post(
    "https://api.spotify.com/v1/me/player/next",
    {},
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  )
  res.send("Skipped song")
})

app.listen(3001)
