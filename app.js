const axios = require("axios");
const cheerio = require("cheerio");
const pretty = require("pretty");
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const puppeteer = require('puppeteer');

const { urls, itemsMask, categoryMask, placeMask, fileNames } = require("./constants");

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

	if (id == 4) {
		casting.name = $(el).find("a h2").text().replace(/[\n\t]+/g, ' ').trim();
		const detail = $(el).find("a p").text().trim().split('\n');
		casting.date = detail[1].replace(/[\n\t]+/g, ' ').trim();
		casting.image = $(el).find("a .casting-img img").attr('src');
		casting.description = detail[0].replace(/[\n\t]+/g, ' ').trim();
		casting.category = $(el).find("a div .casting-tag").text().replace(/[\n\t]+/g, ' ').trim();
		casting.link = $(el).find("a").attr('href');
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

	const scrapeInfiniteScrollItems = async (page, itemTargetCount) => {
		let items = [];
		let castings = [];
		let prevHeight = 1500;
		console.log("index", req.body.index);

		console.log('here');
		for (var i = 0; i < 5 * req.body.index; i++) {
			prevHeight = prevHeight + 400;
			if(req.body.castingId == 0) {
				items = await page.$$('article');
			}

			if(req.body.castingId == 1) {
				items = await page.$$('.entry-content-data');
			}
			await page.evaluate(`window.scrollTo(0, ${prevHeight})`);
			await page.waitForFunction(`document.body.scrollHeight > ${prevHeight}`);
			await new Promise((resolve) => setTimeout(resolve, 1000));


			console.log(items);
			console.log(items.length);
		}

		for (const item of items) {
			const casting = { name: "", date: "", place: "", description: "", link: "", category: "", image: "" };
			let _name, _description, _category, _date;
			if(req.body.castingId == 0) {
				_name = await item.$('h2 > a');
				_description = await item.$('div');
				_date = await item.$('p')
				_category = await item.$('p > .lbid_featured');
			}

			if(req.body.castingId == 1) {
				_name = await item.$('.entry-article-header > h2 > a');
				_description = await item.$('.entry-article-body');
				_date = await item.$('.entry-article-header .entry-meta span:first-child');
				_category = await item.$('.entry-article-header > .entry-meta > span:nth-child(3) > a');
			}

			casting.name = await _name.evaluate(el => el.textContent);
			casting.link = await _name.evaluate(el => el.href);
			casting.date = await _date.evaluate(el => el.textContent);
			casting.category = await _category.evaluate(el => el.textContent);
			casting.description = await _description.evaluate(el => el.textContent);
			castings.push(casting);
		}
		return castings;
	}

	(async () => {
		const browser = await puppeteer.launch({
			headless: false
		});

		const page = await browser.newPage();
			await page.goto(urls[req.body.castingId]);
	

		const items = await scrapeInfiniteScrollItems(page, 10);
		await browser.close();
		res.send({
			castings: items,
			categories: [],
			places: []
		});
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
		console.log("link", url + pageLink);
		const { data } = await axios.get(url + pageLink);
		const $ = cheerio.load(data);
		let listItems = '';
		listItems = $(itemsMask[req.body.castingId]);

		const castings = [];
		listItems.each(async (idx, el) => {
			const casting = { name: "", date: "", place: "", description: "", link: "", category: "", image: "" };
			castings.push(createCastings(req.body.castingId, el, casting, $));
		});

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
		const tempLink = req.body.query.category == "" ? urls[4] : req.body.query.category;
		console.log('temp ', tempLink);
		url = (req.body.query.region == "on" || req.body.query.region == "") ? tempLink : tempLink + "?l%5B%5D=" + req.body.query.region + "&a=0#/";
	}

	if (req.body.castingId == 5) {
		pageLink = req.body.query.category + req.body.query.region;
	}

	if (req.body.castingId == 6 || req.body.castingId == 7) {
		pageLink = "?job_s&region=" + req.body.query.region + "&category_job=" + req.body.query.category;
	}

	try {
		// Fetch HTML of the page we want to scrape
		console.log('link', url + pageLink);
		const { data } = await axios.get(url + pageLink);
		const $ = cheerio.load(data);
		let listItems = '';
		listItems = $(itemsMask[req.body.castingId]);

		const castings = [];
		listItems.each(async (idx, el) => {
			const casting = { name: "", date: "", place: "", description: "", link: "", category: "", image: "" };
			castings.push(createCastings(req.body.castingId, el, casting, $));
		});


		res.send(castings);

	} catch (err) {
		console.error(err);
	}
})

