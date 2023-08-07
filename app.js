const axios = require("axios");
const cheerio = require("cheerio");
const pretty = require("pretty");
const fs = require('fs');

const url = "https://www.maxicasting.com/castings";

async function scrapeData() {
	try {
		// Fetch HTML of the page we want to scrape
		const { data } = await axios.get(url);
		const $ = cheerio.load(data);
		const listItems = $(".blogPage article .liste_details");
		const castings = [];
		listItems.each((idx, el) => {
			const casting = { name: "", date: "" };
			casting.name = $(el).find("h2 a").text().replace(/[\n\t]+/g, ' ').trim();
			casting.date = $(el).find("p span").text().replace(/[\n\t]+/g, ' ').trim();
			castings.push(casting);
		});
		console.dir(castings);
		fs.writeFile("maxcasting.json", JSON.stringify(castings, null, 2), (err) => {
			if (err) {
				console.error(err);
				return;
			}
			console.log("Successfully written data to file");
		});
	} catch (err) {
		console.error(err);
	}
}
// Invoke the above function
scrapeData();