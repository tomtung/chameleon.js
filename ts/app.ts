/// <reference path="./three.d.ts" />
/// <reference path="./three-objloaderexporter.d.ts" />
/// <reference path="./dat.gui.d.ts" />
/// <reference path="./chameleon.ts" />

interface BrushItem {
    name: string
    instance: Chameleon.Brush
    sizeConfig?: boolean
    colorConfig?: boolean
    textureConfig?: boolean
}

interface TextureItem {
    name: string
    canvas: HTMLCanvasElement
}

declare var saveAs: any; // https://github.com/eligrey/FileSaver.js

(() => {

    var chameleon: Chameleon.Controls;
    var screenCanvas = document.createElement('canvas');

    document.body.appendChild(screenCanvas);

    var onresize = () => {
        screenCanvas.height = window.innerHeight;
        screenCanvas.width = window.innerWidth;

        if (chameleon) {
            chameleon.handleResize();
        }
    };
    onresize();
    window.addEventListener('resize', onresize, false);

    function setUpBrushSettingsGui(settings: any, folder: dat.GUI) {
        settings.brush = {
            type: null,
            size: 15,
            color: '#00d3e1',
            texture: null
        };

        var loadTexture = (path: string): HTMLCanvasElement => {
            var textureSideLength = 512;
            var canvas = document.createElement('canvas');
            canvas.height = canvas.width = textureSideLength;

            var image = new Image();
            image.src = path;
            image.onload = () => {
                canvas.getContext('2d').drawImage(image, 0, 0);
            };

            return canvas;
        };
        var textureItems: TextureItem[] = [
            {
                name: 'Grass',
                canvas: loadTexture('image/grass_texture.jpg')
            }, {
                name: 'Metal',
                canvas: loadTexture('image/metal_texture.jpg')
            }, {
                name: 'Rock',
                canvas: loadTexture('image/rock_texture.jpg')
            }, {
                name: 'Black Leather',
                canvas: loadTexture('image/blackleather_texture.jpg')
            }
        ];

        var brushItems: BrushItem[] = [
            {
                name: 'Marker',
                instance: new Chameleon.MarkerBrush(1, '#000000'),
                sizeConfig: true,
                colorConfig: true
            }, {
                name: 'Blurry Marker',
                instance: new Chameleon.BlurryMarkerBrush(1, '#000000'),
                sizeConfig: true,
                colorConfig: true
            }, {
                name: 'Calligraphy',
                instance: new Chameleon.CalligraphyBrush()
            }, {
                name: 'Fur',
                instance: new Chameleon.Fur()
            }, {
                name: 'Thick Brush',
                instance: new Chameleon.ThickBrush(1, '#000000'),
                sizeConfig: true,
                colorConfig: true
            }, {
                name: 'Ink Drop',
                instance: new Chameleon.InkDropBrush(1, '#000000'),
                sizeConfig: true,
                colorConfig: true
            }, {
                name: 'Star',
                instance: new Chameleon.StarBrush(1, '#000000'),
                sizeConfig: true,
                colorConfig: true
            }, {
                name: 'Random Star',
                instance: new Chameleon.RandomStarBrush(1),
                sizeConfig: true
            }, {
                name: 'Spray',
                instance: new Chameleon.SprayBrush(1, '#000000'),
                sizeConfig: true,
                colorConfig: true
            }, {
                name: 'Texture',
                instance: new Chameleon.TextureBrush(1, textureItems[0].canvas),
                sizeConfig: true,
                textureConfig: true
            }
        ];

        var typeController = folder.add(settings.brush, 'type', brushItems.map((_)=>_.name)).name('Type');
        var sizeController = folder.add(settings.brush, 'size', 1, 40).step(0.5).name('Size');
        var colorController = folder.addColor(settings.brush, 'color').name('Color');
        var textureController = folder.add(settings.brush, 'texture', textureItems.map((_)=>_.name)).name('Texture');

        var handleSizeChange = (newSize) => {
            if (chameleon) {
                chameleon.brush.radius = newSize / 2;
            }
        };
        var handleColorChange = (newColor) => {
            if (chameleon && ('color' in chameleon.brush)) {
                (<any>chameleon.brush).color = newColor;
            }
        };
        var handleTextureChange = (newTexture) => {
            if (!chameleon || !('texture' in chameleon.brush)) {
                return;
            }
            for (var i = 0; i < textureItems.length; i += 1) {
                if (textureItems[i].name === newTexture) {
                    (<any>chameleon.brush).texture = textureItems[i].canvas;
                    return;
                }
            }
        };
        var handleTypeChange = (newType) => {
            if (!chameleon) {
                return;
            }

            for (var i = 0; i < brushItems.length; i += 1) {
                if (brushItems[i].name === newType) {
                    chameleon.brush = brushItems[i].instance;

                    handleSizeChange(settings.brush.size);
                    handleColorChange(settings.brush.color);
                    handleTextureChange(settings.brush.texture);

                    sizeController.domElement.style.visibility = (brushItems[i].sizeConfig) ? 'visible' : 'collapse';
                    colorController.domElement.style.visibility = (brushItems[i].colorConfig) ? 'visible' : 'collapse';
                    textureController.domElement.style.visibility = (brushItems[i].textureConfig) ? 'visible' : 'collapse';

                    return;
                }
            }
        };

        typeController.onChange(handleTypeChange);
        sizeController.onChange(handleSizeChange);
        colorController.onChange(handleColorChange);
        textureController.onChange(handleTextureChange);

        settings.brush.type = brushItems[0].name;

        return () => {
            handleTypeChange(settings.brush.type);
        };
    }

    function setUpGui() {
        var settings = {
            backgroundColor: '#FFFFFF',
            camera: {
                reset: () => {
                    if (chameleon) {
                        chameleon.resetCameras();
                    }
                },
                perspectiveView: false
            },
            exportObjTexture: () => {
                if (chameleon) {
                    saveAs(chameleon.packTexture(), 'texture-export.zip');
                }
            },
            openHelp: () => {
                window.open('https://github.com/tomtung/chameleon.js#usage');
            }
        };
        var gui = new dat.GUI({width: 350});

        var handleBackgroundReset = (color) => {
            if (chameleon) {
                chameleon.backgroundColor = color;
            }
        };
        gui.addColor(settings, 'backgroundColor').name('Background Reset').onChange(handleBackgroundReset);

        var cameraFolder = gui.addFolder('Camera');
        var brushFolder = gui.addFolder('Brush');

        cameraFolder.open();
        var handlePerspectiveView = (perspectiveVIew) => {
            if (chameleon) {
                chameleon.perspectiveView = perspectiveVIew;
            }
            if (perspectiveVIew) {
                brushFolder.close();
            } else {
                brushFolder.open();
            }
        };
        cameraFolder.add(settings.camera, 'perspectiveView').name('Perspective Viewing').onChange(handlePerspectiveView);
        cameraFolder.add(settings.camera, 'reset').name('Reset');

        brushFolder.open();

        var reapplyBrushGuiSettings = setUpBrushSettingsGui(settings, brushFolder);

        gui.add(settings, 'exportObjTexture').name('Export Textured Model');
        gui.add(settings, 'openHelp').name('Help');

        return () => {
            handleBackgroundReset(settings.backgroundColor);
            handlePerspectiveView(settings.camera.perspectiveView);
            reapplyBrushGuiSettings();
        };
    }

    var reapplyGuiSettings = setUpGui();

    function loadGeometry(geometry: THREE.Geometry) {
        if (chameleon) {
            chameleon.removeEventListeners();
        }

        chameleon = Chameleon.create(geometry, screenCanvas);
        reapplyGuiSettings();
        console.log('New Model Loaded.');
    }

    function object3dToGeometry(object3d: THREE.Object3D): THREE.Geometry {
        var geometry = new THREE.Geometry();
        object3d.traverse((child: THREE.Object3D) => {
            if ((child instanceof THREE.Mesh) && !(child.parent instanceof THREE.Mesh)) {
                var mesh = <THREE.Mesh>child;
                if (mesh.geometry instanceof THREE.BufferGeometry) {
                    mesh.geometry = new THREE.Geometry().fromBufferGeometry(<any>mesh.geometry);
                    mesh.geometry.faceVertexUvs = [[]];
                    mesh.geometry.uvsNeedUpdate = true;
                }
                THREE.GeometryUtils.merge(geometry, mesh);
            }
        });
        return geometry;
    }

    var objLoader = new THREE.OBJLoader();

    screenCanvas.ondragover = () => false;
    screenCanvas.ondrop = (e) => {
        e.preventDefault();

        var file: File = e.dataTransfer.files[0],
            reader = new FileReader();

        reader.onload = () => {
            var object3d = objLoader.parse(reader.result);
            loadGeometry(object3dToGeometry(object3d));
        };
        reader.readAsText(file);
    };

    window.onload = function () {
        objLoader.load('models/chameleon.obj', (object3d) => {
            var geometry = object3dToGeometry(object3d);
            geometry.applyMatrix(new THREE.Matrix4().makeRotationY(Math.PI / 2));
            geometry.applyMatrix(new THREE.Matrix4().makeTranslation(0, -1, 0));
            loadGeometry(geometry);
        });

        // Render loop
        var render = () => {
            if (chameleon) {
                chameleon.update();
            }
            requestAnimationFrame(render);
        };

        render();
    };
})();

