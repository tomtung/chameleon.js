/// <reference path="./common.ts" />

module Chameleon {
    export var _brushSize;
    export var _brushType;
    export var _brushColor;
    export var _brushTexture;

    export function changeBrushSize(_size: number) {
        _brushSize = _size;
    }

    export function changeBrushType(_type) {
        _brushType = _type;
    }

    export function changeBrushColor(_color) {
        _brushColor = _color;
    }

    export function changeTextureType(_texture) {
        _brushTexture = _texture;
    }

    export interface Brush {
        radius: number;
        startStroke(canvas: HTMLCanvasElement, position: THREE.Vector2);
        continueStoke(position: THREE.Vector2);
        finishStroke();
    }

    export class Pencil implements Brush {
        get radius(): number {
            return 1;
        }

        private _canvasContext: CanvasRenderingContext2D = null;

        startStroke(canvas: HTMLCanvasElement, position: THREE.Vector2) {
            this._canvasContext = canvas.getContext('2d');
            this._canvasContext.save(); // Assumption: nobody else will call this until the stroke is finished

            this._canvasContext.moveTo(position.x, position.y);
        }

        continueStoke(position: THREE.Vector2) {
            if (this._canvasContext) {
                this._canvasContext.lineTo(position.x, position.y);
                this._canvasContext.stroke();
            }
        }

        finishStroke() {
            if (this._canvasContext) {
                this._canvasContext.restore();
                this._canvasContext = null;
            }
        }
    }

    export class Pencil1 implements Brush {
        get radius(): number {
            return this._pencilSize;
        }

        private _canvasContext: CanvasRenderingContext2D = null;
        private _pencilSize;
        private _pencilColor;


        startStroke(canvas: HTMLCanvasElement, position: THREE.Vector2) {
            this._canvasContext = canvas.getContext('2d');
            this._canvasContext.beginPath();
            this._canvasContext.save(); // Assumption: nobody        else will call this until the stroke is finished
            this._canvasContext.lineWidth = this._pencilSize;
            this._canvasContext.strokeStyle = this._pencilColor;
            this._canvasContext.lineJoin = this._canvasContext.lineCap = 'round';
            this._canvasContext.moveTo(position.x, position.y);
        }

        continueStoke(position: THREE.Vector2) {
            if (this._canvasContext) {
                this._canvasContext.lineTo(position.x, position.y);
                this._canvasContext.stroke();
            }
        }

        finishStroke() {
            if (this._canvasContext) {
                this._canvasContext.restore();
                this._canvasContext = null;
            }
        }

        constructor() {
            this._pencilSize = _brushSize;
            this._pencilColor = _brushColor
        }
    }

    export class Pencil2 implements Brush {
        get radius(): number {
            return this._pencilSize;
        }

        private _canvasContext: CanvasRenderingContext2D = null;
        private _pencilSize;
        private _pencilColor;

        startStroke(canvas: HTMLCanvasElement, position: THREE.Vector2) {
            this._canvasContext = canvas.getContext('2d');
            this._canvasContext.beginPath();
            this._canvasContext.save(); // Assumption: nobody        else will call this until the stroke is finished


            this._canvasContext.lineWidth = this._pencilSize;
            this._canvasContext.strokeStyle = this._pencilColor;
            this._canvasContext.lineJoin = this._canvasContext.lineCap = 'round';
            this._canvasContext.shadowBlur = this._pencilSize;
            this._canvasContext.shadowColor = this._pencilColor;
            this._canvasContext.moveTo(position.x, position.y);
        }

        continueStoke(position: THREE.Vector2) {
            if (this._canvasContext) {
                this._canvasContext.lineTo(position.x, position.y);
                this._canvasContext.stroke();
            }
        }

        finishStroke() {
            if (this._canvasContext) {
                this._canvasContext.restore();
                this._canvasContext = null;
            }
        }

        constructor() {
            this._pencilSize = _brushSize;
            this._pencilColor = _brushColor
        }
    }
    export class Pencil3 implements Brush {
        get radius(): number {
            return 32;
        }

