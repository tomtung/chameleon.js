/// <reference path="../three.d.ts" />

module Chameleon {
    export interface Box {
        left: number;
        top: number;
        width: number;
        height: number;
    }

    export function mousePositionInCanvas(event: MouseEvent, canvasBox: Box) {
        return new THREE.Vector2(
            event.pageX - canvasBox.left,
            event.pageY - canvasBox.top
        )
    }

    export function showCanvasInNewWindow(canvas: HTMLCanvasElement) {
        var dataURL = canvas.toDataURL("image/png");
        var newWindow = window.open();
        newWindow.document.write('<img style="border:1px solid black" src="' + dataURL + '"/>');
    }

    export function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
    }

    export function getRandomFloat(min, max) {
        return Math.random() * (max - min) + min;
    }

    export function angleBetween(point1: THREE.Vector2, point2: THREE.Vector2) {
        return Math.atan2(point2.x - point1.x, point2.y - point1.y);
    }

}