app.post("/get-castings", async (req, res) => {
	console.log('req', req.body);
	let url = urls[req.body.castingId];

	if (req.body.castingId == 3) {
		const puppeteer = require('puppeteer');
		const castings = [];

		(async () => {
			const browser = await puppeteer.launch();
			const page = await browser.newPage();

			await page.goto('https://www.123casting.com/castings');

			const castingElements = await page.$$('.line');
			for (const element of castingElements) {
				const casting = { name: "", date: "", place: "", description: "", link: "", category: "", image: "" };
				const _name = await element.$('.description > h3 > a');
				const _place = await element.$('.infos');
				const _description = await element.$('.description > p');
				casting.name = await _name.evaluate(el => el.textContent);
				casting.link = await _name.evaluate(el => el.href);
				casting.place = await _place.evaluate(el => el.textContent);
				casting.description = await _description.evaluate(el => el.textContent);
				castings.push(casting);
			}
			console.log('Main Heading:', castings);

			// fs.writeFile("123casting.json", JSON.stringify(castings, null, 2), (err) => {
			// 	if (err) {
			// 		console.error(err);
			// 		return;
			// 	}
			// 	console.log("Successfully written data to file");
			// });

			await browser.close();
			res.send({
				castings: castings,
				categories: [],
				places: []
			});
		})();
	}

	else {
		try {
			// Fetch HTML of the page we want to scrape
			const { data } = await axios.get(url);
			const $ = cheerio.load(data);
			let listItems = '';
			let _$ = '';
			if (req.body.castingId == 5) {
				let _data;
				await axios.get(url + "castings").then((res) => _data = res.data);
				_$ = cheerio.load(_data);
				listItems = _$(itemsMask[req.body.castingId]);
			}
			else {
				listItems = $(itemsMask[req.body.castingId]);
			}

			const castings = [];
			const categories = [];
			const places = [];
			const _categories = $(categoryMask[req.body.castingId]);
			const _places = $(placeMask[req.body.castingId]);

			if (req.body.castingId == 5) {
				places.push({ region: 'All', value: "" });
			}

			_places.each(async (idx, el) => {
				if (req.body.castingId == 4) {
					const _place = { region: '', value: '' }
					_place.region = $(el).text().replace(/[\n\t]+/g, ' ').trim();
					_place.value = $(el).find("input").attr("value");
					places.push(_place);
				}

				if (req.body.castingId == 5) {
					const _place = { region: '', value: '' }
					_place.region = $(el).text().replace(/[\n\t]+/g, ' ').trim();
					_place.value = $(el).attr("href");
					places.push(_place);
				}

				if (req.body.castingId == 6 || req.body.castingId == 7) {
					const _place = { region: '', value: '' }
					_place.region = $(el).text().replace(/[\n\t]+/g, ' ').trim();
					_place.value = $(el).attr("value");
					places.push(_place);
				}
			})

			if (req.body.castingId == 0) {
				categories.push({ name: 'All', value: "" });
			}

			if (req.body.castingId == 1) {
				categories.push({ name: 'All', value: urls[1] });
			}

			_categories.each(async (idx, el) => {
				if (req.body.castingId == 0) {
					const _category = { name: '', value: '' }
					_category.name = $(el).find('a').text().replace(/[\n\t]+/g, ' ').trim();
					_category.value = "";
					categories.push(_category);
				}

				if (req.body.castingId == 1 || req.body.castingId == 4 || req.body.castingId == 5) {
					const _category = { name: '', value: '' }
					_category.name = $(el).find('a').text().replace(/[\n\t]+/g, ' ').trim();
					_category.value = $(el).find('a').attr("href");
					categories.push(_category);
				}

				if (req.body.castingId == 2) {
					const _category = { name: '', value: '' }
					_category.name = $(el).text().replace(/[\n\t]+/g, ' ').trim();
					_category.value = "";
					categories.push(_category);
				}

				if (req.body.castingId == 6 || req.body.castingId == 7) {
					const _category = { name: '', value: '' }
					_category.name = $(el).text().replace(/[\n\t]+/g, ' ').trim();
					_category.value = $(el).attr('value');
					categories.push(_category);
				}
			});

			if (req.body.castingId == 5) {
				categories[6] = { name: 'All', value: "" };
			}

			listItems.each(async (idx, el) => {
				const casting = { name: "", date: "", place: "", description: "", link: "", category: "", image: "" };
				if (req.body.castingId == 5) {
					castings.push(createCastings(req.body.castingId, el, casting, _$));
				}
				else {
					castings.push(createCastings(req.body.castingId, el, casting, $));
				}
			});
			// console.dir(castings);
			const fileName = fileNames[req.body.castingId];
			// fs.writeFile(fileName, JSON.stringify(castings, null, 2), (err) => {
			// 	if (err) {
			// 		console.error(err);
			// 		return;
			// 	}
			// 	console.log("Successfully written data to file");
			// });

			res.send({
				castings: castings,
				categories: categories,
				places: places
			});

		} catch (err) {
			console.error(err);
		}
	}
})


app.listen(5000, () => console.log("Servier is listening to port 5000"));