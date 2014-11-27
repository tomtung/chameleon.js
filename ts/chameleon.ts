/// <reference path="./chameleon/controls.ts" />

module Chameleon {
    export function create(geometry: THREE.Geometry, canvas?: HTMLCanvasElement) {
        return new Controls(geometry, canvas);
    }
}

