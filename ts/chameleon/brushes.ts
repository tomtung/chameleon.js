/// <reference path="./common.ts" />

module Chameleon {

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
            this._canvasContext.lineWidth = this.radius * 2;

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

    export class MarkerBrush implements Brush {
        private _canvasContext: CanvasRenderingContext2D = null;

        startStroke(canvas: HTMLCanvasElement, position: THREE.Vector2) {
            this._canvasContext = canvas.getContext('2d');
            this._canvasContext.beginPath();
            this._canvasContext.save(); // Assumption: nobody else will call this until the stroke is finished

            this._canvasContext.lineWidth = this.radius * 2;
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

        constructor(public radius: number,
                    public color: string) {
        }
    }

    export class BlurryMarkerBrush implements Brush {
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

        constructor(public radius: number,
                    public color: string) {
        }
    }

    export class CalligraphyBrush implements Brush {
        get radius(): number {
            return 32 / 2;
        }

        private img = new Image();

        private _canvasContext: CanvasRenderingContext2D = null;
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
                    var x = this._lastPosition.x + (Math.sin(angle) * i) - this.radius;
                    var y = this._lastPosition.y + (Math.cos(angle) * i) - this.radius;
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
    }

    export class Fur implements Brush {
        get radius(): number {
            return 32 * 1.415 / 2;
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
    }

    export class ThickBrush implements Brush {
        private _canvasContext: CanvasRenderingContext2D = null;
        private _lastPosition = new THREE.Vector2();

        startStroke(canvas: HTMLCanvasElement, position: THREE.Vector2) {
            this._canvasContext = canvas.getContext('2d');
            this._canvasContext.beginPath();
            this._canvasContext.save(); // Assumption: nobody else will call this until the stroke is finished

            this._canvasContext.lineWidth = this.radius / 10;
            this._canvasContext.strokeStyle = this.color;
            this._canvasContext.lineJoin = this._canvasContext.lineCap = 'round';
            this._lastPosition.copy(position);
        }

        continueStoke(position: THREE.Vector2) {
            if (this._canvasContext) {
                this._canvasContext.beginPath();
                this._canvasContext.globalAlpha = 0.85;

                for (var i = -this.radius * 0.9; i <= this.radius * 0.9; i += this.radius / 20) {
                    this._canvasContext.beginPath();
                    this._canvasContext.moveTo(this._lastPosition.x + i, this._lastPosition.y + i);
                    this._canvasContext.lineTo(position.x + i, position.y + i);
                    this._canvasContext.stroke();
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

        constructor(public radius: number,
                    public color: string) {
        }
    }

    export class InkDropBrush implements Brush {
        private _canvasContext: CanvasRenderingContext2D = null;
        private _lastPosition = new THREE.Vector2();

        drawDrop(position: THREE.Vector2) {
            this._canvasContext.beginPath();
            this._canvasContext.globalAlpha = Math.random();
            this._canvasContext.arc(
                position.x, position.y,
                getRandomInt(this.radius / 3, this.radius),
                30, 270, false
            );
            this._canvasContext.fill();
        }

        startStroke(canvas: HTMLCanvasElement, position: THREE.Vector2) {
            this._canvasContext = canvas.getContext('2d');
            this._canvasContext.save(); // Assumption: nobody else will call this until the stroke is finished

            this._canvasContext.fillStyle = this.color;
            this._canvasContext.lineJoin = this._canvasContext.lineCap = 'round';
            this._lastPosition.copy(position);
            this.drawDrop(position);
        }

        continueStoke(position: THREE.Vector2) {
            if (this._canvasContext && position.distanceTo(this._lastPosition) > this.radius * 2 / 3) {
                this._lastPosition.copy(position);
                this.drawDrop(position);
            }
        }

        finishStroke() {
            if (this._canvasContext) {
                this._canvasContext.restore();
                this._canvasContext = null;
            }
        }

        constructor(public radius: number,
                    public color: string) {
        }
    }

    export class StarBrush implements Brush {
        private _canvasContext: CanvasRenderingContext2D = null;
        private _lastPosition: THREE.Vector2 = new THREE.Vector2();

        drawStar(position: THREE.Vector2, angle: number) {
            var length = this.radius / 2;
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

        constructor(public radius: number,
                    public color: string) {
        }
    }

    export class RandomStarBrush implements Brush {
        private _canvasContext: CanvasRenderingContext2D = null;
        private _lastPosition: THREE.Vector2 = new THREE.Vector2();

        drawStar(position: THREE.Vector2) {
            var angle = getRandomInt(0, 180),
                width = getRandomInt(1, this.radius / 2.8),
                opacity = Math.random(),
                scale = getRandomInt(10, 20) / 20,
                color = ('rgb(' + getRandomInt(0, 255) + ',' + getRandomInt(0, 255) + ',' + getRandomInt(0, 255) + ')'),
                length = this.radius / 3.5;

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
            this._lastPosition.copy(position);
            this.drawStar(position);
        }

        continueStoke(position: THREE.Vector2) {
            if (this._canvasContext && position.distanceTo(this._lastPosition) > this.radius * 2 / 3) {
                this._lastPosition.copy(position);
                this.drawStar(position);
            }
        }

        finishStroke() {
            if (this._canvasContext) {
                this._canvasContext.restore();
                this._canvasContext = null;
            }
        }

        constructor(public radius: number) {
        }
    }

    export class SprayBrush implements Brush {
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

        constructor(public radius: number,
                    public color: string) {
        }
    }

    export class TextureBrush implements Brush {
        private _canvasContext: CanvasRenderingContext2D = null;

        startStroke(canvas: HTMLCanvasElement, position: THREE.Vector2) {
            this._canvasContext = canvas.getContext('2d');
            this._canvasContext.beginPath();
            this._canvasContext.save(); // Assumption: nobody else will call this until the stroke is finished

            this._canvasContext.lineWidth = this.radius * 2;
            this._canvasContext.lineJoin = this._canvasContext.lineCap = 'round';
            this._canvasContext.strokeStyle = this._canvasContext.createPattern(this.texture, 'repeat');
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

        constructor(public radius: number,
                    public texture: HTMLCanvasElement) {
        }
    }

}

