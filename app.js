const axios = require("axios");
const cheerio = require("cheerio");
const pretty = require("pretty");
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

app.use(cors({
	origin: '*'
}));

app.get("/", (req, res) => {
	res.send('success')
});

app.post("/get-castings-page", async (req, res) => {
	console.log('req', req.body);
	let url = '';
	switch (req.body.castingId) {
		case 0: url = "https://www.maxicasting.com/castings"; break;
		case 1: url = "https://www.allcasting.fr/castings/"; break;
		case 2: url = "https://www.casting.fr/castings"; break;
		case 3: url = "https://www.123casting.com/castings"; break;
		case 4: url = "https://www.etoilecasting.com/"; break;
		case 5: url = "https://figurants.com/casting/region-parisienne-r782097"; break;
		case 6: url = "https://bookme.fr/"; break;
		default: url = 'https://castprod.com/';
	}

	let pageLink = '';
	if (req.body.castingId == 2) {
		pageLink = "?cl_page=" + req.body.page;
	}

	if (req.body.castingId == 4) {
		pageLink = "?page=" + req.body.page + "#/";
	}

	try {
		// Fetch HTML of the page we want to scrape
		const { data } = await axios.get(url + pageLink);
		const $ = cheerio.load(data);
		let listItems = '';
		switch (req.body.castingId) {
			case 0: listItems = $(".blogPage article .liste_details"); break;
			case 1: listItems = $(".entry-content-data"); break;
			case 2: listItems = $(".casting-list-content div div div div .casting-box-content div .col-box-default"); break;
			case 3: listItems = $(".blogPage article .liste_details"); break;
			case 4: listItems = $(".castings .row div div .card-body"); break;
			case 5: listItems = $(".blogPage article .liste_details"); break;
			case 6: listItems = $(".blogPage article .liste_details"); break;
			default: listItems = $(".job_list .job_cards .job-card");
		}

		const castings = [];
		listItems.each(async (idx, el) => {
			const casting = { name: "", date: "", place: "", description: "", link: "", category: "" };

			if (req.body.castingId == 2) {
				casting.name = $(el).find(".casting-box-default a h3").text().replace(/[\n\t]+/g, ' ').trim();
				casting.date = $(el).find(".casting-box-info a span:nth-child(2) span").text().replace(/[\n\t]+/g, ' ').trim();
				casting.category = $(el).find(".casting-box-info a span:first-child").text().replace(/[\n\t]+/g, ' ').trim();
				casting.link = $(el).find(".casting-box-default a").attr('href');
			}

			if (req.body.castingId == 4) {
				casting.name = $(el).find("a h2").text().replace(/[\n\t]+/g, ' ').trim();
				const detail = $(el).find("a p").text().trim().split('\n');
				casting.date = detail[1].replace(/[\n\t]+/g, ' ').trim()
				casting.description = detail[0].replace(/[\n\t]+/g, ' ').trim();
				casting.category = $(el).find("a div .casting-tag").text().replace(/[\n\t]+/g, ' ').trim();
				casting.link = $(el).find("a").attr('href');
			}
			castings.push(casting);
		});
		res.send(castings);

	} catch (err) {
		console.error(err);
	}
})

