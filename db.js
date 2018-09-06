let mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/sp-scripts');

let db = mongoose.connection;
let Schema = mongoose.Schema;

let ScriptModelSchema = new Schema({
  name: String,
  season: Number,
  episode: Number,
  lines: [{
      character: String,
      line: String
  }]
  
});

ScriptModel = mongoose.model('ScriptModel', ScriptModelSchema);

module.exports = {
  saveScript: async function(scriptObj) {
    let toInsert = [];
    for(let i in scriptObj) {
      let season = scriptObj[i];
      for(let j in season) {
        let episode = season[j];
        episode.name = "S" + (parseInt(i)+1) + "E" + (parseInt(j)+1);
        episode.season = parseInt(i)+1;
        episode.episode = parseInt(j)+1;
      }
      toInsert = toInsert.concat(season)
    }
    console.log("MONGODB: attempting to insert " + toInsert.length + " records...")
    ScriptModel.insertMany(toInsert, (err, docs) => {
      if (err) {
        console.log("MONGODB ERROR: " + err)
      }
      // console.log(docs[0])
      console.log("MONGODB: " + docs.length + " records inserted.");
      if(docs.length != toInsert.length) {
        console.log("MONGODB WARNING: not all records inserted successfully!");
      }
      else {
        console.log("MONGODB: all records inserted successfully.")
      }
      mongoose.connection.close();
      console.log("MONGODB: connection closed.")
    }); 
  }
}