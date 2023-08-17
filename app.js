const axios = require("axios");
const cheerio = require("cheerio");
const pretty = require("pretty");
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const urls = [
	"https://www.maxicasting.com/castings",
	"https://www.allcasting.fr/castings/",
	"https://www.casting.fr/castings",
	"https://www.123casting.com/castings",
	"https://www.etoilecasting.com/",
	"https://figurants.com/casting/region-parisienne-r782097",
	"https://bookme.fr/",
	'https://castprod.com/'
]

const itemsMask = [
	".blogPage article .liste_details",
	".entry-content-data",
	".casting-list-content div div div .casting-box-card",
	"#castings .content .all_castings #result_castings div",
	".castings .row div div .card-body",
	".listing-card-list .listing-card",
	".job_cards .job-card",
	".job_list .job_cards .job-card"
];

const createCastings = (id, el, casting, $) => {
	if (id == 0) {
		casting.name = $(el).find("h2 a").text().replace(/[\n\t]+/g, ' ').trim();
		casting.date = $(el).find("p").clone().find(".lbid_featured").remove().end().text().replace(/[\n\t]+/g, ' ').trim();
		casting.category = $(el).find("p .lbid_featured").text().replace(/[\n\t]+/g, ' ').trim();
		casting.description = $(el).find("div").text().replace(/[\n\t]+/g, ' ').trim();
		casting.link = $(el).find("h2 a").attr('href');
	}

	if (id == 1) {
		casting.name = $(el).find(".entry-article-header h2 a").text().replace(/[\n\t]+/g, ' ').trim();
		casting.date = $(el).find(".entry-article-header .entry-meta span:first-child").text().replace(/[\n\t]+/g, ' ').trim();
		casting.category = $(el).find(".entry-article-header .entry-meta span:nth-child(3) a").text().replace(/[\n\t]+/g, ' ').trim();
		casting.description = $(el).find(".entry-article-body").text().replace(/[\n\t]+/g, ' ').trim();
		casting.link = $(el).find(".entry-article-header h2 a").attr('href');
	}

	if (id == 2) {
		casting.name = $(el).find(".casting-box-content div .col-box-default a h3").text().replace(/[\n\t]+/g, ' ').trim();
		casting.date = $(el).find(".casting-box-content div .col-box-default .casting-box-info a span:nth-child(2) span").text().replace(/[\n\t]+/g, ' ').trim();
		casting.category = $(el).find(".casting-box-content div .col-box-default .casting-box-info a span:first-child").text().replace(/[\n\t]+/g, ' ').trim();
		casting.link = $(el).find(".casting-box-content div .col-box-default .casting-box-default a").attr('href');
		casting.image = $(el).find(".casting-box-heading a span span picture img").attr('src');
	}

	if (id == 3) {
		casting.name = $(el).find(".description h3 a").text().replace(/[\n\t]+/g, ' ').trim();
		casting.date = $(el).find(".infos").text().replace(/[\n\t]+/g, ' ').trim();
		casting.description = $(el).find(".description p").text().replace(/[\n\t]+/g, ' ').trim();
		casting.link = $(el).find(".description h3 a").attr('href');
	}

	if (id == 4) {
		casting.name = $(el).find("a h2").text().replace(/[\n\t]+/g, ' ').trim();
		const detail = $(el).find("a p").text().trim().split('\n');
		casting.date = detail[1].replace(/[\n\t]+/g, ' ').trim();
		casting.image = $(el).find("a .casting-img img").attr('src');
		casting.description = detail[0].replace(/[\n\t]+/g, ' ').trim();
		casting.category = $(el).find("a div .casting-tag").text().replace(/[\n\t]+/g, ' ').trim();
		casting.link = $(el).find("a").attr('href');
	}

	if (id == 5) {
		casting.name = $(el).find(".listing-basicinfo a").text().replace(/[\n\t]+/g, ' ').trim();
		casting.category = $(el).find(".listing-basicinfo .listing-attributes span:first-child").text().replace(/[\n\t]+/g, ' ').trim();
		casting.place = $(el).find(".listing-basicinfo .listing-attributes span:nth-child(2)").text().replace(/[\n\t]+/g, ' ').trim();
		casting.date = $(el).find(".listing-basicinfo .listing-attributes").clone().find("span").remove().end().text().replace(/[\n\t]+/g, ' ').replace(/-/g, '').trim();
		casting.description = $(el).find(".listing-basicinfo p").text().replace(/[\n\t]+/g, ' ').trim();
		casting.link = $(el).find(".listing-basicinfo a").attr('href');
		casting.image = $(el).find(".listing-thumb img").attr('src');
	}

	if (id == 6) {
		casting.name = $(el).find("h3").text().replace(/[\n\t]+/g, ' ').trim();
		const detail = $(el).find("p").text().replace(/[\n\t]+/g, ' ').replace(/\\|"/g, '').trim().split("    ");
		casting.place = detail[detail.length - 1].trim();
		casting.image = $(el).find("img").attr('src');
		casting.description = detail[0].trim();
		casting.link = $(el).clone().find("span").remove().end().find("a").attr('href');
	}

	if (id == 7) {
		casting.name = $(el).find("h3").text().replace(/[\n\t]+/g, ' ').trim();
		casting.image = $(el).find("img").attr("src");
		casting.place = $(el).find("p span").text().replace(/[\n\t]+/g, ' ').trim();
		casting.description = $(el).find("p").clone().find("span").remove().end().text().replace(/[\n\t]+/g, ' ').trim().replace(/\\|"/g, '');
		casting.link = "https://castprod.com/poste/" + casting.name.replace(/\s+/g, '-').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9-]/g, "");
	}

	return casting;
}

