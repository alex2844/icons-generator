var form,
	time = 0,
	resList = [],
	IMAGE_RESOURCES = {},
	RESOLUTIONS = [
		{ id: 'xxxhdpi' },
		{ id: 'xxhdpi' },
		{ id: 'xhdpi' },
		{ id: 'hdpi' },
		{ id: 'mdpi' }
	],
	VERSIONS = [
		{ id: 'banner', title: 'Баннер' },
		{ id: 'splash', title: 'Web / Splash' },
		{ id: 'launcher', title: 'Обычные иконки' },
		{ id: 'launcher_round', title: 'Круглые иконки' },
		{ id: 'notification', title: 'Уведомления' }
	],
	PARAM_RESOURCES = {
		'xxhdpi-banner-iconSize': { w: 1590, h: 400 },
		'xxhdpi-banner-targetRect': { x: 1060, y: 40, w: 300, h: 300 },
		'xxhdpi-banner-name': 'cover',
		'xhdpi-banner-iconSize': { w: 320, h: 180 },
		'xhdpi-banner-targetRect': { x: 22, y: 40, w: 105, h: 105 },
		'xhdpi-splash-iconSize': { w: 420, h: 420 },
		'xhdpi-splash-targetRect': { x: 5, y: 5, w: 410, h: 410 },
		'hdpi-splash-iconSize': { w: 192, h: 192 },
		'hdpi-splash-targetRect': { x: 1, y: 1, w: 190, h: 190 },
		'hdpi-splash-name': 'icon',
		'mdpi-splash-iconSize': { w: 48, h: 48 },
		'mdpi-splash-targetRect': { x: 1, y: 1, w: 46, h: 46 },
		'mdpi-splash-name': 'favicon',
		'notification-iconSize': { w: 24, h: 24 },
		'notification-targetRect': { x: 2, y: 2, w: 20, h: 20 },
		'hdpi-iconSize': { w: 72, h: 72 },
		'mdpi-iconSize': { w: 48, h: 48 },
		'hdpi-none-targetRect': { x: 4, y: 4, w: 64, h: 64 },
		'mdpi-none-targetRect': { x: 3, y: 3, w: 42, h: 42 },
		'hdpi-launcher_round-targetRect': { x: 3, y: 3, w: 66, h: 66 },
		'mdpi-launcher_round-targetRect': { x: 2, y: 2, w: 44, h: 44 },
		'hdpi-launcher-targetRect': { x: 7, y: 7, w: 57, h: 57 },
		'mdpi-launcher-targetRect': { x: 5, y: 5, w: 38, h: 38 }
	}
