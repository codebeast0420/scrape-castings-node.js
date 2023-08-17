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

const categoryMask = [
	"aside .custom-html-widget h5",
	"#categories-4 ul li",
	"#field_id_art option",
	"#castings .content .all_castings #result_castings div",
	".castings-cat-items .item",
	".listing-card-list .listing-card",
	"#category_job option",
	"#category_job option"
]

const placeMask = [
	"aa",
	"aa",
	"aa",
	"aa",
	"aa",
	"aa",
	"aa",
	"#region option"
]

const fileNames = [
	"maxicasting.json",
	"allcasting.json",
	"casting.json",
	"123casting.json",
	"etoilecasting.json",
	"figurants.json",
	"bookme.json",
	"castProd.json"
]

module.exports = {
	urls,
	itemsMask,
	categoryMask,
	placeMask,
	fileNames
}