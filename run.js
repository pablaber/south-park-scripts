const cheerio = require('cheerio');
const request = require('request');

const db = require('./db');

const DEBUG = false;

const SP_BASE_URL = "http://southpark.wikia.com"
const SCRIPTS_BASE_URL = "http://southpark.wikia.com/wiki/Portal:Scripts";
const GALLERY_ID = "#gallery-0"
const GALLERY_ITEM = ".wikia-gallery-item";
const SEASON_LINK_CLASS = ".link-internal";

run();

async function run() {
  var scriptObjects = await getScriptObjects();
  var json = JSON.stringify(scriptObjects);
  db.saveScript(scriptObjects);
}

function getScriptObjects() {
  return new Promise((resolve, reject) => {
    getSeasonPromises().then(function (seasonPromises, error) {
      if(error) {
        reject(error);
      }
      Promise.all(seasonPromises).then(async function(seasonEpisodeUrls) {

        if (DEBUG) {
          seasonEpisodeUrls = seasonEpisodeUrls.slice(0, 3);
        }

        let allSeasons = [];
        for(let season of seasonEpisodeUrls) {
          if (DEBUG) {
            season = season.slice(0, 3)
          }
          let seasonEpisodes = await getEpisodes(season);
          allSeasons.push(seasonEpisodes);
        }
        resolve(allSeasons)
      });
    });
  });
}

function getSeasonPromises() {
  return new Promise(function (resolve, reject) {
    getSeasonUrls().then(function (seasonUrls, error) {
      var seasonPromises = [];
      seasonUrls.forEach(function (url) {
        var seasonPromise = new Promise(function (innerResolve, innerReject) {
          request(SP_BASE_URL + url, function (error, resopnse, body) {
            let episodeUrls = [];
            const $ = cheerio.load(body);
            $(GALLERY_ID).children(GALLERY_ITEM).each(function (i, elem) {
              episodeUrls.push($(this).find(SEASON_LINK_CLASS).attr('href'));
            });
            innerResolve(episodeUrls);
          });
        });
        seasonPromises.push(seasonPromise);
      });
      resolve(seasonPromises);
    })
  });

}

function getSeasonUrls() {
  return new Promise(function (resolve, reject) {
    request(SCRIPTS_BASE_URL, function (error, response, body) {
      let seasonUrls = [];
      const $ = cheerio.load(body);
      $(GALLERY_ID).children(GALLERY_ITEM).each(function (i, elem) {
        seasonUrls.push($(this).find(SEASON_LINK_CLASS).attr('href'));
      });
      resolve(seasonUrls);
    });
  });
}

function getEpisodes(season) {
  return new Promise(async function(resolve, reject) {
    let seasonEpisodes = [];
    for (let episodeUrl of season) {
      try {
        let fullUrl = SP_BASE_URL + episodeUrl;
        console.log("SCRAPE:  " + fullUrl);
        let scriptObj = await getScriptFromUrl(fullUrl);
        seasonEpisodes.push(scriptObj);
      }
      catch (error){
        console.log(error);
        continue;
      }
    }
    resolve(seasonEpisodes);
  })
}

function getScriptFromUrl(url) {
  return new Promise(function(resolve, reject) {
    request(url, function (error, response, body) {
      let scriptObj = {
        episode: "placeholder",
        lines: []
      };
      const $ = cheerio.load(body);
      var tbody = $('#WikiaArticle')
        .children('.mw-content-text').first()
        .children('div').first('div').next().next()
        .children('table').first().children('tbody').first();
      tbody.children('tr').each((index, element) => {
        let tdCharacter = $(element).children('td').first();
        let tdLine = tdCharacter.next();
        let character = tdCharacter.text().trim();
        let line = tdLine.text().trim();
        scriptObj.lines.push({
          c: character,
          l: line
        })
      })
      scriptObj.lines = scriptObj.lines.filter((value) => {
        return !!value.c && !!value.l;
      });
      if(scriptObj.length == 0) {
        reject("ERROR: empty object from " + url);
      }
      resolve(scriptObj);
    })
  })
}
  

