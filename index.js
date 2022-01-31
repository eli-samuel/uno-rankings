const Discord = require("discord.js");
const bot = new Discord.Client();
const config = require('./config.json');
const fs = require('fs');
const {
    error
} = require("console");
const filename = "players.txt";

// When a game completes
const updateEmbed = new Discord.MessageEmbed() //https://discordjs.guide/popular-topics/embeds.html
    .setColor('#E74C3C')
    .setTitle('An UNO Game has been completed')
    .setURL('https://www.discord.gg/7mbc8um')
    .setAuthor('UNO Rankings',
        'https://www.pinclipart.com/picdir/big/95-951998_worlds-smallest-uno-u-s-uno-play-card-game.png')
    .setDescription("Here are this game's results: ")
    .setThumbnail('https://www.pinclipart.com/picdir/big/95-951998_worlds-smallest-uno-u-s-uno-play-card-game.png')
    .setTimestamp()
    .setFooter(config.version);

// To view the top players
const topRankings = new Discord.MessageEmbed()
    .setColor('#E74C3C')
    .setTitle('Here are the top UNO players as of ' + new Date().toDateString())
    .setURL('https://www.discord.gg/7mbc8um')
    .setAuthor('UNO Rankings',
        'https://www.pinclipart.com/picdir/big/95-951998_worlds-smallest-uno-u-s-uno-play-card-game.png')
    .setDescription("Ranked highest to lowest.")
    .setThumbnail('https://www.pinclipart.com/picdir/big/95-951998_worlds-smallest-uno-u-s-uno-play-card-game.png')
    .setTimestamp()
    .setFooter(config.version);

// Personal player card
const profileCard = new Discord.MessageEmbed()
    .setColor('#E74C3C')
    .setTitle('Player Profile')
    .setURL('https://www.discord.gg/7mbc8um')
    .setAuthor('UNO Rankings',
        'https://www.pinclipart.com/picdir/big/95-951998_worlds-smallest-uno-u-s-uno-play-card-game.png')
    .setThumbnail('https://www.pinclipart.com/picdir/big/95-951998_worlds-smallest-uno-u-s-uno-play-card-game.png')
    .setTimestamp()
    .setFooter(config.version);

const helpEmbed = new Discord.MessageEmbed()
    .setColor('#E74C3C')
    .setTitle('UNO Commands')
    .setURL('https://www.discord.gg/7mbc8um')
    .setAuthor('UNO Rankings',
        'https://www.pinclipart.com/picdir/big/95-951998_worlds-smallest-uno-u-s-uno-play-card-game.png')
    .setDescription("All commands start with 'UNO'.")
    .addFields({
        name: '~~**add**~~',
        value: "~~add a new player to track\n*usage: UNO add 'USER'*~~ TO BE IMPLEMENTED",
        inline: false
    }, {
        name: '**game**',
        value: "update ranks after a completed game\n*usage: UNO game 'win USER' 'lose USER1' 'lose USER2' 'lose USER3'*",
        inline: false
    }, {
        name: '**help**',
        value: 'show help commands',
        inline: false
    }, {
        name: '~~**info**~~',
        value: "~~about me~~ TO BE IMPLEMENTED",
        inline: false
    }, {
        name: '**profile**',
        value: "show a player profile\n*usage: UNO profile 'USER'*",
        inline: false
    }, {
        name: '**rankings**',
        value: "show all player rankings",
        inline: false
    }, )
    .setThumbnail('https://www.pinclipart.com/picdir/big/95-951998_worlds-smallest-uno-u-s-uno-play-card-game.png')
    .setTimestamp()
    .setFooter(config.version);

bot.login(config.token);

bot.on('ready', () => {
    console.log("Logged in as " + bot.user.tag);
});

/* TODO:
    - check to see if all players exist
    - rulebook
*/

