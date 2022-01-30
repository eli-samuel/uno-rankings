const Discord = require("discord.js");
const bot = new Discord.Client();
const token = "OTI4NTQ0NTUwOTg3ODkwNzI4.YdaUgA.ypjCq6rcriwAuNKohAY0ihfGDXs";
const prefix = "UNO"
const fetch = require("node-fetch");

const fs = require('fs');
const path = require('path');
const { get } = require("http");
const { error } = require("console");

const filename = "players.txt";

const updateEmbed = new Discord.MessageEmbed() //https://discordjs.guide/popular-topics/embeds.html
    .setColor('#E74C3C')
    .setTitle('An UNO Game has been completed')
    .setURL('https://www.discord.gg/7mbc8um')
    .setAuthor('UNO Rankings',
        'https://www.pinclipart.com/picdir/big/95-951998_worlds-smallest-uno-u-s-uno-play-card-game.png')
    .setDescription("Here are this game's results: ")
    .setThumbnail('https://www.pinclipart.com/picdir/big/95-951998_worlds-smallest-uno-u-s-uno-play-card-game.png')
    .setTimestamp()
    .setFooter('ggez');

bot.login(token);

bot.on('ready', () => {
    console.log("Logged in as " + bot.user.tag);
});

/* TODO:
    - add new player
    - top 10 ranking embed
    - player personal elo embed card
    - check to see if all players exist
*/
bot.on("message", msg => {
    if (msg.author == bot.user) return; // Prevent bot from responding to its own messages

    // test cases
    if (msg.content === "ayy") msg.channel.send("lmao");

    if (msg.content.startsWith(prefix)) {
        // eli 100,arabel 200,beks 300
        console.log("=======================");
        let message = msg.content;

        let players = msg.content.split(" ");
        players.shift();

        console.log(players);
        if (players.length > 4) {
            console.log("Too many players");
            msg.channel.send("Invalid number of players, please try again.");
            return;
        }

        // msg.channel.send("An UNO Game has completed.");

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
        updateEmbed.addFields({ name: wField, value: "W-L: *" + wWinLoss + "*", inline: false });
        toPrint(winner + " " + wElo + ",");

        let lRating = [];

        for (let index = 1; index < players.length; index++) {
            let lOtherAvg = 0;
            for (let i = 0; i < players.length; i++) {
                if (index == i) { continue; }
                else { lOtherAvg += getRating(players[i]); }
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
            updateEmbed.addFields({ name: lField, value: "W-L: *" + lWinLoss + "*", inline: false });
            toPrint(lPlayer + " " + lElo + ",");
        }

        msg.channel.send(updateEmbed);
        updateEmbed.fields = [];
    }
});

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
            //console.log("found player " + player);
            rating = pRatings[index].split(" ")[1];
            break;
        }
    }
    //console.log(rating);
    return Number(rating);
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

// UNO eli beks arabel bot
// UNO beks eli arabel bot
// UNO arabel eli beks bot
// UNO bot arabel eli beks

// eli 0-0,arabel 0-0,beks 0-0,bot 0-0,
// arabel 500,beks 500,eli 500,bot 500,

//arabel - beks - arabel - arabel - bot - arabel - eli - arabel

//arabel 593,beks 461,eli 470,bot 466,sacha 500,
//eli 1-7,arabel 5-3,beks 1-7,bot 1-7,sacha 0-0,