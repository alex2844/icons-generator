let time = 0;
var components,
	form,
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
		{ id: 'splash', title: 'Web / Splash' },
		{ id: 'launcher', title: 'Обычные иконки' },
		{ id: 'launcher_round', title: 'Круглые иконки' },
		{ id: 'notify', title: 'Уведомления' }
	],
	PARAM_RESOURCES = {
		'xxxhdpi-splash-iconSize': { w: 420, h: 420 },
		'xxxhdpi-splash-targetRect': { x: 5, y: 5, w: 410, h: 410 },
		'xxhdpi-splash-iconSize': { w: 192, h: 192 },
		'xxhdpi-splash-targetRect': { x: 1, y: 1, w: 190, h: 190 },
		'xhdpi-splash-iconSize': { w: 48, h: 48 },
		'xhdpi-splash-targetRect': { x: 1, y: 1, w: 46, h: 46 },
		'notify-iconSize': { w: 24, h: 24 },
		'notify-targetRect': { x: 2, y: 2, w: 20, h: 20 },
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
function regenerate(force) {
	if (!force) {
		if (regenerate.timeout_)
			clearTimeout(regenerate.timeout_);
		regenerate.timeout_ = setTimeout(function() {
			regenerate(true);
		}, 1000);
		return;
	}
	var values = form.getValues();
	var shapes = Array.from(new Set(values.versions.map(v => ((v == 'notify') ? 'launcher' : v)))).filter(v => (resList.indexOf(v) == -1));
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
	if (!values['foreground'].ctx)
		return;
	var continue_ = function(foreCtx) {
		console.log(
			VERSIONS,
			values.versions
		);
		var backgroundShape = values.backgroundShape;
		for (var version of VERSIONS) {
			if (!($('.group-'+version.id).hidden = (values.versions.indexOf(version.id) == -1))) {
				for (var resolution of RESOLUTIONS) {
					var density = resolution.id;
					if (version.id == 'splash' && !density.match('xhdpi'))
						continue;
					if (!($('.block-'+version.id+'-'+density).hidden = (values.resolutions.indexOf(density) == -1))) {
						var iconSize,
							targetRect,
							mult = studio.util.getMultBaseMdpi(density);
						if (version.id == 'launcher') {
							iconSize = PARAM_RESOURCES[density+'-iconSize'] || studio.util.multRound(PARAM_RESOURCES['mdpi-iconSize'], mult);
							targetRect = PARAM_RESOURCES[density+'-'+backgroundShape+'-targetRect'] || studio.util.multRound(PARAM_RESOURCES['mdpi-'+backgroundShape+'-targetRect'], mult);
							console.log(version.id, density, { iconSize, targetRect });
						}else if (version.id == 'launcher_round') {
							iconSize = PARAM_RESOURCES[density+'-iconSize'] || studio.util.multRound(PARAM_RESOURCES['mdpi-iconSize'], mult);
							targetRect = PARAM_RESOURCES[density+'-launcher_round-targetRect'] || studio.util.multRound(PARAM_RESOURCES['mdpi-launcher_round-targetRect'], mult);
						}else if (version.id == 'splash') {
							iconSize = PARAM_RESOURCES[density+'-splash-iconSize'] || studio.util.multRound(PARAM_RESOURCES['mdpi-iconSize'], mult);
							targetRect = PARAM_RESOURCES[density+'-'+version.id+'-targetRect'] || studio.util.multRound(PARAM_RESOURCES['mdpi-'+backgroundShape+'-targetRect'], mult);
							console.log(version.id, density, { iconSize, targetRect });
						}else{
							iconSize = studio.util.multRound(PARAM_RESOURCES[version.id+'-iconSize'], mult);
							targetRect = studio.util.multRound(PARAM_RESOURCES[version.id+'-targetRect'], mult);
						}
						var outCtx = imagelib.drawing.context(iconSize);
						var tmpCtx = imagelib.drawing.context(iconSize);
						if ((values['foreground'].type == 'text' || values['foreground'].type == 'clipart') && values['foreColor'].alpha == 0)
							values['foreColor'].alpha = 100;
						if (backgroundShape == 'none') {
							tmpCtx.save();
							tmpCtx.globalCompositeOperation = 'source-over';
							if (foreCtx) {
								var copyFrom = foreCtx;
								var foreSize = {
									w: foreCtx.canvas.width,
									h: foreCtx.canvas.height
								};
								if (values['foreColor'].alpha) {
									var tmpCtx2 = imagelib.drawing.context(foreSize);
									imagelib.drawing.copy(tmpCtx2, foreCtx, foreSize);
									tmpCtx2.globalCompositeOperation = 'source-atop';
									tmpCtx2.fillStyle = (version.id != 'notify' ? values['foreColor'].color : '#000');
									tmpCtx2.fillRect(0, 0, foreSize.w, foreSize.h);
									copyFrom = tmpCtx2;
									tmpCtx.globalAlpha = (version.id != 'notify' ? (values['foreColor'].alpha / 100) : 1);
								}
								imagelib.drawing[values['crop'] ? 'drawCenterCrop' : 'drawCenterInside']
								(tmpCtx, copyFrom, targetRect, {
									x: 0, y: 0,
									w: foreSize.w, h: foreSize.h
								});
							}
							tmpCtx.restore();
							var foreEffect = 1;
							if (backgroundShape == 'none')
								outCtx.drawImage(tmpCtx.canvas, 0, 0);
						}else{
							tmpCtx.save();
							tmpCtx.globalCompositeOperation = 'source-over';
							imagelib.drawing.copy(tmpCtx, IMAGE_RESOURCES[(version.id == 'splash' ? 'splash' : (version.id == 'launcher_round' ? 'launcher_round' : backgroundShape))+'-mask'], iconSize);
							tmpCtx.globalCompositeOperation = 'source-atop';
							tmpCtx.fillStyle = (version.id != 'notify' ? values['backColor'].color : '#fff');
							tmpCtx.fillRect(0, 0, iconSize.w, iconSize.h);
							if (foreCtx) {
								var tmpCtx2 = imagelib.drawing.context(iconSize);
								tmpCtx2.save();
								var copyFrom = foreCtx;
								var foreSize = {
									w: foreCtx.canvas.width,
									h: foreCtx.canvas.height
								};
								if (values['foreColor'].alpha) {
									var tmpCtx3 = imagelib.drawing.context(foreSize);
									imagelib.drawing.copy(tmpCtx3, foreCtx, foreSize);
									tmpCtx3.globalCompositeOperation = 'source-atop';
									tmpCtx3.fillStyle = (version.id != 'notify' ? values['foreColor'].color : '#000');
									tmpCtx3.fillRect(0, 0, foreSize.w, foreSize.h);
									copyFrom = tmpCtx3;
									tmpCtx.globalAlpha = (version.id != 'notify' ? (values['foreColor'].alpha / 100) : 1);
								}
								if (version.id != 'notify' && values['effects'] == 'shadow') {
									var tmpCtx4 = imagelib.drawing.context(iconSize);
									imagelib.drawing[values['crop'] ? 'drawCenterCrop' : 'drawCenterInside']
									(tmpCtx4, copyFrom, targetRect, {
										x: 0, y: 0,
										w: foreSize.w, h: foreSize.h
									});
									imagelib.effects.renderLongShadow(tmpCtx4, iconSize.w, iconSize.h);
									imagelib.drawing.copy(tmpCtx2, tmpCtx4, iconSize);
								}
								imagelib.drawing[values['crop'] ? 'drawCenterCrop' : 'drawCenterInside']
								(tmpCtx2, copyFrom, targetRect, {
									x: 0, y: 0,
									w: foreSize.w, h: foreSize.h
								});
								imagelib.drawing.copy(tmpCtx, tmpCtx2, iconSize);
							}
							tmpCtx.restore();
							var foreEffect = 1;
							imagelib.drawing.copy(outCtx, IMAGE_RESOURCES[(version.id == 'splash' ? 'splash' : (version.id == 'launcher_round' ? 'launcher_round' : backgroundShape))+'-back'], iconSize);
							imagelib.drawing.copy(outCtx, tmpCtx, iconSize);
							imagelib.drawing.copy(outCtx, IMAGE_RESOURCES[(version.id == 'splash' ? 'splash' : (version.id == 'launcher_round' ? 'launcher_round' : backgroundShape))+'-fore'+foreEffect], iconSize);
						}
						imagelib.loadFromUri(outCtx.canvas.toDataURL(), function(version, density) {
							return function(img) {
								document.querySelector('#'+version+'-'+density).src = img.src;
							};
						}(version.id, density));
					}
				}
			}
		}
		console.log('finish', (Math.round(new Date().getTime())-time));
		time = 0;
	};
	continue_((values['foreground'] ? values['foreground'].ctx : null));
}
form = new studio.forms.Form('iconform', {
	onChange: function(field) {
		if (time == 0)
			time = Math.round(new Date().getTime());
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
			defaultValue: [ 'xxhdpi' ]
		}),
		new studio.forms.ImageField('foreground', {
			title: 'Содержимое',
			maxFinalSize: { w: 720, h: 720 },
			defaultValueTrim: 1
		}),
		new studio.forms.ColorField('foreColor', {
			title: 'Цвет',
			defaultValue: '#607d8b',
			alpha: true,
			defaultAlpha: 0
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
			defaultValue: '#ffffff'
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
		if (version.id != 'splash' || density.id.match('xhdpi'))
			studio.ui.createImageOutputSlot({
				container: group,
				id: version.id+'-'+density.id,
				label: density.id
			});
	}
}
console.log(form);