bot.on("message", msg => {
    if (msg.author == bot.user) return; // Prevent bot from responding to its own messages

    // test cases
    if (msg.content === "ayy") msg.channel.send("lmao");

    if (msg.content.startsWith(config.prefix)) {
        console.log("=======================");
        if (msg.content.includes("rankings")) { // Rankings (UNO rankings)
            let players = getPlayers();
            for (let i = 0; i < players.length; i++) {
                topRankings.addFields({
                    name: "**" + (i + 1) + ".** " + players[i][0] + " (*" + players[i][1] + "*)",
                    value: "W-L: *" + players[i][2] + "*",
                    inline: false
                });
            }
            msg.channel.send(topRankings);
            topRankings.fields = [];
        } else if (msg.content.includes("add")) { // Add player (UNO add 'username)
            msg.channel.send("Command not yet impemented.");
        } else if (msg.content.includes("profile")) { // Player profile (UNO profile 'username')
            let player = msg.content.split(" ")[2].toLowerCase();
            let rating = getRating(player);
            let WL = getWL(player);
            let allPlayers = getPlayers();
            let rank = -1;
            for (let i = 0; i < allPlayers.length; i++) {
                if (allPlayers[i][0] == player) {
                    rank = i + 1;
                    break;
                }
            }
            profileCard.addFields({
                name: "Username: " + player,
                value: "Elo: *" + rating + "*\nW-L: *" + WL + "*\nRanking: *" + rank + " out of " + allPlayers.length + "*",
                inline: false
            });
            msg.channel.send(profileCard);
            profileCard.fields = [];
        } else if (msg.content.includes("game")) { // UNO game (UNO game 'winner username' 'loser username1' 'loser username2' 'loser username3')
            // eli 100,arabel 200,beks 300
            let message = msg.content;

            let players = msg.content.split(" ");
            players.shift(); // get rid of UNO
            players.shift(); // get rid of game

            console.log(players);
            if (players.length != 4) {
                console.log("Bad number of players");
                msg.channel.send("Invalid number of players, please try again.");
                return;
            }

            let winner = players[0];
            let wOtherAvg = 0;
            for (let i = 1; i < players.length; i++) {
                wOtherAvg += getRating(players[i]);
            }
            wOtherAvg /= (players.length - 1);
            console.log("Average game rating for " + winner + ": " + wOtherAvg);
            let wRating = getRating(winner);
            let wProb = calculateProbability(wRating, wOtherAvg);
            let wElo = Math.round(adjustRating(1, winner, wProb));
            let wWinLoss = getWinLoss(1, winner);

            if (wElo > 1000) wElo = 1000;
            let wField = winner + "'s elo: **" + wElo + "** (+*" + (wElo - wRating) + "*) WINNER!";
            updateEmbed.addFields({
                name: wField,
                value: "W-L: *" + wWinLoss + "*",
                inline: false
            });
            toPrint(winner + " " + wElo + ",");

            for (let index = 1; index < players.length; index++) {
                let lOtherAvg = 0;
                for (let i = 0; i < players.length; i++) {
                    if (index == i) {
                        continue;
                    } else {
                        lOtherAvg += getRating(players[i]);
                    }
                }
                lOtherAvg /= (players.length - 1);
                //console.log("Average game rating for " + players[index] + ": " + wOtherAvg);

                let lPlayer = players[index];
                let lRating = getRating(lPlayer);
                let lProb = calculateProbability(lRating, lOtherAvg);
                let lElo = Math.round(adjustRating(0, lPlayer, lProb));
                let lWinLoss = getWinLoss(0, lPlayer);

                if (lElo < 0) lElo = 0;
                let lField = lPlayer + "'s elo: **" + lElo + "** (*" + (lElo - lRating) + "*)";
                updateEmbed.addFields({
                    name: lField,
                    value: "W-L: *" + lWinLoss + "*",
                    inline: false
                });
                toPrint(lPlayer + " " + lElo + ",");
            }

            msg.channel.send(updateEmbed);
            updateEmbed.fields = [];
        } else if (msg.content.includes("help")) { // Help embed (UNO help)
            msg.channel.send(helpEmbed);
        } else if (msg.content.includes("info")) { // Information about the bot
            msg.channel.send("Command not yet impemented.");
        } else { // Any other command
            msg.channel.send("Unkown command.")
        }
    }
});

function getPlayers() {
    let data = fs.readFileSync(filename, 'utf-8');
    let pRatings = data.split(",");

    let arr = [];
    for (let i = 0; i < pRatings.length - 1; i++) {
        arr.push(pRatings[i].split(" "));
    }
    arr = sortPlayers(arr);

    data = fs.readFileSync("WL.txt", 'utf-8');
    data = data.split(",");
    let wlArr = [];
    for (let i = 0; i < data.length; i++) {
        wlArr.push(data[i].split(" "));
    }
    for (let i = 0; i < wlArr.length - 1; i++) {
        for (let j = 0; j < arr.length; j++) {
            if (wlArr[i][0] == arr[j][0]) {
                arr[j].push(wlArr[i][1]); // adding W/L to player array
            }
        }
    }
    console.log(arr);
    return arr;
}