const app = express();
app.use(bodyParser.json());

app.use(cors({
	origin: '*'
}));

app.get("/", (req, res) => {
	res.send('success')
});

app.post("/load-more", async (req, res) => {
	const puppeteer = require('puppeteer');

	const scrapeInfiniteScrollItems = async (page, itemTargetCount) => {
		let items = [];

		console.log('here');
		items = await page.evaluate(() => {
			const _items = Array.from(document.querySelectorAll("article"));
			console.log('item', _items);
			return _items.map((item) => item.innerText);
		})
		previousHeight = await page.evaluate('document.body.scrollHeight');
		await page.evaluate(`window.scrollTo(0, ${previousHeight - 680})`);
		await page.waitForFunction(`document.body.scrollHeight > ${previousHeight}`);
		await new Promise((resolve) => setTimeout(resolve, 1000));


		console.log(items);
		console.log(items.length);
		return items;
	}

	(async () => {
		const browser = await puppeteer.launch({
			headless: false
		});

		const page = await browser.newPage();
		await page.goto("https://www.maxicasting.com/castings");

		const items = await scrapeInfiniteScrollItems(page, 10);
	})();
})

app.post("/get-castings-page", async (req, res) => {
	console.log('req', req.body);
	const url = urls[req.body.castingId];

	let pageLink = '';
	if (req.body.castingId == 2) {
		pageLink = "?cl_page=" + req.body.page;
	}

	if (req.body.castingId == 4) {
		pageLink = "?page=" + req.body.page + "#/";
	}

	if (req.body.castingId == 5) {
		pageLink = "/" + req.body.page;
	}

	if (req.body.castingId == 6) {
		pageLink = "page/" + req.body.page;
	}

	if (req.body.castingId == 7) {
		pageLink = "page/" + req.body.page;
	}

	try {
		// Fetch HTML of the page we want to scrape
		const { data } = await axios.get(url + pageLink);
		const $ = cheerio.load(data);
		let listItems = '';
		listItems = $(itemsMask[req.body.castingId]);

		const castings = [];
		listItems.each(async (idx, el) => {
			const casting = { name: "", date: "", place: "", description: "", link: "", category: "", image: "" };
			castings.push(createCastings(req.body.castingId, el, casting, $));
		});

		if (req.body.castingId == 5) {
			castings.shift();
		}

		res.send(castings);

	} catch (err) {
		console.error(err);
	}
})

