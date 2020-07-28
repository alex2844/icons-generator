const
	gulp = require('gulp'),
	fs = require('fs'),
	path = require('path'),
	httpServer = require('http-server'),
	{ fetch } = require('js-global-fetch');

gulp.task('cron', async () => {
	let root = path.join(__dirname, '/gh-pages/');
	if (!fs.existsSync(root))
		fs.mkdirSync(root, { recursive: true });
	fetch('https://material.io/resources/color/').then(d => d.text()).then(d => {
		fetch('https://material.io/resources/color/scripts/'+d.split('src="scripts/')[2].split('"')[0]).then(d => d.text()).then(d => {
			let r = JSON.parse(('{shades:'+d.split('={shades:')[1].split(';')[0]).replace(/(shades|palettes|name|hexes)/g, '"$1"')),
				res = [].concat([[''].concat(r.shades)], r.palettes.map(v => [v.name].concat(v.hexes)));
			fs.writeFile(path.join(root, '/colors.json'), JSON.stringify(res, null, '\t'), () => {});
		});
	});
	fetch('https://fonts.google.com/metadata/icons').then(d => d.text()).then(d => {
		let res = {};
		JSON.parse(d.slice(5)).icons.forEach(icon => {
			if (!res[icon.categories[0]])
				res[icon.categories[0]] = [];
			res[icon.categories[0]].push(icon.name);
		});
		fs.writeFile(path.join(root, '/icons.json'), JSON.stringify(res, null, '\t'), () => {});
	});
	fetch('https://www.googleapis.com/webfonts/v1/webfonts?key=AIzaSyDlD2NdRw4MDt-jDoTE_Hz3JqNpl154_qo&fields=items&sort=popularity').then(d => d.json()).then(d => {
		let res = d.items.map(v => v.family);
		fs.writeFile(path.join(root, '/fonts.json'), JSON.stringify(res, null, '\t'), () => {});
	});
});
gulp.task('server', async () => httpServer.createServer({ cache: -1 }).listen(3000));
if (process.env.CRON == 'true')
	gulp.task('default', gulp.series('cron'));
if (process.env.SERVER == 'true')
	gulp.task('default', gulp.series('server'));