        private img = new Image();


        private _canvasContext: CanvasRenderingContext2D = null;
        private _pencilSize;

        distanceBetween(point1, point2) {
            return Math.sqrt(Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2));
        }

        angleBetween(point1, point2) {
            return Math.atan2(point2.x - point1.x, point2.y - point1.y);
        }

        private lastPoint;

        startStroke(canvas: HTMLCanvasElement, position: THREE.Vector2) {
            this._canvasContext = canvas.getContext('2d');
            this._canvasContext.beginPath();
            this._canvasContext.save(); // Assumption: nobody        else will call this until the stroke is finished
            this.img.src = 'image/brush3.png';
            this._canvasContext.lineJoin = this._canvasContext.lineCap = 'round';
            this.lastPoint = {x: position.x, y: position.y};
            //this._canvasContext.moveTo(position.x, position.y);
        }

        continueStoke(position: THREE.Vector2) {
            if (this._canvasContext) {
                //this._canvasContext.lineTo(position.x, position.y);

                var currentPoint = {x: position.x, y: position.y};
                var dist = this.distanceBetween(this.lastPoint, currentPoint);
                var angle = this.angleBetween(this.lastPoint, currentPoint);

                for (var i = 0; i < dist; i++) {
                    var x = this.lastPoint.x + (Math.sin(angle) * i) - 25;
                    var y = this.lastPoint.y + (Math.cos(angle) * i) - 25;
                    this._canvasContext.drawImage(this.img, x, y);
                }

                this.lastPoint = currentPoint;

                //this._canvasContext.stroke();
            }
        }

        finishStroke() {
            if (this._canvasContext) {
                this._canvasContext.restore();
                this._canvasContext = null;
            }
        }