function sortPlayers(arr) {
    for (let i = 0; i < arr.length; i++) {
        let max = arr[i][1];
        let index = -1;
        for (let j = i; j < arr.length; j++) {
            if (arr[j][1] > max) {
                max = arr[j][1];
                index = j;
            }
        }
        if (index == -1) { // player is already in their respective spot
            continue;
        }
        let temp = arr[i];
        arr[i] = arr[index];
        arr[index] = temp;
    }
    return arr;
}

// UNO eli beks arabel bot
// UNO beks eli arabel bot
// UNO arabel eli beks bot
// UNO bot arabel eli beks

// eli 0-0,arabel 0-0,beks 0-0,bot 0-0,
// arabel 500,beks 500,eli 500,bot 500,

//arabel - beks - arabel - arabel - bot - arabel - eli - arabel

//arabel 593,beks 461,eli 470,bot 466,sacha 500,
//eli 1-7,arabel 5-3,beks 1-7,bot 1-7,sacha 0-0,
function getWinLoss(num, player) {
    const wlFile = "WL.txt";
    let data = fs.readFileSync(wlFile, 'utf-8');
    let index = data.indexOf(player);

    let WL = data.substring(index + player.length + 1, data.indexOf(",", index + player.length + 1))

    console.log("WL for " + player + ": " + WL);

    if (num == 1) {
        // add 1 to wins
        let W = Number(WL.split("-")[0]) + 1;
        WL = W + "-" + WL.split("-")[1];
    } else if (num == 0) {
        // add 1 to loss
        let L = Number(WL.split("-")[1]) + 1;
        WL = WL.split("-")[0] + "-" + L;
    } else {
        throw new error("invalid win/loss");
    }

    let firstPart = data.substring(0, index + player.length + 1);
    let replacePart = WL;
    let lastPart = data.substring(data.indexOf(",", index + player.length + 1));

    console.log("First part is " + firstPart);
    console.log("Last part is " + lastPart);

    data = firstPart + replacePart + lastPart;

    fs.writeFileSync(wlFile, data, "utf-8");

    return WL;
}

function toPrint(rank) {
    let data = fs.readFileSync(filename, 'utf-8');
    let index = data.indexOf(rank.split(" ")[0]);

    console.log("Index of " + rank.split(" ")[0] + " is " + index);
    console.log("Index of " + rank.split(" ")[1] + " is " + (index + rank.split(" ")[0].length + 1));

    let firstPart = data.substring(0, index + rank.split(" ")[0].length + 1);
    let replacePart = rank.split(" ")[1];
    let lastPart = data.substring(index + rank.length);

    console.log("First part is " + firstPart);
    console.log("Last part is " + lastPart);

    data = firstPart + replacePart + lastPart;

    fs.writeFileSync(filename, data, "utf-8");
}

function getRating(player) {
    let data = fs.readFileSync(filename, 'utf-8');

    let pRatings = data.split(",");
    let rating = -1;
    for (let index = 0; index < pRatings.length; index++) {
        if (pRatings[index].split(" ")[0] === player) {
            rating = pRatings[index].split(" ")[1];
            break;
        }
    }
    return Number(rating);
}

function getWL(player) {
    let data = fs.readFileSync("WL.txt", 'utf-8');

    let pWL = data.split(",");
    let WL = -1;
    for (let index = 0; index < pWL.length; index++) {
        if (pWL[index].split(" ")[0] === player) {
            WL = pWL[index].split(" ")[1];
            break;
        }
    }
    return WL;
}

function adjustRating(num, player, prob) {
    console.log("Prob " + player + ": " + prob);

    const K = 50;
    let rating = getRating(player);

    let elo = 0;

    if (num == 1) { // add elo
        console.log("K value for " + player + " :" + K * (1 - prob))
        elo = rating + K * (1 - prob) + 5;
    } else if (num == 0) { // lower elo
        console.log("K value for " + player + " :" + K * (0 - prob))
        elo = rating + (K / 3) * (0 - prob); // changed to 3 (higher=lose less, lower = lose more)
    } else {
        throw new error("invalid win/loss");
    }

    console.log(player + "'s new elo: " + elo + "(" + (elo - rating) + ")");

    return elo;
}

function calculateProbability(r1, r2) {
    return (1.0 / (1.0 + Math.pow(10, ((r2 - r1) / 400))));
}