/// <reference path="./chameleon/controls.ts" />
/// <reference path="./chameleon/brushes.ts" />

module Chameleon {
    export function create(geometry: THREE.Geometry, canvas?: HTMLCanvasElement) {
        return new Controls(geometry, canvas);
    }
}

