/// <reference path="./three.d.ts" />

declare module THREE {
    export class OBJLoader extends EventDispatcher {
        constructor(loadingManager?: THREE.LoadingManager);
        load(url: string, callback?: (response: any) => any): void;
        parse(data: any): any;
    }

    export class OBJExporter extends EventDispatcher {
        constructor();
        parse(data: any): any;
    }
}