app.post("/get-castings", async (req, res) => {
	console.log('req', req.body);
	let url = '';
	switch (req.body.castingId) {
		case 0: url = "https://www.maxicasting.com/castings"; break;
		case 1: url = "https://www.allcasting.fr/castings/"; break;
		case 2: url = "https://www.casting.fr/castings"; break;
		case 3: url = "https://www.123casting.com/castings"; break;
		case 4: url = "https://www.etoilecasting.com/#/"; break;
		case 5: url = "https://figurants.com/casting/region-parisienne-r782097"; break;
		case 6: url = "https://bookme.fr/"; break;
		default: url = 'https://castprod.com/';
	}

	try {
		// Fetch HTML of the page we want to scrape
		const { data } = await axios.get(url);
		const $ = cheerio.load(data);
		let listItems = '';
		switch (req.body.castingId) {
			case 0: listItems = $(".blogPage article .liste_details"); break;
			case 1: listItems = $(".entry-content-data"); break;
			case 2: listItems = $(".casting-list-content div div div div .casting-box-content div .col-box-default"); break;
			case 3: listItems = $("#castings .content .all_castings #result_castings div"); break;
			case 4: listItems = $(".castings .row div div .card-body"); break;
			case 5: listItems = $(".blogPage article .liste_details"); break;
			case 6: listItems = $(".blogPage article .liste_details"); break;
			default: listItems = $(".job_list .job_cards .job-card");
		}

		const castings = [];
		listItems.each(async (idx, el) => {
			const casting = { name: "", date: "", place: "", description: "", link: "", category: "" };

			if (req.body.castingId == 0) {
				casting.name = $(el).find("h2 a").text().replace(/[\n\t]+/g, ' ').trim();
				casting.date = $(el).find("p span").text().replace(/[\n\t]+/g, ' ').trim();
				casting.description = $(el).find("div").text().replace(/[\n\t]+/g, ' ').trim();
				casting.link = $(el).find("h2 a").attr('href');
			}

			if (req.body.castingId == 1) {
				// const puppeteer = require('puppeteer');

				// const scrapeInfiniteScrollItems = async (page) => {
				// 	while (true) {
				// 		previousHeight = await page.evaluate('document.body.scrollHeight');
				// 		await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
				// 		await page.waitForFunction(`document.body.scrollHeight > ${previousHeight}`);
				// 		await new Promise((resolve) => setTimeout(resolve, 1000));
				// 	}
				// }

				// (async () => {
				// 	const browser = await puppeteer.launch({
				// 		headless: false
				// 	});

				// 	const page = await browser.newPage();
				// 	await page.goto("https://www.maxicasting.com/castings");

				// 	let result = await scrapeInfiniteScrollItems(page);
				// 	// console.log('result', result);
				// })();
				casting.name = $(el).find(".entry-article-header h2 a").text().replace(/[\n\t]+/g, ' ').trim();
				casting.date = $(el).find(".entry-article-header .entry-meta span:first-child").text().replace(/[\n\t]+/g, ' ').trim();
				casting.place = $(el).find(".entry-article-header .entry-meta span:nth-child(3) a").text().replace(/[\n\t]+/g, ' ').trim();
				casting.description = $(el).find(".entry-article-body").text().replace(/[\n\t]+/g, ' ').trim();
				casting.link = $(el).find(".entry-article-header h2 a").attr('href');
			}

			if (req.body.castingId == 2) {
				casting.name = $(el).find(".casting-box-default a h3").text().replace(/[\n\t]+/g, ' ').trim();
				casting.date = $(el).find(".casting-box-info a span:nth-child(2) span").text().replace(/[\n\t]+/g, ' ').trim();
				casting.category = $(el).find(".casting-box-info a span:first-child").text().replace(/[\n\t]+/g, ' ').trim();
				casting.link = $(el).find(".casting-box-default a").attr('href');
			}

			if (req.body.castingId == 3) {
				casting.name = $(el).find(".description h3 a").text().replace(/[\n\t]+/g, ' ').trim();
				casting.date = $(el).find(".infos").text().replace(/[\n\t]+/g, ' ').trim();
				casting.description = $(el).find(".description p").text().replace(/[\n\t]+/g, ' ').trim();
				casting.link = $(el).find(".description h3 a").attr('href');
			}

			if (req.body.castingId == 4) {
				casting.name = $(el).find("a h2").text().replace(/[\n\t]+/g, ' ').trim();
				const detail = $(el).find("a p").text().trim().split('\n');
				casting.date = detail[1].replace(/[\n\t]+/g, ' ').trim()
				casting.description = detail[0].replace(/[\n\t]+/g, ' ').trim();
				casting.category = $(el).find("a div .casting-tag").text().replace(/[\n\t]+/g, ' ').trim();
				casting.link = $(el).find("a").attr('href');
			}

			if (req.body.castingId == 7) {
				casting.name = $(el).find("h3").text().replace(/[\n\t]+/g, ' ').trim();
				casting.place = $(el).find("p span").text().replace(/[\n\t]+/g, ' ').trim();
				casting.description = $(el).find("p").clone().find("span").remove().end().text().replace(/[\n\t]+/g, ' ').trim().replace(/\\|"/g, '');
				casting.link = "https://castprod.com/poste/" + casting.name.replace(/\s+/g, '-').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9-]/g, "");
			}
			castings.push(casting);
		});
		// console.dir(castings);
		let fileName = '';
		switch (req.body.castingId) {
			case 0: fileName = "maxicasting.json"; break;
			case 1: fileName = "allcasting.json"; break;
			case 2: fileName = "casting.json"; break;
			case 3: fileName = "123casting.json"; break;
			case 4: fileName = "etoilecasting.json"; break;
			case 5: fileName = "figurants.json"; break;
			case 6: fileName = "bookme.json"; break;
			default: fileName = "castProd.json";
		}
		fs.writeFile(fileName, JSON.stringify(castings, null, 2), (err) => {
			if (err) {
				console.error(err);
				return;
			}
			console.log("Successfully written data to file");
		});
		res.send(castings);

	} catch (err) {
		console.error(err);
	}
})



app.listen(5000, () => console.log("Servier is listening to port 5000"));