app.post("/get-castings-search", async (req, res) => {
	console.log('req', req.body);
	let url = urls[req.body.castingId];

	let pageLink = '';

	if (req.body.castingId == 0) {
		pageLink = "/" + req.body.query.category;
	}

	if (req.body.castingId == 1) {
		url = req.body.query.category ? req.body.query.category : urls[1];
	}

	if (req.body.castingId == 2) {
		pageLink = "/" + req.body.query.category + "?id_gender=&age_rank=";
	}

	if (req.body.castingId == 4) {
		url = req.body.query.category;
	}

	if (req.body.castingId == 5) {
		pageLink = "/" + req.body.page;
	}

	if (req.body.castingId == 6 || req.body.castingId == 7) {
		pageLink = "?job_s&region=" + req.body.query.region + "&category_job=" + req.body.query.category;
	}

	try {
		// Fetch HTML of the page we want to scrape
		const { data } = await axios.get(url + pageLink);
		console.log('link', url + pageLink);
		const $ = cheerio.load(data);
		let listItems = '';
		listItems = $(itemsMask[req.body.castingId]);

		const castings = [];
		listItems.each(async (idx, el) => {
			const casting = { name: "", date: "", place: "", description: "", link: "", category: "", image: "" };
			castings.push(createCastings(req.body.castingId, el, casting, $));
		});

		if (req.body.castingId == 5) {
			castings.shift();
		}

		res.send(castings);

	} catch (err) {
		console.error(err);
	}
})

app.post("/get-castings", async (req, res) => {
	console.log('req', req.body);
	let url = urls[req.body.castingId];

	try {
		// Fetch HTML of the page we want to scrape
		const { data } = await axios.get(url);
		const $ = cheerio.load(data);
		let listItems = '';
		listItems = $(itemsMask[req.body.castingId]);

		const castings = [];
		const categories = [];
		const regions = [];
		let _regions = '';
		let _categories = '';
		switch (req.body.castingId) {
			case 0: _categories = $("aside .custom-html-widget h5"); break;
			case 1: _categories = $("#categories-4 ul li"); break;
			case 2: _categories = $("#field_id_art option"); break;
			case 3: _categories = $("#castings .content .all_castings #result_castings div"); break;
			case 4: _categories = $(".castings-cat-items .item"); break;
			case 5: _categories = $(".listing-card-list .listing-card"); break;
			case 6: _categories = $("#category_job option"); break;
			default: _categories = $("#category_job option");
		}

		if (req.body.castingId == 0) {
			categories.push('All');
		}

		if (req.body.castingId == 1) {
			categories.push({ name: 'All', value: urls[1] });
		}

		_categories.each(async (idx, el) => {
			if (req.body.castingId == 0) {
				categories.push($(el).find('a').text().replace(/[\n\t]+/g, ' ').trim());
			}

			if (req.body.castingId == 1 || req.body.castingId == 4) {
				const _category = { name: '', value: '' }
				_category.name = $(el).find('a').text().replace(/[\n\t]+/g, ' ').trim();
				_category.value = $(el).find('a').attr("href");
				categories.push(_category);
			}

			if (req.body.castingId == 2) {
				categories.push($(el).text().replace(/[\n\t]+/g, ' ').trim());
			}

			if (req.body.castingId == 6 || req.body.castingId == 7) {
				const _category = { name: '', value: '' }
				_category.name = $(el).text().replace(/[\n\t]+/g, ' ').trim();
				_category.value = $(el).attr('value');
				categories.push(_category);
			}
		});

		listItems.each(async (idx, el) => {
			const casting = { name: "", date: "", place: "", description: "", link: "", category: "", image: "" };
			castings.push(createCastings(req.body.castingId, el, casting, $));
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
		// fs.writeFile(fileName, JSON.stringify(castings, null, 2), (err) => {
		// 	if (err) {
		// 		console.error(err);
		// 		return;
		// 	}
		// 	console.log("Successfully written data to file");
		// });

		if (req.body.castingId == 5) {
			castings.shift();
		}

		res.send({
			castings: castings,
			categories: categories
		});

	} catch (err) {
		console.error(err);
	}
})


app.listen(5000, () => console.log("Servier is listening to port 5000"));