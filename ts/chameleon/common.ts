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

}