;
function download() {
	var continue_ = function(foreCtx) {
		var zip = new JSZip();
		zip.file('Icons.txt', 'Icons generator: '+location.href);
		$$('.out-image-block:not([hidden]) img').forEach(img => zip.file((
			PARAM_RESOURCES[img.id+'-name'] || 'res/'+(img.id.replace(/^(.*?)-(.*?)$/, 'mipmap-$1/$2'))
		)+'.png', img.src.split(',').slice(1).join(','), {
			createFolders: true,
			base64: true
		}));
		zip.generateAsync({ type: 'blob' }).then(function(content) {
			var a = document.createElement('a');
			a.href = URL.createObjectURL(content);
			a.download = 'icons.zip';
			a.click();
		});
	}
	if ('JSZip' in window)
		continue_();
	else{
		var script = document.createElement('script');
		script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.5.0/jszip.min.js';
		script.onload = () => continue_();
		document.head.appendChild(script);
	}
}
function regenerate(force) {
	if (!force) {
		if (regenerate.timeout_)
			clearTimeout(regenerate.timeout_);
		return regenerate.timeout_ = setTimeout(() => regenerate(true), 1000);
	}
	var values = form.getValues(),
		shapes = Array.from(new Set(values.versions.map(v => ((v == 'notification') ? 'launcher' : v)))).filter(v => (resList.indexOf(v) == -1));
	if (shapes.length > 0)
		return imagelib.loadImageResources(shapes.reduce((res, cur) => {
			[ 'back', 'fore1', 'mask' ].forEach(type => (res[cur+'-'+type] = 'res/'+cur+'/'+type+'.png'));
			resList.push(cur);
			return res;
		}, {}), function(r) {
			IMAGE_RESOURCES = r;
			regenerate();
			studio.hash.bindFormToDocumentHash(form);
		});
	$('aside').style.display = (values.foreground.ctx ? 'flex' : 'none');
	if (!values.foreground.ctx) {
		time = 0;
		$('#spinner').hidden = true;
		return;
	}
	var continue_ = function(foreCtx) {
		for (var version of VERSIONS) {
			if (!($('.group-'+version.id).hidden = (values.versions.indexOf(version.id) == -1))) {
				for (var resolution of RESOLUTIONS) {
					var density = resolution.id;
					if ((version.id == 'banner' && ([ 'xhdpi', 'xxhdpi' ].indexOf(density) == -1)) || (version.id == 'splash' && ([ 'xhdpi', 'hdpi', 'mdpi' ].indexOf(density) == -1)))
						continue;
					if (!($('.block-'+density+'-'+version.id).hidden = (values.resolutions.indexOf(density) == -1))) {
						var iconSize,
							targetRect,
							mult = studio.util.getMultBaseMdpi(density);
						if (version.id == 'launcher') {
							iconSize = PARAM_RESOURCES[density+'-iconSize'] || studio.util.multRound(PARAM_RESOURCES['mdpi-iconSize'], mult);
							targetRect = PARAM_RESOURCES[density+'-'+values.backgroundShape+'-targetRect'] || studio.util.multRound(PARAM_RESOURCES['mdpi-'+values.backgroundShape+'-targetRect'], mult);
						}else if (version.id == 'launcher_round') {
							iconSize = PARAM_RESOURCES[density+'-iconSize'] || studio.util.multRound(PARAM_RESOURCES['mdpi-iconSize'], mult);
							targetRect = PARAM_RESOURCES[density+'-'+version.id+'-targetRect'] || studio.util.multRound(PARAM_RESOURCES['mdpi-'+version.id+'-targetRect'], mult);
						}else if ((version.id == 'splash') || (version.id == 'banner')) {
							iconSize = PARAM_RESOURCES[density+'-'+version.id+'-iconSize'] || studio.util.multRound(PARAM_RESOURCES['mdpi-iconSize'], mult);
							targetRect = PARAM_RESOURCES[density+'-'+version.id+'-targetRect'] || studio.util.multRound(PARAM_RESOURCES['mdpi-'+values.backgroundShape+'-targetRect'], mult);
						}else{
							iconSize = studio.util.multRound(PARAM_RESOURCES[version.id+'-iconSize'], mult);
							targetRect = studio.util.multRound(PARAM_RESOURCES[version.id+'-targetRect'], mult);
						}
						var outCtx = imagelib.drawing.context(iconSize),
							tmpCtx = imagelib.drawing.context(iconSize);
						if (values.foreground.type == 'text' || values.foreground.type == 'clipart')
							values.foreColor.alpha = 100;
						if (values.backgroundShape == 'none') {
							tmpCtx.save();
							tmpCtx.globalCompositeOperation = 'source-over';
							if (foreCtx) {
								var copyFrom = foreCtx;
								var foreSize = {
									w: foreCtx.canvas.width,
									h: foreCtx.canvas.height
								};
								if (values.foreColor.alpha) {
									var tmpCtx2 = imagelib.drawing.context(foreSize);
									imagelib.drawing.copy(tmpCtx2, foreCtx, foreSize);
									tmpCtx2.globalCompositeOperation = 'source-atop';
									tmpCtx2.fillStyle = (version.id != 'notification' ? values.foreColor.color : '#000');
									tmpCtx2.fillRect(0, 0, foreSize.w, foreSize.h);
									copyFrom = tmpCtx2;
									tmpCtx.globalAlpha = 1;
								}
								imagelib.drawing[values.crop ? 'drawCenterCrop' : 'drawCenterInside']
								(tmpCtx, copyFrom, targetRect, {
									x: 0, y: 0,
									w: foreSize.w, h: foreSize.h
								});
							}
							tmpCtx.restore();
							var foreEffect = 1;
							if (values.backgroundShape == 'none')
								outCtx.drawImage(tmpCtx.canvas, 0, 0);
						}else{
							let res = (([ 'banner', 'splash', 'launcher_round' ].indexOf(version.id) > -1) ? version.id : values.backgroundShape);
							tmpCtx.save();
							tmpCtx.globalCompositeOperation = 'source-over';
							imagelib.drawing.copy(tmpCtx, IMAGE_RESOURCES[res+'-mask'], iconSize);
							tmpCtx.globalCompositeOperation = 'source-atop';
							tmpCtx.fillStyle = (version.id != 'notification' ? values.backColor.color : '#fff');
							tmpCtx.fillRect(0, 0, iconSize.w, iconSize.h);
							if (foreCtx) {
								var tmpCtx2 = imagelib.drawing.context(iconSize);
								tmpCtx2.save();
								var copyFrom = foreCtx;
								var foreSize = {
									w: foreCtx.canvas.width,
									h: foreCtx.canvas.height
								};
								if (values.foreColor.alpha) {
									var tmpCtx3 = imagelib.drawing.context(foreSize);
									imagelib.drawing.copy(tmpCtx3, foreCtx, foreSize);
									tmpCtx3.globalCompositeOperation = 'source-atop';
									tmpCtx3.fillStyle = (version.id != 'notification' ? values.foreColor.color : '#000');
									tmpCtx3.fillRect(0, 0, foreSize.w, foreSize.h);
									copyFrom = tmpCtx3;
									tmpCtx.globalAlpha = 1;
								}
								if (version.id != 'notification' && values.effects == 'shadow') {
									var tmpCtx4 = imagelib.drawing.context(iconSize);
									imagelib.drawing[values.crop ? 'drawCenterCrop' : 'drawCenterInside']
									(tmpCtx4, copyFrom, targetRect, {
										x: 0, y: 0,
										w: foreSize.w, h: foreSize.h
									});
									imagelib.effects.renderLongShadow(tmpCtx4, iconSize.w, iconSize.h);
									imagelib.drawing.copy(tmpCtx2, tmpCtx4, iconSize);
								}
								imagelib.drawing[values.crop ? 'drawCenterCrop' : 'drawCenterInside']
								(tmpCtx2, copyFrom, targetRect, {
									x: 0, y: 0,
									w: foreSize.w, h: foreSize.h
								});
								imagelib.drawing.copy(tmpCtx, tmpCtx2, iconSize);
							}
							tmpCtx.restore();
							var foreEffect = 1;
							imagelib.drawing.copy(outCtx, IMAGE_RESOURCES[res+'-back'], iconSize);
							imagelib.drawing.copy(outCtx, tmpCtx, iconSize);
							imagelib.drawing.copy(outCtx, IMAGE_RESOURCES[res+'-fore'+foreEffect], iconSize);
						}
						if ((version.id == 'banner') && values.foreground.title) {
							let f_, x_, y_,
								s_ = (1 - values.foreground.pad),
								ctx = outCtx.canvas.getContext('2d');
							ctx.fillStyle = values.foreColor.color;
							if (density == 'xhdpi') {
								if (values.foreground.name || values.foreground.origImg) {
									x_ = 120;
									f_ = 60;
									y_ = 107;
								}else{
									x_ = 30;
									f_ = 53;
									y_ = 100;
								}
								if (values.crop) {
									x_ += 20;
									s_ = s_ - .25;
								}
								if (values.foreground.description) {
									f_ = 40;
									y_ = 87;
									// ctx.fillStyle = '#4fb2bf';
									ctx.font = (f_*s_)+'px Roboto, sans-serif';
									ctx.fillText(values.foreground.description, x_, y_+(f_*s_));
								}
							}else if (density == 'xxhdpi') {
								x_ = 250;
								y_ = 225;
								f_ = 155;
								if (values.foreground.description) {
									ctx.font = (f_*s_*.4)+'px Roboto, sans-serif';
									ctx.fillText(values.foreground.description, x_+10, y_+(f_*s_*.5));
								}
							}
							ctx.font = 'bold '+(f_*s_)+'px Roboto, sans-serif';
							ctx.fillText(values.foreground.title, x_, y_);
						}
						imagelib.loadFromUri(outCtx.canvas.toDataURL(), function(version, density) {
							return function(img) {
								document.querySelector('#'+density+'-'+version).src = img.src;
							};
						}(version.id, density));
					}
				}
			}
		}
		console.log('finish', (Math.round(new Date().getTime())-time));
		time = 0;
		$('#spinner').hidden = true;
	};
	continue_((values.foreground ? values.foreground.ctx : null));
}
form = new studio.forms.Form('iconform', {
	onChange: function(field) {
		if (time == 0) {
			$('#spinner').hidden = false;
			time = Math.round(new Date().getTime());
		}
		regenerate();
	},
	fields: [
		new studio.forms.EnumField('versions', {
			title: 'Версии иконок',
			type: 'checkbox',
			options: VERSIONS,
			defaultValue: [ 'splash' ]
		}),
		new studio.forms.EnumField('resolutions', {
			title: 'Разрешения',
			type: 'checkbox',
			options: RESOLUTIONS,
			defaultValue: [ 'hdpi' ]
		}),
		new studio.forms.ImageField('foreground', {
			title: 'Содержимое',
			maxFinalSize: { w: 720, h: 720 },
			defaultValueTrim: 1
		}),
		new studio.forms.ColorField('foreColor', {
			title: 'Цвет',
			defaultValue: '#607d8b',
			dialog: 'colors'
		}),
		new studio.forms.BooleanField('crop', {
			title: 'Выравнить',
			defaultValue: false,
			offText: 'По центу',
			onText: 'Обрезать'
		}),
		new studio.forms.EnumField('backgroundShape', {
			title: 'Форма',
			buttons: true,
			options: [
				{ id: 'none', title: 'Нет' },
				{ id: 'launcher', title: 'Да' },
			],
			defaultValue: 'launcher'
		}),
		new studio.forms.ColorField('backColor', {
			title: 'Фон',
			defaultValue: '#ffffff',
			dialog: 'colors'
		}),
		new studio.forms.EnumField('effects', {
			title: 'Эффект',
			buttons: true,
			options: [
				{ id: 'none', title: 'Без эффекта' },
				{ id: 'shadow', title: 'Длинная тень' }
			],
			defaultValue: 'none'
		})
	]
});
form.createUI($('#inputs-form'));
for (var version of VERSIONS) {
	var group = studio.ui.createImageOutputGroup({
		container: $('#outputs'),
		id: version.id,
		label: version.title
	});
	for (var density of RESOLUTIONS) {
		studio.ui.createImageOutputSlot({
			container: group,
			id: density.id+'-'+version.id,
			label: density.id
		});
	}
}
