'use strict';

var t = require('fire-path');
	i = Editor.require('app://editor/page/gizmos/elements/tools');
	s = require('svg.js');

Editor.polymerPanel('sprite-editor', {
	is: 'sprite-editor',

	properties: {
		hasContent: {
			type: Boolean,
			value: false
		},
		dirty: {
			type: Boolean,
			value: false
		},
		scale: {
			value: 100,
			observer: '_scaleChanged'
		},
		minScale: 20,
		maxScale: 500,
		leftPos: {
			type: Number,
			value: 0,
			observer: 'leftPosChanged'
		},
		rightPos: {
			type: Number,
			value: 0,
			observer: 'rightPosChanged'
		},
		topPos: {
			type: Number,
			value: 0,
			observer: 'topPosChanged'
		},
		bottomPos: {
			type: Number,
			value: 0,
			observer: 'bottomPosChanged'
		}
	},

	run: function (t) {
		this.openSprite(t.uuid);
	},

	ready: function () {
		this._svg = s(this.$.svg);
		this._svg.spof();

		this._lastBcr = null;
		this._svgColor = '#5c5';
		this._dotSize = 6;

		this._borderLeft = 0;
		this._borderRight = 0;
		this._borderBottom = 0;
		this._borderTop = 0;

		this._startLeftPos = 0;
		this._startRightPos = 0;
		this._startTopPos = 0;
		this._startBottomPos = 0;

		this._meta = null;
		this._scalingSize = null;
		this.addListeners();
	},

	_T: function (t) {
		return Editor.T(t);
	},

	addListeners: function () {
		window.addEventListener('resize', function (t) {
			(this._image || this._meta) && (this._refreshScaleSlider(), this.resize(this._meta.width * this.scale / 100, this._meta.height * this.scale / 100));
		}.bind(this));
	},

	_refreshScaleSlider: function () {
		var t = this.$.content.getBoundingClientRect();
		if (!this._lastBcr || t.width !== this._lastBcr.width || t.height !== this._lastBcr.height) {
			var i;
			i = this._meta.width > this._meta.height ? t.width / this._meta.width * 100 : t.height / this._meta.height * 100, this.minScale = Math.ceil(i / 5), this.maxScale = Math.ceil(i), this.scale = Math.ceil((i + this.minScale) / 2), this._lastBcr = this.$.content.getBoundingClientRect();
		}
	},

	openSprite: function (t) {
		t && this._loadMeta(t, function (i, s, e) {
			return i ? void Editor.error('Failed to load meta %s, Message: %s', t, i.stack) : (this.hasContent = true, this._refreshScaleSlider(), void Editor.assetdb.queryMetaInfoByUuid(e.rawTextureUuid, function (t, i) {
				this._image = new Image(), this._image.src = i.assetPath, this._image.onload = function () {
					this.resize(this._meta.width * this.scale / 100, this._meta.height * this.scale / 100);
				}.bind(this);
			}.bind(this)));
		}.bind(this));
	},

	_loadMeta: function (i, s) {
		return 0 === i.indexOf('mount-') ? void (s && s(new Error('Not support mount type assets.'))) : void Editor.assetdb.queryMetaInfoByUuid(i, function (e, o) {
			if (!o)
				return void (s && s(new Error('Can not find asset path by uuid ' + i)));
			var h = o.assetType;
			if ('sprite-frame' !== h)
				return void (s && s(new Error('Only support sprite-frame type assets now.')));
			var r = JSON.parse(o.json);
			r.__name__ = t.basenameNoExt(o.assetPath), r.__path__ = o.assetPath, r.__mtime__ = o.assetMtime, this._meta = r, this.leftPos = r.borderLeft, this.rightPos = r.borderRight, this.topPos = r.borderTop, this.bottomPos = r.borderBottom, s && s(null, h, r);
		}.bind(this));
	},

	_scaleChanged: function () {
		this._image && this._meta && this.resize(this._meta.width * this.scale / 100, this._meta.height * this.scale / 100);
	},

	_onInputChanged: function (t) {
		if (this._image && this._meta) {
			var i = t.srcElement, s = i.value, e = 0;
			switch (i.id) {
			case 'inputL':
				e = this._image.width - this.rightPos, this.leftPos = this.correctPosValue(s, 0, e);
				break;
			case 'inputR':
				e = this._image.width - this.leftPos, this.rightPos = this.correctPosValue(s, 0, e);
				break;
			case 'inputT':
				e = this._image.height - this.bottomPos, this.topPos = this.correctPosValue(s, 0, e);
				break;
			case 'inputB':
				e = this._image.height - this.topPos, this.bottomPos = this.correctPosValue(s, 0, e);
			}
			s > e && (i.value = e);
		}
	},

	resize: function (t, i) {
		var s = this.$.content.getBoundingClientRect(), e = Editor.Utils.fitSize(t, i, s.width, s.height);
		this._meta.rotated && (this._scalingSize = {
			width: Math.ceil(e[1]),
			height: Math.ceil(e[0])
		}), this.$.canvas.width = Math.ceil(e[0]), this.$.canvas.height = Math.ceil(e[1]), this.repaint();
	},

	getCanvasRect: function () {
		var t = {};
		return t.top = this.$.canvas.offsetTop, t.left = this.$.canvas.offsetLeft, t.bottom = this.$.canvas.offsetTop + this.$.canvas.height, t.right = this.$.canvas.offsetLeft + this.$.canvas.width, t.width = this.$.canvas.width, t.height = this.$.canvas.height, t;
	},

	updateBorderPos: function (t) {
		this._borderLeft = t.left + this.leftPos * (this.scale / 100), this._borderRight = t.right - this.rightPos * (this.scale / 100), this._borderTop = t.top + this.topPos * (this.scale / 100), this._borderBottom = t.bottom - this.bottomPos * (this.scale / 100);
	},

	repaint: function () {
		var t = this.$.canvas.getContext('2d');
		t.imageSmoothingEnabled = false;
		var i, s, e, o, h = this._meta, r = this.$.canvas.width, a = this.$.canvas.height;
		if (h.rotated) {
			var d = r / 2, n = a / 2;
			t.translate(d, n), t.rotate(-90 * Math.PI / 180), t.translate(-d, -n), i = r / 2 - this._scalingSize.width / 2, s = a / 2 - this._scalingSize.height / 2, e = h.height, o = h.width, r = this.$.canvas.height, a = this.$.canvas.width;
		} else
			i = 0, s = 0, e = h.width, o = h.height, r = this.$.canvas.width, a = this.$.canvas.height;
		t.drawImage(this._image, h.trimX, h.trimY, e, o, i, s, r, a), this.drawEditElements();
	},

	svgElementMoved: function (t, i, s) {
		var e = i / (this.scale / 100), o = s / (this.scale / 100);
		if (e = e > 0 ? Math.floor(e) : Math.ceil(e), o = o > 0 ? Math.floor(o) : Math.ceil(o), Math.abs(e) > 0) {
			if (t.indexOf('l') >= 0) {
				var h = this._startLeftPos + e;
				this.leftPos = this.correctPosValue(h, 0, this._image.width - this.rightPos);
			}
			if (t.indexOf('r') >= 0) {
				var r = this._startRightPos - e;
				this.rightPos = this.correctPosValue(r, 0, this._image.width - this.leftPos);
			}
		}
		if (Math.abs(o) > 0) {
			if (t.indexOf('t') >= 0) {
				var a = this._startTopPos + o;
				this.topPos = this.correctPosValue(a, 0, this._image.height - this.bottomPos);
			}
			if (t.indexOf('b') >= 0) {
				var d = this._startBottomPos - o;
				this.bottomPos = this.correctPosValue(d, 0, this._image.height - this.topPos);
			}
		}
	},

	svgCallbacks: function (t) {
		var i = {};
		return i.start = function () {
			this._startLeftPos = this.leftPos, this._startRightPos = this.rightPos, this._startTopPos = this.topPos, this._startBottomPos = this.bottomPos;
		}.bind(this), i.update = function (i, s) {
			this.svgElementMoved(t, i, s);
		}.bind(this), i;
	},

	drawLine: function (t, s, e, o, h) {
		var r = {
				x: t,
				y: s
			}, a = {
				x: e,
				y: o
			}, d = i.lineTool(this._svg, r, a, this._svgColor, 'default', this.svgCallbacks(h));
		return 'l' === h || 'r' === h ? d.style('cursor', 'col-resize') : 't' !== h && 'b' !== h || d.style('cursor', 'row-resize'), d;
	},

	drawDot: function (t, s, e) {
		var o = { color: this._svgColor }, h = i.circleTool(this._svg, this._dotSize, o, o, this.svgCallbacks(e));
		return 'l' === e || 'r' === e || 't' === e || 'b' === e ? h.style('cursor', 'pointer') : 'lb' === e || 'rt' === e ? h.style('cursor', 'nesw-resize') : 'rb' !== e && 'lt' !== e || h.style('cursor', 'nwse-resize'), this.moveDotTo(h, t, s), h;
	},

	moveDotTo: function (t, i, s) {
		t && t.move(i, s);
	},

	drawEditElements: function () {
		if (this._image) {
			this._svg.clear();
			var t = this.getCanvasRect();
			this.updateBorderPos(t), this.lineLeft = this.drawLine(this._borderLeft, t.bottom, this._borderLeft, t.top, 'l'), this.lineRight = this.drawLine(this._borderRight, t.bottom, this._borderRight, t.top, 'r'), this.lineTop = this.drawLine(t.left, this._borderTop, t.right, this._borderTop, 't'), this.lineBottom = this.drawLine(t.left, this._borderBottom, t.right, this._borderBottom, 'b'), this.dotLB = this.drawDot(this._borderLeft, this._borderBottom, 'lb'), this.dotLT = this.drawDot(this._borderLeft, this._borderTop, 'lt'), this.dotRB = this.drawDot(this._borderRight, this._borderBottom, 'rb'), this.dotRT = this.drawDot(this._borderRight, this._borderTop, 'rt'), this.dotL = this.drawDot(this._borderLeft, t.bottom - t.height / 2, 'l'), this.dotR = this.drawDot(this._borderRight, t.bottom - t.height / 2, 'r'), this.dotB = this.drawDot(t.left + t.width / 2, this._borderBottom, 'b'), this.dotT = this.drawDot(t.left + t.width / 2, this._borderTop, 't');
		}
	},

	correctPosValue: function (t, i, s) {
		return i > t ? i : t > s ? s : t;
	},

	checkState: function () {
		var t = this.leftPos !== this._meta.borderLeft, i = this.rightPos !== this._meta.borderRight, s = this.topPos !== this._meta.borderTop, e = this.bottomPos !== this._meta.borderBottom;
		this.dirty = t || i || s || e;
	},

	leftPosChanged: function () {
		if (this._image) {
			var t = this.getCanvasRect();
			this.updateBorderPos(t), this.moveDotTo(this.dotL, this._borderLeft, t.bottom - t.height / 2), this.moveDotTo(this.dotLB, this._borderLeft, this._borderBottom), this.moveDotTo(this.dotLT, this._borderLeft, this._borderTop), this.lineLeft && this.lineLeft.plot(this._borderLeft, t.bottom, this._borderLeft, t.top), this.checkState();
		}
	},

	rightPosChanged: function () {
		if (this._image) {
			var t = this.getCanvasRect();
			this.updateBorderPos(t), this.moveDotTo(this.dotR, this._borderRight, t.bottom - t.height / 2), this.moveDotTo(this.dotRB, this._borderRight, this._borderBottom), this.moveDotTo(this.dotRT, this._borderRight, this._borderTop), this.lineRight && this.lineRight.plot(this._borderRight, t.bottom, this._borderRight, t.top), this.checkState();
		}
	},

	topPosChanged: function () {
		if (this._image) {
			var t = this.getCanvasRect();
			this.updateBorderPos(t), this.moveDotTo(this.dotT, t.left + t.width / 2, this._borderTop), this.moveDotTo(this.dotLT, this._borderLeft, this._borderTop), this.moveDotTo(this.dotRT, this._borderRight, this._borderTop), this.lineTop && this.lineTop.plot(t.left, this._borderTop, t.right, this._borderTop), this.checkState();
		}
	},

	bottomPosChanged: function () {
		if (this._image) {
			var t = this.getCanvasRect();
			this.updateBorderPos(t), this.moveDotTo(this.dotB, t.left + t.width / 2, this._borderBottom), this.moveDotTo(this.dotLB, this._borderLeft, this._borderBottom), this.moveDotTo(this.dotRB, this._borderRight, this._borderBottom), this.lineBottom && this.lineBottom.plot(t.left, this._borderBottom, t.right, this._borderBottom), this.checkState();
		}
	},

	onMouseWheel: function (t) {
		if (this._image) {
			t.stopPropagation();
			var i = Editor.Utils.smoothScale(this.scale / 100, t.wheelDelta);
			this.scale = 100 * i;
		}
	},

	_onRevert: function (t) {
		if (this._image && this._meta) {
			t && t.stopPropagation();
			var i = this._meta;
			this.leftPos = i.borderLeft, this.rightPos = i.borderRight, this.topPos = i.borderTop, this.bottomPos = i.borderBottom, this.checkState();
		}
	},

	_onApply: function (t) {
		if (this._image && this._meta) {
			t && t.stopPropagation();
			var i = this._meta;
			i.borderTop = this.topPos, i.borderBottom = this.bottomPos, i.borderLeft = this.leftPos, i.borderRight = this.rightPos;
			var s = JSON.stringify(i), e = i.uuid;
			Editor.assetdb.saveMeta(e, s), this.checkState();
		}
	}
});
