const express = require("express")
const axios = require("axios")
const app = express()

app.use(express.json())

//Redo at 11

const token = "BQBIbgtV5R__myzqLTYLRbOYNnvxd4nFMQltC-Q7J4t7W0irdEzFJOpJgA0iGbpboJqelSbD8bxYa8eM3nYmBsc32QpJk0au4p0fKGE_GmnVCveZSLaeM07JlgXP0FEfNjSN1P2dbCE"

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
/*curl -X POST "https://accounts.spotify.com/api/token" \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "grant_type=client_credentials&client_id=c84c3887954a474287977775f490bfed&client_secret=ec519f13424d4f29a9d632dd3c65066c"
*/


app.listen(3001)
