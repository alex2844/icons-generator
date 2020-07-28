var Base = function() {};
Base.extend = function(b, e) {
	var f = Base.prototype.extend;
	Base._prototyping = true;
	var d = new this;
	f.call(d, b);
	delete Base._prototyping;
	var c = d.constructor;
	var a = d.constructor = function() {
		if (!Base._prototyping) {
			if (this._constructing || this.constructor == a) {
				this._constructing = true;
				c.apply(this, arguments);
				delete this._constructing
			}else if (arguments[0] != null)
				return (arguments[0].extend || f).call(arguments[0], d)
		}
	};
	a.extend = this.extend;
	a.prototype = d;
	f.call(a, e);
	return a;
};
Base.prototype = {
	extend: function(b, h) {
		if (arguments.length > 1) {
			var e = this[b];
			if (e && (typeof h == 'function') && (!e.valueOf || e.valueOf() != h.valueOf()) && /\bbase\b/.test(h)) {
				var a = h.valueOf();
				h = function() {
					var l = this.base || Base.prototype.base;
					this.base = e;
					var i = a.apply(this, arguments);
					this.base = l;
					return i
				};
				h.valueOf = i => ((i == 'object') ? h : a);
			}
			this[b] = h
		}else if (b) {
			var g = Base.prototype.extend;
			if (!Base._prototyping && typeof this != 'function')
				g = this.extend || g
			var d = { toSource: null },
				f = [ 'constructor', 'toString', 'valueOf' ],
				c = Base._prototyping ? 0 : 1;
			while (j = f[c++]) {
				if (b[j] != d[j])
					g.call(this, j, b[j])
			}
			for (var j in b) {
				if (!d[j])
					g.call(this, j, b[j])
			}
		}
		return this
	},
	base: function() {}
};
Base = Base.extend({
	constructor: function() {
		this.extend(arguments[0])
	}
}, {});
(function() {
	var imagelib = {};
	imagelib.RESOURCES = {};
	imagelib.drawing = {};
	imagelib.drawing.context = size => {
		var canvas = document.createElement('canvas');
		canvas.width = size.w;
		canvas.height = size.h;
		canvas.style.setProperty('image-rendering', 'optimizeQuality', null);
		return canvas.getContext('2d')
	};
	imagelib.drawing.copy = (dstCtx, src, size) => dstCtx.drawImage(src.canvas || src, 0, 0, size.w, size.h);
	imagelib.drawing.clear = (ctx, size) => ctx.clearRect(0, 0, size.w, size.h);
	imagelib.drawing.drawCenterInside = (dstCtx, src, dstRect, srcRect) => {
		if (srcRect.w / srcRect.h > dstRect.w / dstRect.h) {
			var h = srcRect.h * dstRect.w / srcRect.w;
			imagelib.drawing.drawImageScaled(dstCtx, src, srcRect.x, srcRect.y, srcRect.w, srcRect.h, dstRect.x, dstRect.y + (dstRect.h - h) / 2, dstRect.w, h)
		}else{
			var w = srcRect.w * dstRect.h / srcRect.h;
			imagelib.drawing.drawImageScaled(dstCtx, src, srcRect.x, srcRect.y, srcRect.w, srcRect.h, dstRect.x + (dstRect.w - w) / 2, dstRect.y, w, dstRect.h)
		}
	};
	imagelib.drawing.drawCenterCrop = (dstCtx, src, dstRect, srcRect) => {
		if (srcRect.w / srcRect.h > dstRect.w / dstRect.h) {
			var w = srcRect.h * dstRect.w / dstRect.h;
			imagelib.drawing.drawImageScaled(dstCtx, src, srcRect.x + (srcRect.w - w) / 2, srcRect.y, w, srcRect.h, dstRect.x, dstRect.y, dstRect.w, dstRect.h)
		}else{
			var h = srcRect.w * dstRect.h / dstRect.w;
			imagelib.drawing.drawImageScaled(dstCtx, src, srcRect.x, srcRect.y + (srcRect.h - h) / 2, srcRect.w, h, dstRect.x, dstRect.y, dstRect.w, dstRect.h)
		}
	};
	imagelib.drawing.drawImageScaled = (dstCtx, src, sx, sy, sw, sh, dx, dy, dw, dh) => {
		if (dw < sw / 2 && dh < sh / 2) {
			sx = Math.floor(sx);
			sy = Math.floor(sy);
			sw = Math.ceil(sw);
			sh = Math.ceil(sh);
			dx = Math.floor(dx);
			dy = Math.floor(dy);
			dw = Math.ceil(dw);
			dh = Math.ceil(dh);
			var tmpCtx = imagelib.drawing.context({
				w: sw,
				h: sh
			});
			tmpCtx.drawImage(src.canvas || src, -sx, -sy);
			var srcData = tmpCtx.getImageData(0, 0, sw, sh);
			var outCtx = imagelib.drawing.context({
				w: dw,
				h: dh
			});
			var tr, tg, tb, ta,
				numOpaquePixels,
				numPixels,
				outData = outCtx.createImageData(dw, dh);
			for (var y = 0; y < dh; y++) {
				for (var x = 0; x < dw; x++) {
					tr = tg = tb = ta = 0;
					numOpaquePixels = numPixels = 0;
					for (var j = Math.floor(y * sh / dh); j < (y + 1) * sh / dh; j++) {
						for (var i = Math.floor(x * sw / dw); i < (x + 1) * sw / dw; i++) {
							++numPixels;
							ta += srcData.data[(j * sw + i) * 4 + 3];
							if (srcData.data[(j * sw + i) * 4 + 3] == 0)
								continue
							++numOpaquePixels;
							tr += srcData.data[(j * sw + i) * 4 + 0];
							tg += srcData.data[(j * sw + i) * 4 + 1];
							tb += srcData.data[(j * sw + i) * 4 + 2]
						}
					}
					outData.data[(y * dw + x) * 4 + 0] = tr / numOpaquePixels;
					outData.data[(y * dw + x) * 4 + 1] = tg / numOpaquePixels;
					outData.data[(y * dw + x) * 4 + 2] = tb / numOpaquePixels;
					outData.data[(y * dw + x) * 4 + 3] = ta / numPixels
				}
			}
			outCtx.putImageData(outData, 0, 0);
			dstCtx.drawImage(outCtx.canvas, dx, dy)
		}else
			dstCtx.drawImage(src.canvas || src, sx, sy, sw, sh, dx, dy, dw, dh)
	};
	imagelib.drawing.trimRectWorkerJS_ = `
		self['onmessage'] = function(event) {
			var alpha,
				l = event.data.size.w,
				t = event.data.size.h,
				r = 0,
				b = 0;
			for (var y = 0; y < event.data.size.h; y++) {
				for (var x = 0; x < event.data.size.w; x++) {
					alpha = event.data.imageData.data[((y * event.data.size.w + x) << 2) + 3];
					if (alpha >= event.data.minAlpha) {
						l = Math.min(x, l);
						t = Math.min(y, t);
						r = Math.max(x, r);
						b = Math.max(y, b);
					}
				}
			}
			if (l > r) {
				postMessage({
					x: 0, y: 0, w: event.data.size.w, h: event.data.size.h
				});
				return;
			}
			postMessage({
				x: l, y: t, w: r - l + 1, h: b - t + 1
			});
		};
	`;
	imagelib.drawing.getTrimRect = (ctx, size, minAlpha, callback) => {
		callback = callback || function() {};
		if (!ctx.canvas) {
			var src = ctx;
			ctx = imagelib.drawing.context(size);
			imagelib.drawing.copy(ctx, src, size)
		}
		if (minAlpha == 0)
			callback({
				x: 0,
				y: 0,
				w: size.w,
				h: size.h
			})
		minAlpha = minAlpha || 1;
		var worker = imagelib.util.runWorkerJs(imagelib.drawing.trimRectWorkerJS_, {
			imageData: ctx.getImageData(0, 0, size.w, size.h),
			size: size,
			minAlpha: minAlpha
		}, callback);
		return worker;
	};
	imagelib.drawing.getCenterOfMass = (ctx, size, minAlpha, callback) => {
		callback = callback || function() {};
		if (!ctx.canvas) {
			var src = ctx;
			ctx = imagelib.drawing.context(size);
			imagelib.drawing.copy(ctx, src, size)
		}
		var l = size.w,
			t = size.h,
			r = 0,
			b = 0,
			imageData = ctx.getImageData(0, 0, size.w, size.h),
			sumX = 0,
			sumY = 0,
			n = 0;
		if (n <= 0)
			callback({
				x: size.w / 2,
				h: size.h / 2
			});
		callback({
			x: Math.round(sumX / n),
			y: Math.round(sumY / n)
		});
	};
	imagelib.drawing.applyFilter = (filter, ctx, size) => {
		var src = ctx.getImageData(0, 0, size.w, size.h),
			dst = ctx.createImageData(size.w, size.h);
		filter.apply(src, dst);
		ctx.putImageData(dst, 0, 0)
	};
	imagelib.effects = {};
	imagelib.effects.renderLongShadow = (ctx, w, h) => {
		var imgData = ctx.getImageData(0, 0, w, h);
		for (var y = 0; y < imgData.height; y++) {
			for (var x = 0; x < imgData.width; x++) {
				if (imagelib.effects.isInShade(imgData, x, y))
					imagelib.effects.castShade(imgData, x, y)
			}
		}
		ctx.putImageData(imgData, 0, 0)
	};
	imagelib.effects.renderScore = (ctx, w, h) => {
		var imgData = ctx.getImageData(0, 0, w, h);
		for (var y = 0; y < imgData.height / 2; y++) {
			for (var x = 0; x < imgData.width; x++) {
				var color = [0, 0, 0, 24];
				imagelib.effects.setColor(imgData, x, y, color)
			}
		}
		ctx.putImageData(imgData, 0, 0)
	};
	imagelib.effects.isInShade = (imgData, x, y) => {
		var data = imgData.data;
		while (true) {
			x -= 1;
			y -= 1;
			if (x < 0 || y < 0)
				return false
			if (imagelib.effects.getAlpha(imgData, x, y))
				return true
		}
	};
	imagelib.effects.castShade = (imgData, x, y) => {
		var n = 32,
			step = n / (imgData.width + imgData.height),
			alpha = n - ((x + y) * step),
			color = [0, 0, 0, alpha];
		return imagelib.effects.setColor(imgData, x, y, color)
	};
	imagelib.effects.setColor = (imgData, x, y, color) => {
		var i = (y * imgData.width + x) * 4,
			d = imgData.data;
		d[i] = color[0];
		d[i + 1] = color[1];
		d[i + 2] = color[2];
		d[i + 3] = color[3]
	};
	imagelib.effects.getAlpha = (imgData, x, y) => {
		var d = imgData.data,
			i = (y * imgData.width + x) * 4 + 3;
		return d[i]
	};
	imagelib.loadImageResources = (images, callback) => {
		var checkForCompletion = () => {
			for (var id in images) {
				if (!(id in imagelib.RESOURCES))
					return
			}
			(callback || function() {})(imagelib.RESOURCES);
			callback = null;
		};
		for (var id in images) {
			var img = document.createElement('img');
			img.src = images[id];
			((img, id) => {
				img.onload = () => {
					imagelib.RESOURCES[id] = img;
					checkForCompletion()
				};
				img.onerror = () => {
					imagelib.RESOURCES[id] = null;
					checkForCompletion()
				}
			})(img, id)
		}
	};
	imagelib.loadFromUri = (uri, callback) => {
		callback = callback || function() {};
		var img = document.createElement('img');
		img.src = uri;
		img.onload = () => callback(img);
		img.onerror = () => callback(null);
	};
	imagelib.toDataUri = img => {
		var canvas = document.createElement('canvas');
		canvas.width = img.naturalWidth;
		canvas.height = img.naturalHeight;
		var ctx = canvas.getContext('2d');
		ctx.drawImage(img, 0, 0);
		return canvas.toDataURL()
	};
	imagelib.util = {};
	imagelib.util.runWorkerJs = (js, params, callback) => {
		/*
		var Worker = window.Worker,
			bb = new Blob([ js ], { type: "text/javascript" }),
			worker = new Worker(URL.createObjectURL(bb));
		worker.onmessage = (event) => callback(event.data);
		worker.postMessage(params);
		return worker
		 */
		(function() {
			var __DUMMY_OBJECT__ = {},
				postMessage = (result) => callback(result);
			eval("var self=__DUMMY_OBJECT__;\n" + js);
			__DUMMY_OBJECT__.onmessage({
				data: params
			})
		})();
		return {
			terminate: () => {}
		}
	};
	imagelib.util.adler32 = arr => {
		arr = arr || [];
		var adler = new imagelib.util.Adler32();
		for (var i = 0; i < arr.length; i++) {
			adler.addNext(arr[i])
		}
		return adler.compute()
	};
	imagelib.util.Adler32 = function() {
		this.reset();
	};
	imagelib.util.Adler32._MOD_ADLER = 65521;
	imagelib.util.Adler32.prototype.reset = function() {
		this._a = 1;
		this._b = 0;
		this._index = 0
	};
	imagelib.util.Adler32.prototype.addNext = function(value) {
		this._a = (this._a + value) % imagelib.util.Adler32._MOD_ADLER;
		this._b = (this._b + this._a) % imagelib.util.Adler32._MOD_ADLER
	};
	imagelib.util.Adler32.prototype.compute = function() {
		return (this._b << 16) | this._a
	};
	imagelib.util.Summer = imagelib.util.Adler32;
	imagelib.util.Summer.prototype = imagelib.util.Adler32.prototype;
	window.imagelib = imagelib
})();
(function() {
	var b = {};
	b.forms = {};
	b.forms.Form = Base.extend({
		constructor: function(e, d) {
			this.id_ = e;
			this.params_ = d;
			this.fields_ = d.fields;
			this.pauseNotify_ = false;
			for (var c = 0; c < this.fields_.length; c++) {
				this.fields_[c].setForm_(this)
			}
			this.onChange = this.params_.onChange || function() {}
		},
		createUI: function(c) {
			for (var d = 0; d < this.fields_.length; d++) {
				var e = this.fields_[d];
				e.createUI(c)
			}
		},
		notifyChanged_: function(c) {
			if (this.pauseNotify_)
				return
			this.onChange(c)
		},
		getValues: function() {
			var c = {};
			for (var d = 0; d < this.fields_.length; d++) {
				var e = this.fields_[d];
				c[e.id_] = e.getValue()
			}
			return c
		},
		getValuesSerialized: function() {
			var c = {};
			for (var d = 0; d < this.fields_.length; d++) {
				var f = this.fields_[d],
					e = f.serializeValue ? f.serializeValue() : undefined;
				if (e !== undefined)
					c[f.id_] = f.serializeValue()
			}
			return c
		},
		setValuesSerialized: function(d) {
			this.pauseNotify_ = true;
			for (var c = 0; c < this.fields_.length; c++) {
				var e = this.fields_[c];
				if (e.id_ in d && e.deserializeValue)
					e.deserializeValue(d[e.id_])
			}
			this.pauseNotify_ = false;
			this.notifyChanged_(null)
		}
	});
	b.forms.Field = Base.extend({
		constructor: function(d, c) {
			this.id_ = d;
			this.params_ = c
		},
		setForm_: function(c) {
			this.form_ = c
		},
		getLongId: function() {
			return this.form_.id_ + "-" + this.id_
		},
		getHtmlId: function() {
			return "_frm-" + this.getLongId()
		},
		createUI: function(c) {
			c.append(this.baseEl_ = $('<div class="form-field-outer"><h2>'+this.params_.title+'</h2><div class="form-field-container"></div></div>').firstElementChild);
			return this.baseEl_;
		}
	});
	b.forms.TextField = b.forms.Field.extend({
		createUI: function(c) {
			var e = $(".form-field-container", this.base(c)),
				id = this.getHtmlId(),
				el_ = $('<label class="input"><input type="text" class="form-text" id="'+id+'" value="'+this.getValue()+'" /></label>').firstElementChild,
				f = this;
			this.el_ = el_.firstElementChild.on("change", function() {
				d.setValue(this.value, true)
			}).on("change", function() {
				var h = this;
				window.setTimeout(() => f.setValue(h.value, true), 0)
			});
			if (this.params_.list) {
				el_.append($('<datalist id="'+id+'-list">'));
				this.el_.setAttribute('list', id+'-list');
			}
			e.append(el_);
		},
		getValue: function() {
			var c = this.value_;
			if (typeof c != "string")
				c = this.params_.defaultValue || ""
			return c
		},
		setValue: function(d, c) {
			this.value_ = d;
			if (!c)
				this.el_.value = d;
			this.form_.notifyChanged_(this)
		},
		serializeValue: function() {
			return this.getValue()
		},
		deserializeValue: function(c) {
			this.setValue(c)
		}
	});
	b.forms.ColorField = b.forms.Field.extend({
		createUI: function(c) {
			var e = $('.form-field-container', this.base(c)),
				d = this;
			this.el_ = $('<label class="input"><input class="form-color" type="color" id="'+this.getHtmlId()+'" value="'+this.getValue().color+'" /></label>').firstElementChild;
			this.el_.firstElementChild.onchange = el_ => d.setValue({ color: el_.target.value }, true);
			e.append(this.el_);
		},
		getValue: function() {
			var c = this.value_ || this.params_.defaultValue || '#000000';
			if (/^([0-9a-f]{6}|[0-9a-f]{3})$/i.test(c))
				c = '#'+c
			var d = this.alpha_;
			if (typeof d != 'number') {
				d = this.params_.defaultAlpha;
				if (typeof d != 'number')
					d = 100
			}
			return {
				color: c,
				alpha: d
			}
		},
		setValue: function(e, d) {
			e = e || {};
			if ('color' in e)
				this.value_ = e.color
			var c = this.getValue();
			this.el_.value = c.color;
			this.form_.notifyChanged_(this)
		},
		serializeValue: function() {
			return this.getValue().color.replace(/^#/, '');
		},
		deserializeValue: function(d) {
			var e = {},
				c = d.split(',', 2);
			if (c.length >= 1)
				e.color = c[0]
			this.setValue(e)
		}
	});
	b.forms.EnumField = b.forms.Field.extend({
		createUI: function(c) {
			var g = $('.form-field-container', this.base(c)),
				f = this;
			this.el_ = $('<div id="'+this.getHtmlId()+'" class="form-field-buttonset">').firstElementChild;
			g.append(this.el_);
			for (var d = 0; d < this.params_.options.length; d++) {
				var e = this.params_.options[d];
				let el_ = $(
					`<label class="${this.params_.type || 'radio'}">
						<input type="${this.params_.type || 'radio'}" name="${this.getHtmlId()}" id="${this.getHtmlId()+'-'+e.id}" value="${e.id}" />
						<span>${e.title || e.id}</span>
					</label>`
				).firstElementChild;
				el_.firstElementChild.on('change', function() {
					f.setValueInternal_(this.value, true)
				});
				this.el_.append(el_);
			}
			this.setValueInternal_(this.getValue())
		},
		getValue: function() {
			var c;
			if (this.params_.type == 'checkbox') {
				c = $$('input', this.el_).filter(f => f.checked).map(f => f.value);
				if (!c.length)
					c = this.params_.defaultValue || [ this.params_.options[0].id ]
			}else{
				c = this.value_;
				if (c === undefined)
					c = this.params_.defaultValue || this.params_.options[0].id
			}
			return c
		},
		setValue: function(d, c) {
			this.setValueInternal_(d, c)
		},
		setValueInternal_: function(d, c) {
			if (this.params_.type == 'checkbox') {
				this.value_ = $$('input', this.el_).filter(f => f.checked).map(f => f.value);
				if (!c)
					$$('input', this.el_).forEach(f => (f.checked = (((typeof(d) == 'string') ? [ d ] : d).indexOf(f.value) > -1)));
			}else{
				this.value_ = d;
				if (!c)
					$$('input', this.el_).forEach(f => (f.checked = (f.value == d)));
			}
			this.form_.notifyChanged_(this)
		},
		serializeValue: function() {
			return this.getValue()
		},
		deserializeValue: function(c) {
			this.setValue(c)
		}
	});
	b.forms.BooleanField = b.forms.EnumField.extend({
		constructor: function(d, c) {
			c.options = [{
				id: '1',
				title: c.onText || 'Yes'
			}, {
				id: '0',
				title: c.offText || 'No'
			}];
			c.defaultValue = c.defaultValue ? '1' : '0';
			c.buttons = true;
			this.base(d, c)
		},
		getValue: function() {
			return this.base() == '1'
		},
		setValue: function(d, c) {
			this.base(d ? '1' : '0', c)
		},
		serializeValue: function() {
			return this.getValue() ? '1' : '0'
		},
		deserializeValue: function(c) {
			this.setValue(c == '1')
		}
	});
	b.forms.RangeField = b.forms.Field.extend({
		createUI: function(c) {
			var e = $('.form-field-container', this.base(c)),
				el_ = $('<label class="range"><input value="'+this.getValue()+'" type="range" min="'+(this.params_.min || 0)+'" max="'+(this.params_.max || 100)+'" step="'+(this.params_.step || 1)+'" class="form-range" /></label>').firstElementChild;
				d = this;
			(this.el_ = el_.firstElementChild).on('change', () => d.setValue(Number(d.el_.value) || 0, true));
			e.append(el_);
			if (this.params_.textFn || this.params_.showText) {
				this.params_.textFn = this.params_.textFn || function(f) {
					return f
				};
				el_.append(this.textEl_ = $('<span class="form-range-text">'+this.params_.textFn(this.getValue())+'</span>').firstElementChild);
			}
		},
		getValue: function() {
			var c = this.value_;
			if (typeof c != 'number') {
				c = this.params_.defaultValue;
				if (typeof c != 'number')
					c = 0
			}
			return c
		},
		setValue: function(d, c) {
			this.value_ = d;
			if (!c)
				this.el_.value = d
			if (this.textEl_)
				this.textEl_.textContent = this.params_.textFn(d);
			this.form_.notifyChanged_(this)
		},
		serializeValue: function() {
			return this.getValue()
		},
		deserializeValue: function(c) {
			this.setValue(Number(c))
		}
	});
	b.hash = {};
	b.hash.boundFormOldOnChange_ = null;
	b.hash.boundForm_ = null;
	b.hash.currentParams_ = {};
	b.hash.currentHash_ = null;
	b.hash.bindFormToDocumentHash = d => {
		if (!b.hash.boundForm_) {
			var e = () => {
				var f = b.hash.paramsToHash(b.hash.hashToParams((document.location.href.match(/#.*/) || [""])[0]));
				if (f != b.hash.currentHash_) {
					var g = f,
						h = b.hash.hashToParams(g);
					b.hash.onHashParamsChanged_(h);
					b.hash.currentParams_ = h;
					b.hash.currentHash_ = g
				}
				window.setTimeout(e, 100)
			};
			window.setTimeout(e, 0)
		}
		if (b.hash.boundFormOldOnChange_ && b.hash.boundForm_)
			b.hash.boundForm_.onChange = b.hash.boundFormOldOnChange_
		b.hash.boundFormOldOnChange_ = d.onChange;
		b.hash.boundForm_ = d;
		var c = null;
		b.hash.boundForm_.onChange = function() {
			if (c)
				window.clearTimeout(c)
			c = window.setTimeout(() => b.hash.onFormChanged_(), 500);
			(b.hash.boundFormOldOnChange_ || function() {}).apply(d, arguments)
		}
	};
	b.hash.onHashParamsChanged_ = c => (b.hash.boundForm_ && b.hash.boundForm_.setValuesSerialized(c));
	b.hash.onFormChanged_ = () => {
		if (b.hash.boundForm_) {
			b.hash.currentParams_ = b.hash.boundForm_.getValuesSerialized();
			b.hash.currentHash_ = b.hash.paramsToHash(b.hash.currentParams_);
			document.location.hash = b.hash.currentHash_
		}
	};
	b.hash.hashToParams = l => {
		var e = {};
		l = l.replace(/^[?#]/, "");
		var c = l.split("&");
		for (var m = 0; m < c.length; m++) {
			var g = c[m].split("=", 2),
				p = g[0] ? decodeURIComponent(g[0]) : g[0],
				d = g[1] ? decodeURIComponent(g[1]) : g[1],
				n = p.split("."),
				h = e;
			for (var f = 0; f < n.length - 1; f++) {
				h[n[f]] = h[n[f]] || {};
				h = h[n[f]]
			}
			var o = n[n.length - 1];
			if (o in h) {
				if (h[o] && h[o].splice)
					h[o].push(d)
				else
					h[o] = [h[o], d]
			}else
				h[o] = d
		}
		return e
	};
	b.hash.paramsToHash = (l, f) => {
		var c = [];
		var h = i => encodeURIComponent((f ? f + '.' : '') + i);
		var g = (m, i) => {
			c.push(h(m)+'='+encodeURIComponent(((i === true) ? 1 : ((i === false) ? 0 : i)).toString()));
		};
		for (var e in l) {
			var j = l[e];
			if (j === undefined || j === null)
				continue
			if (typeof j == 'object') {
				if (j.splice && j.length)
					for (var d = 0; d < j.length; d++) {
						g(e, j[d])
					}
				else
					c.push(b.hash.paramsToHash(j, h(e)))
			}else
				g(e, j)
		}
		return c.join('&')
	};
	var a = false;
	b.forms.ImageField = b.forms.Field.extend({
		constructor: function(d, c) {
			this.valueType_ = null;
			this.textParams_ = {};
			this.imageParams_ = {};
			this.spaceFormValues_ = {};
			this.base(d, c)
		},
		createUI: function(d) {
			var l = this.base(d),
				h = $('.form-field-container', l),
				n = this;
			h.append(this.el_ = $('<div id="'+this.getHtmlId()+'" class="form-field-buttonset"></div>').firstElementChild);
			var e = {};
			e.image = $('<label for="'+this.getHtmlId()+'">Изображение</label>').firstElementChild;
			this.el_.append(e.image);
			e.clipart = $('<details data-id="clipart"><summary>Иконка</summary></details>').firstElementChild;
			this.el_.append(e.clipart);
			e.text = $('<details data-id="text"><summary>Текст</summary></details>').firstElementChild;
			this.el_.append(e.text);
			this.el_.append(this.fileEl_ = $('<input id="'+this.getHtmlId()+'" type="file" accept="image/*" hidden />').firstElementChild.on('change', function() {
				b.forms.ImageField.loadImageFromFileList(n.fileEl_.files, function(i) {
					if (!i)
						return
					n.setValueType_('image');
					n.loadImage_(i);
				})
			}));
			e.image.on('click', i => {
				n.fileEl_.click();
				n.setValueType_(null);
				n.renderValueAndNotifyChanged_();
				i.preventDefault();
				return false
			});
			var q,
				c = $('<div class="form-image-type-params form-image-type-params-clipart">').firstElementChild;
				j = $('<label class="input"><input class="form-image-clipart-filter form-text" placeholder="Фильтр" /></label>').firstElementChild;
			j.firstElementChild.on('keydown', function() {
				var i = this;
				setTimeout(function() {
					var r = i.value.toLowerCase().replace(/[^\w]+/g, '');
					console.log(r);
					q.$$('.card').forEach(el_ => (el_.hidden = (!r ? false : (el_.$('.material-icons').textContent.indexOf(r) == -1))));
				}, 0)
			});
			c.append(j);
			c.append(q = $('<div class="_ form-image-clipart-list cancel-parent-scroll">').firstElementChild);
			e.clipart.on('toggle', i => {
				if (!e.clipart.open)
					return;
				if (n.valueType_ != 'clipart') {
					n.setValueType_('clipart');
					if (b.AUTO_TRIM)
						n.spaceFormTrimField_.setValue(false)
					n.renderValueAndNotifyChanged_()
				}
				if (!e.clipart.open_) {
					fetch('https://raw.githubusercontent.com/alex2844/icons-generator/gh-pages/icons.json').then(d => d.json()).then(d => {
						let body = '';
						Object.keys(d).forEach(k => {
							body += `<div class="_c12">${k}</div>`;
							d[k].forEach(v => {
								body += `<div class="card _c2"><div class="media"><i class="material-icons">${v}</i></div></div>`;
							});
						});
						$('.form-image-clipart-list').html(body).on('click', e => {
							if (e.target.tagName != 'I')
								return;
							n.textForm_.setValuesSerialized({
								text: e.target.textContent,
								font: 'Material Icons'
							});
							n.tryLoadWebFont_()
							n.setValueType_('text');
							n.renderValueAndNotifyChanged_()
						});
					});
					e.clipart.open_ = true;
				}
			});
			e.clipart.append(c);
			var f = $('<div class="form-subform form-image-type-params form-image-type-params-text">').firstElementChild;
			h.append(f);
			this.textForm_ = new b.forms.Form(this.form_.id_+'-'+this.id_+'-textform', {
				onChange: () => {
					var i = n.textForm_.getValues();
					n.textParams_.text = i.text;
					$('#_frm-iconform-foreground-textform-text').style['font-family'] = (n.textParams_.fontStack = i.font ? i.font : 'Roboto, sans-serif');
					n.valueFilename_ = i.text;
					n.tryLoadWebFont_();
					n.renderValueAndNotifyChanged_()
				},
				fields: [
					new b.forms.TextField('text', { title: 'Текст' }),
					new b.forms.TextField('font', {
						title: 'Шрифт',
						list: true
					})
				]
			});
			this.textForm_.createUI(e.text);
			e.text.on('toggle', i => {
				if (!e.text.open)
					return;
				if (n.valueType_ != 'text') {
					n.setValueType_('text');
					if (b.AUTO_TRIM)
						n.spaceFormTrimField_.setValue(true)
					n.renderValueAndNotifyChanged_()
				}
				if (!e.text.open_) {
					let ac = $('#'+this.getHtmlId()+'-textform-font');
					ac.on('focus', () => {
						fetch('https://raw.githubusercontent.com/alex2844/icons-generator/gh-pages/fonts.json').then(d => d.json()).then(d => {
							d.forEach(v => ac.list.append(new Option(v)));
						});
					}, { once: true });
					e.text.open_ = true;
				}
			});
			this.spaceForm_ = new b.forms.Form(this.form_.id_+'-'+this.id_+'-spaceform', {
				onChange: () => {
					n.spaceFormValues_ = n.spaceForm_.getValues();
					n.renderValueAndNotifyChanged_()
				},
				fields: [
					(this.spaceFormTrimField_ = new b.forms.BooleanField('trim', {
						title: 'Обрезать',
						defaultValue: this.params_.defaultValueTrim || false,
						offText: 'Нет',
						onText: 'Да'
					})),
					new b.forms.RangeField('pad', {
						title: 'Отступ',
						defaultValue: .25,
						min: -0.1,
						max: 0.5,
						step: 0.05,
						textFn: i => (i * 100).toFixed(0)+'%'
					})
				]
			});
			let t = $('<div class="form-subform">').firstElementChild;
			h.append(t);
			this.spaceForm_.createUI(t);
			this.spaceFormValues_ = this.spaceForm_.getValues()
		},
		tryLoadWebFont_: function(e) {
			var f = this.textForm_.getValues()['font'];
			if (this.loadedWebFont_ == f || !f)
				return
			var d = this;
			if (!e) {
				if (this.tryLoadWebFont_.timeout_)
					clearTimeout(this.tryLoadWebFont_.timeout_)
				this.tryLoadWebFont_.timeout_ = setTimeout(() => d.tryLoadWebFont_(true), 500);
				return
			}
			this.loadedWebFont_ = f;
			var c, c_;
			if (c_ = $('#'+(this.form_.id_+'-'+this.id_+'-__webfont-stylesheet__')))
				c_.remove();
			if (f.indexOf('Material') != 0)
				document.head.append($('<link id="'+c+'" rel="stylesheet" href="https://fonts.googleapis.com/css?family='+encodeURIComponent(f)+'" />').firstElementChild.on("load", function() {
					d.renderValueAndNotifyChanged_();
					window.setTimeout(() => d.renderValueAndNotifyChanged_(), 500)
				}));
		},
		setValueType_: function(c) {
			this.valueType_ = c;
			$$('details', this.el_.parentNode).forEach(f => ((f.dataset.id != c) && (f.open = false)));
		},
		loadImage_: function(i) {
			this.imageParams_ = (i.uri ? i : { uri: i });
			this.imageSrc_ = i.uri;
			this.renderValueAndNotifyChanged_()
		},
		clearValue: function() {
			this.valueType_ = null;
			this.valueFilename_ = null;
			this.valueCtx_ = null;
			this.valueOrigImg_ = null;
			this.fileEl_.value = '';
			if (this.imagePreview_)
				this.imagePreview_.hidden = true;
		},
		getValue: function() {
			return {
				ctx: this.valueCtx_,
				origImg: this.valueOrigImg_,
				type: this.valueType_,
				name: this.valueFilename_
			}
		},
		renderValueAndNotifyChanged_: function() {
			if (!this.valueType_) {
				this.valueCtx_ = null;
				this.valueOrigImg_ = null
			}
			var g = this;
			switch (this.valueType_) {
				case 'image':
					if (this.imageParams_.canvgSvgText || this.imageParams_.canvgSvgUri) {
						var e = document.createElement('canvas');
						var f = {
							w: 800,
							h: 800
						};
						e.className = 'offscreen';
						e.width = f.w;
						e.height = f.h;
						document.body.appendChild(e);
						canvg(e, this.imageParams_.canvgSvgText || this.imageParams_.canvgSvgUri, {
							scaleWidth: f.w,
							scaleHeight: f.h,
							ignoreMouse: true,
							ignoreAnimation: true,
							ignoreDimensions: true,
							ignoreClear: true
						});
						d(e.getContext('2d'), f);
						document.body.removeChild(e)
					}else if (this.imageParams_.uri)
						imagelib.loadFromUri(this.imageParams_.uri, function(m) {
							g.valueOrigImg_ = m;
							var n = {
								w: m.naturalWidth,
								h: m.naturalHeight
							};
							if (g.imageParams_.isSvg && g.params_.maxFinalSize)
								n = {
									w: g.params_.maxFinalSize.w,
									h: g.params_.maxFinalSize.h
								}
							var l = imagelib.drawing.context(n);
							imagelib.drawing.copy(l, m, n);
							d(l, n)
						})
				break;
				case 'text':
					if (this.textParams_.text) {
						var f = {
							w: 4800,
							h: 1600
						};
						var i = f.h * 0.75,
							c = imagelib.drawing.context(f),
							h = ' '+this.textParams_.text+' ';
						c.fillStyle = '#000';
						c.font = 'bold '+i+'px/'+f.h+'px '+this.textParams_.fontStack;
						c.textBaseline = 'alphabetic';
						c.fillText(h, 0, i);
						f.w = Math.ceil(Math.min(c.measureText(h).width, f.w) || f.w);
						d(c, f);
					}
				break;
				default:
					g.form_.notifyChanged_(g)
			}
			function d(m, l) {
				if (g.spaceFormValues_.trim) {
					if (g.trimWorker_)
						g.trimWorker_.terminate()
					g.trimWorker_ = imagelib.drawing.getTrimRect(m, l, 1, n => j(m, l, n));
				}else
					j(m, l, {
						x: 0,
						y: 0,
						w: l.w,
						h: l.h
					})
			}
			function j(p, n, o) {
				var s = g.spaceFormValues_.trim ? 0.001 : 0;
				if (o.x == 0 && o.y == 0 && o.w == n.w && o.h == n.h)
					s = 0
				var r = Math.round(((g.spaceFormValues_.pad || 0) + s) * Math.min(o.w, o.h));
				var q = {
					x: r,
					y: r,
					w: o.w,
					h: o.h
				};
				var m = imagelib.drawing.context({
					w: o.w + r * 2,
					h: o.h + r * 2
				});
				imagelib.drawing.drawCenterInside(m, p, q, o);
				g.valueCtx_ = m;
				if (g.imagePreview_) {
					g.imagePreview_.width = m.canvas.width;
					g.imagePreview_.height = m.canvas.height;
					var l = g.imagePreview_.getContext('2d');
					l.drawImage(m.canvas, 0, 0);
					g.imagePreview_.hidden = false;
				}
				g.form_.notifyChanged_(g)
			}
		},
		serializeValue: function() {
			let res = {
				type: this.valueType_,
				space: this.spaceForm_.getValuesSerialized(),
				image: (this.valueType_ == 'image') ? this.imageParams_.uri : null,
				text: (this.valueType_ == 'text') ? this.textForm_.getValuesSerialized() : null
			}
			return res;
		},
		deserializeValue: function(c) {
			if (c.type) {
				let el_ = $('details[data-id="'+c.type+'"]');
				if (el_)
					el_.open = true;
				this.setValueType_(c.type);
			}
			if (c.space) {
				this.spaceForm_.setValuesSerialized(c.space);
				this.spaceFormValues_ = this.spaceForm_.getValues()
			}
			if (c.image && this.valueType_ == 'image')
				this.loadImage_(c.image)
			if (c.text && this.valueType_ == 'text') {
				this.textForm_.setValuesSerialized(c.text);
				this.tryLoadWebFont_()
			}
		}
	});
	b.forms.ImageField.loadImageFromFileList = (d, j) => {
		d = d || [];
		var f = null;
		for (var e = 0; e < d.length; e++) {
			if (b.forms.ImageField.isValidFile_(d[e])) {
				f = d[e];
				break
			}
		}
		if (!f) {
			alert('Please choose a valid image file (PNG, JPG, GIF, SVG, etc.)');
			j(null);
			return
		}
		var h = f.type == 'image/svg+xml',
			g = a && h,
			c = new FileReader();
		c.onload = i => j({
			isSvg: h,
			uri: g ? null : i.target.result,
			canvgSvgText: g ? i.target.result : null,
			name: f.name
		});
		c.onerror = i => {
			switch (i.target.error.code) {
				case i.target.error.NOT_FOUND_ERR:
					alert('File not found!');
				break;
				case i.target.error.NOT_READABLE_ERR:
					alert('File is not readable');
				break;
				case i.target.error.ABORT_ERR:
				break;
				default:
					alert('An error occurred reading this file.')
			}
			j(null)
		};
		c.onabort = i => {
			alert('File read cancelled');
			j(null)
		};
		if (g)
			c.readAsText(f)
		else
			c.readAsDataURL(f)
	};
	b.forms.ImageField.isValidFile_ = c => !!c.type.toLowerCase().match(/^image\//);
	b.ui = {};
	b.ui.createImageOutputGroup = c => {
		let el = $('<div class="out-image-group group-'+c.id+'" hidden><h2>'+c.label+'</h2></div>').firstElementChild;
		c.container.append(el);
		return el;
	};
	b.ui.createImageOutputSlot = c => {
		let el = $('<div class="out-image-block block-'+c.id+'" hidden><small>'+c.label+'</small><br /><img class="out-image" id='+c.id+' /></div>').firstElementChild;
		c.container.append(el);
		return el;
	};
	b.ui.drawImageGuideRects = (c, e, f) => {
		f = f || [];
		c.save();
		c.globalAlpha = 0.5;
		c.fillStyle = '#fff';
		c.fillRect(0, 0, e.w, e.h);
		c.globalAlpha = 1;
		var g = b.ui.drawImageGuideRects.guideColors_;
		for (var d = 0; d < f.length; d++) {
			c.strokeStyle = g[(d - 1) % g.length];
			c.strokeRect(f[d].x + 0.5, f[d].y + 0.5, f[d].w - 1, f[d].h - 1)
		}
		c.restore()
	};
	b.ui.drawImageGuideRects.guideColors_ = ['#f00'];
	b.util = {};
	b.util.getMultBaseMdpi = c => {
		switch (c) {
			case 'xxxhdpi':
				return 4;
			case 'xxhdpi':
				return 3;
			case 'xhdpi':
				return 2;
			case 'hdpi':
				return 1.5;
			case 'tvdpi':
				return 1.33125;
			case 'mdpi':
				return 1;
			case 'ldpi':
				return 0.75
		}
		return 1
	};
	b.util.multRound = (c, e) => {
		var f = {};
		for (k in c) {
			f[k] = Math.round(c[k] * e)
		}
		return f
	};
	window.studio = b
})();
