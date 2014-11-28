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
            this._canvasContext.beginPath();
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

    export class Marker implements Brush {
        private _canvasContext: CanvasRenderingContext2D = null;

        startStroke(canvas: HTMLCanvasElement, position: THREE.Vector2) {
            this._canvasContext = canvas.getContext('2d');
            this._canvasContext.beginPath();
            this._canvasContext.save(); // Assumption: nobody else will call this until the stroke is finished

            this._canvasContext.lineWidth = this.radius;
            this._canvasContext.strokeStyle = this.color;
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

        constructor(public radius: number = _brushSize,
                    public color: string = _brushColor) {
        }
    }

    export class BlurryMarker implements Brush {
        private _canvasContext: CanvasRenderingContext2D = null;

        startStroke(canvas: HTMLCanvasElement, position: THREE.Vector2) {
            this._canvasContext = canvas.getContext('2d');
            this._canvasContext.beginPath();
            this._canvasContext.save(); // Assumption: nobody else will call this until the stroke is finished

            this._canvasContext.lineWidth = this.radius;
            this._canvasContext.strokeStyle = this.color;
            this._canvasContext.lineJoin = this._canvasContext.lineCap = 'round';
            this._canvasContext.shadowBlur = this.radius;
            this._canvasContext.shadowColor = this.color;
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

        constructor(public radius: number = _brushSize,
                    public color: string = _brushColor) {
        }
    }

    export class CalligraphyBrush implements Brush {
        get radius(): number {
            return 40;
        }

        private img = new Image();

        private _canvasContext: CanvasRenderingContext2D = null;
        private _pencilSize;

        private _lastPosition = new THREE.Vector2();

        startStroke(canvas: HTMLCanvasElement, position: THREE.Vector2) {
            this._canvasContext = canvas.getContext('2d');
            this._canvasContext.beginPath();
            this._canvasContext.save(); // Assumption: nobody else will call this until the stroke is finished
            this.img.src = 'image/brush3.png';
            this._canvasContext.lineJoin = this._canvasContext.lineCap = 'round';
            this._lastPosition.copy(position);
        }

        continueStoke(position: THREE.Vector2) {
            if (this._canvasContext) {
                var dist = this._lastPosition.distanceTo(position);
                var angle = angleBetween(this._lastPosition, position);

                for (var i = 0; i < dist; i++) {
                    var x = this._lastPosition.x + (Math.sin(angle) * i) - 25;
                    var y = this._lastPosition.y + (Math.cos(angle) * i) - 25;
                    this._canvasContext.drawImage(this.img, x, y);
                }

                this._lastPosition.copy(position);
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

    export class Fur implements Brush {
        get radius(): number {
            return 40;
        }

        private img = new Image();
        private _canvasContext: CanvasRenderingContext2D = null;
        private _lastPosition: THREE.Vector2 = new THREE.Vector2();

        startStroke(canvas: HTMLCanvasElement, position: THREE.Vector2) {
            this._canvasContext = canvas.getContext('2d');
            this._canvasContext.beginPath();
            this._canvasContext.save(); // Assumption: nobody else will call this until the stroke is finished

            this.img.src = 'image/brush3.png';
            this.img.width = 10;
            this._canvasContext.lineJoin = this._canvasContext.lineCap = 'round';
            this._lastPosition.copy(position);
        }

        continueStoke(position: THREE.Vector2) {
            if (this._canvasContext) {
                var dist = this._lastPosition.distanceTo(position);
                var angle = angleBetween(this._lastPosition, position);

                for (var i = 0; i < dist; i++) {
                    var x = this._lastPosition.x + (Math.sin(angle) * i);
                    var y = this._lastPosition.y + (Math.cos(angle) * i);
                    this._canvasContext.save();
                    this._canvasContext.translate(x, y);
                    this._canvasContext.scale(0.5, 0.5);
                    this._canvasContext.rotate(Math.PI * 180 / getRandomInt(0, 180));
                    this._canvasContext.drawImage(this.img, 0, 0);
                    this._canvasContext.restore();
                }

                this._lastPosition.copy(position);
            }
        }

        finishStroke() {
            if (this._canvasContext) {
                this._canvasContext.restore();
                this._canvasContext = null;
            }
        }

        constructor() {
        }
    }

    // TODO make size adjustable
    export class ThickBrush implements Brush {
        get radius(): number {
            return 15;
        }

        private _canvasContext: CanvasRenderingContext2D = null;
        private _pencilSize = 3;
        private _lastPosition = new THREE.Vector2();

        startStroke(canvas: HTMLCanvasElement, position: THREE.Vector2) {
            this._canvasContext = canvas.getContext('2d');
            this._canvasContext.beginPath();
            this._canvasContext.save(); // Assumption: nobody else will call this until the stroke is finished

            this._canvasContext.lineWidth = this._pencilSize;
            this._canvasContext.strokeStyle = this.color;
            this._canvasContext.lineJoin = this._canvasContext.lineCap = 'round';
            this._lastPosition.copy(position);
        }

        continueStoke(position: THREE.Vector2) {
            if (this._canvasContext) {
                this._canvasContext.beginPath();
                this._canvasContext.globalAlpha = 0.85;
                this._canvasContext.moveTo(this._lastPosition.x, this._lastPosition.y);
                this._canvasContext.lineTo(position.x, position.y);
                this._canvasContext.stroke();

                this._canvasContext.moveTo(this._lastPosition.x - 4, this._lastPosition.y - 4);
                this._canvasContext.lineTo(position.x - 4, position.y - 4);
                this._canvasContext.stroke();

                this._canvasContext.moveTo(this._lastPosition.x - 2, this._lastPosition.y - 2);
                this._canvasContext.lineTo(position.x - 2, position.y - 2);
                this._canvasContext.stroke();

                this._canvasContext.moveTo(this._lastPosition.x + 2, this._lastPosition.y + 2);
                this._canvasContext.lineTo(position.x + 2, position.y + 2);
                this._canvasContext.stroke();

                this._canvasContext.moveTo(this._lastPosition.x + 4, this._lastPosition.y + 4);
                this._canvasContext.lineTo(position.x + 4, position.y + 4);
                this._canvasContext.stroke();

                this._lastPosition.copy(position);
            }
        }

        finishStroke() {
            if (this._canvasContext) {
                this._canvasContext.restore();
                this._canvasContext = null;
            }
        }

        constructor(public color: string = _brushColor) {
        }
    }

    // TODO make radius adjustable
    export class InkDrop implements Brush {
        get radius(): number {
            return 40;
        }

        private _canvasContext: CanvasRenderingContext2D = null;

        drawDrop(position: THREE.Vector2) {
            this._canvasContext.beginPath();
            this._canvasContext.globalAlpha = Math.random();
            this._canvasContext.arc(
                position.x, position.y,
                getRandomInt(10, 30),
                30, 270, false
            );
            this._canvasContext.fill();
        }

        startStroke(canvas: HTMLCanvasElement, position: THREE.Vector2) {
            this._canvasContext = canvas.getContext('2d');
            this._canvasContext.save(); // Assumption: nobody else will call this until the stroke is finished

            this._canvasContext.fillStyle = this.color;
            this._canvasContext.lineJoin = this._canvasContext.lineCap = 'round';
            this.drawDrop(position);
        }

        continueStoke(position: THREE.Vector2) {
            if (this._canvasContext) {
                this.drawDrop(position);
            }
        }

        finishStroke() {
            if (this._canvasContext) {
                this._canvasContext.restore();
                this._canvasContext = null;
            }
        }

        constructor(public color: string = _brushColor) {
        }
    }

    export class Star implements Brush {
        private _canvasContext: CanvasRenderingContext2D = null;
        private _lastPosition: THREE.Vector2 = new THREE.Vector2();

        drawStar(position: THREE.Vector2, angle: number) {
            var length = this.radius / 3.5;
            var x = position.x, y = position.y;
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

        startStroke(canvas: HTMLCanvasElement, position: THREE.Vector2) {
            this._canvasContext = canvas.getContext('2d');
            this._canvasContext.save();
            this._canvasContext.strokeStyle = this.color;
            this._canvasContext.lineJoin = this._canvasContext.lineCap = 'round';
            this.drawStar(position, getRandomInt(0, 180));
            this._lastPosition.copy(position);
        }

        continueStoke(position: THREE.Vector2) {
            if (this._canvasContext && this._lastPosition.distanceTo(position) > this.radius) {
                this.drawStar(position, getRandomInt(0, 180));
                this._lastPosition.copy(position);
            }
        }

        finishStroke() {
            if (this._canvasContext) {
                this._canvasContext.restore();
                this._canvasContext = null;
            }
        }

        constructor(public radius = _brushSize,
                    public color = _brushColor) {
        }
    }

    // TODO make brush size adjustable
    export class RandomStar implements Brush {
        get radius(): number {
            return 40;
        }

        private _canvasContext: CanvasRenderingContext2D = null;

        drawStar(position: THREE.Vector2) {
            var angle = getRandomInt(0, 180),
                width = getRandomInt(1, 10),
                opacity = Math.random(),
                scale = getRandomInt(5, 20) / 20,
                color = ('rgb(' + getRandomInt(0, 255) + ',' + getRandomInt(0, 255) + ',' + getRandomInt(0, 255) + ')'),
                length = 15;

            this._canvasContext.save();
            this._canvasContext.translate(position.x, position.y);
            this._canvasContext.beginPath();
            this._canvasContext.globalAlpha = opacity;
            this._canvasContext.rotate(Math.PI / 180 * angle);
            this._canvasContext.scale(scale, scale);
            this._canvasContext.strokeStyle = color;
            this._canvasContext.lineWidth = width;
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

        startStroke(canvas: HTMLCanvasElement, position: THREE.Vector2) {
            this._canvasContext = canvas.getContext('2d');
            this._canvasContext.save();
            this.drawStar(position);
        }

        continueStoke(position: THREE.Vector2) {
            if (this._canvasContext) {
                this.drawStar(position);
            }
        }

        finishStroke() {
            if (this._canvasContext) {
                this._canvasContext.restore();
                this._canvasContext = null;
            }
        }

        constructor() {
        }
    }

    export class TextureBrush implements Brush {
        private img = new Image();
        private _canvasContext: CanvasRenderingContext2D = null;
        private _pencilTexture;
        private lastPoint;

        getPattern() {
            var patternCanvas = document.createElement('canvas'),
                dotWidth = 512,
                patternCtx = patternCanvas.getContext('2d');

            patternCanvas.width = patternCanvas.height = dotWidth;

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

            patternCtx.drawImage(this.img, 0, 0);
            return this._canvasContext.createPattern(patternCanvas, 'repeat');
        }

        startStroke(canvas: HTMLCanvasElement, position: THREE.Vector2) {
            this._canvasContext = canvas.getContext('2d');
            this._canvasContext.beginPath();
            this._canvasContext.save(); // Assumption: nobody else will call this until the stroke is finished

            this._canvasContext.lineWidth = this.radius;
            this._canvasContext.lineJoin = this._canvasContext.lineCap = 'round';
            this._canvasContext.strokeStyle = this.getPattern();// TODO
            this._canvasContext.moveTo(position.x, position.y);
        }

        continueStoke(position: THREE.Vector2) {
            if (this._canvasContext) {
                this._canvasContext.lineTo(position.x, position.y);
                this._canvasContext.moveTo(position.x, position.y);
                this._canvasContext.stroke();
            }
        }

        finishStroke() {
            if (this._canvasContext) {
                this._canvasContext.moveTo(0, 0);
                this._canvasContext.restore();
                this._canvasContext = null;
            }
        }

        constructor(public radius: number = _brushSize) {
            this._pencilTexture = _brushTexture;
        }
    }

    export class Spray implements Brush {
        private _canvasContext: CanvasRenderingContext2D = null;
        private _density = 70;

        startStroke(canvas: HTMLCanvasElement, position: THREE.Vector2) {
            this._canvasContext = canvas.getContext('2d');
            this._canvasContext.beginPath();
            this._canvasContext.save(); // Assumption: nobody else will call this until the stroke is finished

            this._canvasContext.fillStyle = this.color;
        }

        continueStoke(position: THREE.Vector2) {
            if (this._canvasContext) {
                for (var i = this._density; i--;) {
                    var dotRadius = getRandomFloat(0, this.radius);
                    var angle = getRandomFloat(0, Math.PI * 2);
                    var dotWidth = getRandomFloat(1, 2);
                    this._canvasContext.globalAlpha = Math.random();
                    this._canvasContext.fillRect(
                        position.x + dotRadius * Math.cos(angle),
                        position.y + dotRadius * Math.sin(angle),
                        dotWidth, dotWidth
                    );
                }
            }
        }

        finishStroke() {
            if (this._canvasContext) {
                this._canvasContext.restore();
                this._canvasContext = null;
            }
        }

        constructor(public radius: number = _brushSize,
                    public color: string = _brushColor) {
        }
    }

}

