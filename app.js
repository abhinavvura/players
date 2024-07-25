let express = require('express')
let sqlite3 = require('sqlite3')
let {open} = require('sqlite')
let path = require('path')

let db = null
let file_path = path.join(__dirname, 'cricketMatchDetails.db')
let app = express()
app.use(express.json())

let connectdbandserver = async () => {
  try {
    db = await open({
      filename: file_path,
      driver: sqlite3.Database,
    })

    app.listen(3000, () => {
      console.log('Server Connected')
    })
  } catch (e) {
    console.log(e)
  }
}

connectdbandserver()

function json(i) {
  return {
    playerId: i.player_id,
    playerName: i.player_name,
  }
}

app.get('/players/', async (req, rsp) => {
  let qry = `select * from player_details`
  let db_run = await db.all(qry)
  rsp.send(db_run.map(i => json(i)))
})

app.get('/players/:playerId/', async (req, rsp) => {
  let {playerId} = req.params
  let qry = `select * from player_details where player_id = ${playerId}`
  let db_run = [await db.get(qry)]
  rsp.send(db_run.map(i => json(i))[0])
})

app.put('/players/:playerId/', async (req, rsp) => {
  let {playerId} = req.params
  let {playerName} = req.body
  let qry = `update player_details set player_name	='${playerName}' where player_id = ${playerId}`
  let db_run = await db.run(qry)
  rsp.send('Player Details Updated')
})

function json2(i) {
  return {
    matchId: i.match_id,
    match: i.match,
    year: i.year,
  }
}
app.get('/matches/:matchId/', async (req, rsp) => {
  let {matchId} = req.params
  let qry = `select * from match_details  where match_id = ${matchId}`
  let db_run = [await db.get(qry)]
  rsp.send(db_run.map(i => json2(i))[0])
})

app.get('/players/:playerId/matches', async (req, rsp) => {
  let {playerId} = req.params
  let qry = `select * from match_details  where match_id in (select match_id from player_match_score where player_id = ${playerId}) `
  let db_run = await db.all(qry)
  rsp.send(db_run.map(i => json2(i)))
})

app.get('/matches/:matchId/players', async (req, rsp) => {
  let {matchId} = req.params
  let qry = `select * from player_details  where player_id in (select player_id from player_match_score  where match_id = ${matchId}) `
  let db_run = await db.all(qry)
  rsp.send(db_run.map(i => json(i)))
})

app.get('/players/:playerId/playerScores/', async (req, rsp) => {
  let {playerId} = req.params

  let qry = `select t.player_id as playerId,t.player_name as playerName,sum(pms.score) as totalScore,sum(pms.fours) as totalFours,sum(pms.sixes) as totalSixes from player_match_score pms inner join player_details t on t.player_id = pms.player_id;`
  let db_run = await db.get(qry)

  rsp.send(db_run)
})

module.exports = app