        constructor() {
            this._pencilSize = _brushSize;
        }
    }
    export class Pencil4 implements Brush {
        get radius(): number {
            return 10;
        }

        private img = new Image();


        private _canvasContext: CanvasRenderingContext2D = null;
        private _pencilSize;


        distanceBetween(point1, point2) {
            return Math.sqrt(Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2));
        }

        angleBetween(point1, point2) {
            return Math.atan2(point2.x - point1.x, point2.y - point1.y);
        }

        getRandomInt(min, max) {
            return Math.floor(Math.random() * (max - min)) + min;
        }

        private lastPoint;

        startStroke(canvas: HTMLCanvasElement, position: THREE.Vector2) {
            this._canvasContext = canvas.getContext('2d');
            this._canvasContext.beginPath();
            this._canvasContext.save(); // Assumption: nobody        else will call this until the stroke is finished
            this.img.src = 'image/brush3.png';
            this.img.width = 10;
            this._canvasContext.lineJoin = this._canvasContext.lineCap = 'round';
            this.lastPoint = {x: position.x, y: position.y};

        }

        continueStoke(position: THREE.Vector2) {
            if (this._canvasContext) {
                //this._canvasContext.lineTo(position.x, position.y);

                var currentPoint = {x: position.x, y: position.y};
                var dist = this.distanceBetween(this.lastPoint, currentPoint);
                var angle = this.angleBetween(this.lastPoint, currentPoint);

                for (var i = 0; i < dist; i++) {
                    var x = this.lastPoint.x + (Math.sin(angle) * i);
                    var y = this.lastPoint.y + (Math.cos(angle) * i);
                    this._canvasContext.save();
                    this._canvasContext.translate(x, y);
                    this._canvasContext.scale(0.5, 0.5);
                    this._canvasContext.rotate(Math.PI * 180 / this.getRandomInt(0, 180));
                    this._canvasContext.drawImage(this.img, 0, 0);
                    this._canvasContext.restore();
                }

                this.lastPoint = currentPoint;

                //this._canvasContext.stroke();
            }
        }

        finishStroke() {
            if (this._canvasContext) {
                this._canvasContext.restore();
                this._canvasContext = null;
            }
        }

        constructor() {
            this._pencilSize = _brushSize;
        }
    }
    export class Pencil5 implements Brush {
        get radius(): number {
            return 3;
        }

        private _canvasContext: CanvasRenderingContext2D = null;
        private _pencilSize = 3;
        private _pencilColor;
        private _lastPoint;


        startStroke(canvas: HTMLCanvasElement, position: THREE.Vector2) {
            this._canvasContext = canvas.getContext('2d');

            this._canvasContext.save(); // Assumption: nobody        else will call this until the stroke is finished
            this._canvasContext.lineWidth = this._pencilSize;
            this._canvasContext.strokeStyle = this._pencilColor;
            this._canvasContext.lineJoin = this._canvasContext.lineCap = 'round';
            this._lastPoint = {x: position.x, y: position.y};
        }

        continueStoke(position: THREE.Vector2) {
            if (this._canvasContext) {
                this._canvasContext.beginPath();
                this._canvasContext.globalAlpha = 1;
                this._canvasContext.moveTo(this._lastPoint.x, this._lastPoint.y);
                this._canvasContext.lineTo(position.x, position.y);
                this._canvasContext.stroke();

                this._canvasContext.moveTo(this._lastPoint.x - 4, this._lastPoint.y - 4);
                this._canvasContext.lineTo(position.x - 4, position.y - 4);
                this._canvasContext.stroke();

                this._canvasContext.moveTo(this._lastPoint.x - 2, this._lastPoint.y - 2);
                this._canvasContext.lineTo(position.x - 2, position.y - 2);
                this._canvasContext.stroke();

                this._canvasContext.moveTo(this._lastPoint.x + 2, this._lastPoint.y + 2);
                this._canvasContext.lineTo(position.x + 2, position.y + 2);
                this._canvasContext.stroke();

                this._canvasContext.moveTo(this._lastPoint.x + 4, this._lastPoint.y + 4);
                this._canvasContext.lineTo(position.x + 4, position.y + 4);
                this._canvasContext.stroke();

                this._lastPoint = {x: position.x, y: position.y};
            }
        }

        finishStroke() {
            if (this._canvasContext) {
                this._canvasContext.restore();
                this._canvasContext = null;
            }
        }

        constructor() {

            this._pencilColor = _brushColor;
        }
    }
    export class Pencil6 implements Brush {
        get radius(): number {
            return 15;
        }

        private _canvasContext: CanvasRenderingContext2D = null;
        private _pencilSize;
        private _pencilColor;
        private _points = [];
        private _radius;


        getRandomInt(min, max) {
            return Math.floor(Math.random() * (max - min)) + min;
        }

        startStroke(canvas: HTMLCanvasElement, position: THREE.Vector2) {
            this._canvasContext = canvas.getContext('2d');
            this._canvasContext.save(); // Assumption: nobody        else will call this until the stroke is finished

            this._canvasContext.fillStyle = this._pencilColor;
            this._canvasContext.lineJoin = this._canvasContext.lineCap = 'round';
            this._points.push({
                x: position.x,
                y: position.y,
                radius: this.getRandomInt(10, 30),
                opacity: Math.random()
            });
        }

        continueStoke(position: THREE.Vector2) {
            if (this._canvasContext) {

                this._points.push({
                    x: position.x,
                    y: position.y,
                    radius: this.getRandomInt(5, 20),
                    opacity: Math.random()
                });

                this._canvasContext.clearRect(0, 0, 1, 1);
                for (var i = 0; i < this._points.length; i++) {
                    this._canvasContext.beginPath();
                    this._canvasContext.globalAlpha = this._points[i].opacity;
                    this._canvasContext.arc(
                        this._points[i].x, this._points[i].y, this._points[i].radius, 30, 270,
                        false);

                    this._canvasContext.fill();
                }
            }
        }

        finishStroke() {
            if (this._canvasContext) {
                this._canvasContext.restore();
                this._canvasContext = null;
                this._points.length = 0;
            }
        }

        constructor() {
            this._pencilSize = _brushSize;
            this._pencilColor = _brushColor;
        }
    }
    export class Pencil7 implements Brush {
        get radius(): number {
            return this._pencilSize;
        }

        private _canvasContext: CanvasRenderingContext2D = null;
        private _pencilSize;
        private _pencilColor;
        private _points = [];

        drawStar(x, y, angle) {
            var length = this._pencilSize;
            this._canvasContext.save();
            this._canvasContext.translate(x, y);
            this._canvasContext.beginPath();
            this._canvasContext.rotate(Math.PI / 180 * angle);
            for (var i = 5; i--;) {
                this._canvasContext.lineTo(0, length);
                this._canvasContext.translate(0, length);
                this._canvasContext.rotate((Math.PI * 2 / 10));
                this._canvasContext.lineTo(0, -length);
                this._canvasContext.translate(0, -length);
                this._canvasContext.rotate(-(Math.PI * 6 / 10));
            }
            this._canvasContext.lineTo(0, length);
            this._canvasContext.closePath();
            this._canvasContext.stroke();
            this._canvasContext.restore();
        }

        getRandomInt(min, max) {
            return Math.floor(Math.random() * (max - min)) + min;
        }

        startStroke(canvas: HTMLCanvasElement, position: THREE.Vector2) {

            this._canvasContext = canvas.getContext('2d');
            this._canvasContext.save();
            this._canvasContext.strokeStyle = this._pencilColor;
            this._canvasContext.lineJoin = this._canvasContext.lineCap = 'round';

        }

        continueStoke(position: THREE.Vector2) {
            if (this._canvasContext) {
                this._points.push({x: position.x, y: position.y, angle: this.getRandomInt(0, 180)});

                this._canvasContext.clearRect(0, 0, 1, 1);
                for (var i = 0; i < this._points.length; i++) {
                    this.drawStar(this._points[i].x, this._points[i].y, this._points[i].angle);
                }
            }
        }

        finishStroke() {
            if (this._canvasContext) {
                this._canvasContext.restore();
                this._points.length = 0;
                this._canvasContext = null;
            }
        }

        constructor() {
            this._pencilSize = _brushSize;
            this._pencilColor = _brushColor;
        }
    }
    export class Pencil8 implements Brush {
        get radius(): number {
            return this._pencilSize;
        }

        private _canvasContext: CanvasRenderingContext2D = null;
        private _pencilSize;
        private _pencilColor;
        private _points = [];

        drawStar(options) {
            var length = this._pencilSize;
            this._canvasContext.save();
            this._canvasContext.translate(options.x, options.y);
            this._canvasContext.beginPath();
            this._canvasContext.globalAlpha = options.opacity;
            this._canvasContext.rotate(Math.PI / 180 * options.angle);
            this._canvasContext.scale(options.scale, options.scale);
            this._canvasContext.strokeStyle = options.color;
            this._canvasContext.lineWidth = options.width;
            for (var i = 5; i--;) {
                this._canvasContext.lineTo(0, length);
                this._canvasContext.translate(0, length);
                this._canvasContext.rotate((Math.PI * 2 / 10));
                this._canvasContext.lineTo(0, -length);
                this._canvasContext.translate(0, -length);
                this._canvasContext.rotate(-(Math.PI * 6 / 10));
            }
            this._canvasContext.lineTo(0, length);
            this._canvasContext.closePath();
            this._canvasContext.stroke();
            this._canvasContext.restore();
        }

        getRandomInt(min, max) {
            return Math.floor(Math.random() * (max - min)) + min;
        }

        addRandomPoint(position) {
            this._points.push({
                x: position.x,
                y: position.y,
                angle: this.getRandomInt(0, 180),
                width: this.getRandomInt(1, 10),
                opacity: Math.random(),
                scale: this.getRandomInt(1, 20) / 10,
                color: ('rgb(' + this.getRandomInt(0, 255) + ',' + this.getRandomInt(0, 255) + ',' + this.getRandomInt(0, 255) + ')')
            });
        }

        startStroke(canvas: HTMLCanvasElement, position: THREE.Vector2) {

            this._canvasContext = canvas.getContext('2d');
            this._canvasContext.save();

        }

        continueStoke(position: THREE.Vector2) {
            if (this._canvasContext) {
                this.addRandomPoint(position);

                this._canvasContext.clearRect(0, 0, 1, 1);
                for (var i = 0; i < this._points.length; i++) {
                    this.drawStar(this._points[i]);
                }
            }
        }

        finishStroke() {
            if (this._canvasContext) {
                this._canvasContext.restore();
                this._points.length = 0;
                this._canvasContext = null;
            }
        }

        constructor() {
            this._pencilSize = _brushSize;
            this._pencilColor = _brushColor;
        }
    }
    export class Pencil9 implements Brush {
        get radius(): number {
            return _brushSize;
        }

        private img = new Image();
        private _canvasContext: CanvasRenderingContext2D = null;
        private _pencilSize;
        private _pencilTexture;
        private lastPoint;

        midPointBtw(p1, p2) {
            return {
                x: p1.x + (p2.x - p1.x) / 2,
                y: p1.y + (p2.y - p1.y) / 2
            };
        }

        getPattern() {
            var patternCanvas = document.createElement('canvas'),
                dotWidth = 400,
                dotDistance = 200,
                patternCtx = patternCanvas.getContext('2d');

            patternCanvas.width = patternCanvas.height = dotWidth + dotDistance;

            if (this._pencilTexture == "grass") {
                this.img.src = 'image/grass_texture.jpg'
            }
            if (this._pencilTexture == "metal") {
                this.img.src = 'image/metal_texture.jpg'
            }
            if (this._pencilTexture == "rock") {
                this.img.src = 'image/rock_texture.jpg'
            }
            if (this._pencilTexture == "blackleather") {
                this.img.src = 'image/blackleather_texture.jpg'
            }


            patternCtx.beginPath();
            patternCtx.arc(dotWidth, dotWidth, dotWidth, 0, Math.PI * 2, false);
            patternCtx.closePath();
            patternCtx.drawImage(this.img, 0, 0);
            return this._canvasContext.createPattern(patternCanvas, 'repeat');
        }

        private _points = [];

        startStroke(canvas: HTMLCanvasElement, position: THREE.Vector2) {
            this._canvasContext = canvas.getContext('2d');

            this._canvasContext.save(); // Assumption: nobody        else will call this until the stroke is finished
            this._canvasContext.lineWidth = this._pencilSize;
            this._canvasContext.lineJoin = this._canvasContext.lineCap = 'round';
            this._canvasContext.strokeStyle = this.getPattern();
            this.lastPoint = {x: position.x, y: position.y};
            //this._canvasContext.moveTo(position.x, position.y);
        }

        continueStoke(position: THREE.Vector2) {
            if (this._canvasContext) {
                this._points.push({x: position.x, y: position.y});

                this._canvasContext.clearRect(0, 0, 1, 1);

                var p1 = this._points[0];
                var p2 = this._points[1];

                this._canvasContext.beginPath();
                this._canvasContext.moveTo(p1.x, p1.y);

                for (var i = 1, len = this._points.length; i < len; i++) {
                    var midPoint = this.midPointBtw(p1, p2);
                    this._canvasContext.quadraticCurveTo(p1.x, p1.y, midPoint.x, midPoint.y);
                    p1 = this._points[i];
                    p2 = this._points[i + 1];
                }
                this._canvasContext.lineTo(p1.x, p1.y);
                this._canvasContext.stroke();
            }
        }

        finishStroke() {
            if (this._canvasContext) {
                this._canvasContext.restore();
                this._canvasContext = null;
                this._points.length = 0;
            }
        }

        constructor() {
            this._pencilSize = _brushSize;
            this._pencilTexture = _brushTexture;
        }
    }

}

