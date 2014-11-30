/// <reference path="./three.d.ts" />
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

(() => {
    function getGeometry() {
        return new THREE.CylinderGeometry(1, 1, 2);
    }

    var chameleon = Chameleon.create(getGeometry());
    document.body.appendChild(chameleon.canvas);

    var onresize = () => {
        chameleon.canvas.height = window.innerHeight;
        chameleon.canvas.width = window.innerWidth;
        chameleon.handleResize();
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

        var handleSizeChange = (newSize) => chameleon.brush.radius = newSize / 2;
        var handleColorChange = (newColor) => {
            if ('color' in chameleon.brush) {
                (<any>chameleon.brush).color = newColor;
            }
        };
        var handleTextureChange = (newTexture) => {
            if (!('texture' in chameleon.brush)) {
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
        handleTypeChange(settings.brush.type);
    }

    function setUpGui() {
        var settings = {
            backgroundColor: '#FFFFFF',
            camera: {
                reset: () => {
                    chameleon.resetCameras();
                },
                perspectiveViewing: false
            }
        };
        var gui = new dat.GUI({width: 310});

        gui.addColor(settings, 'backgroundColor').name('Background Reset').onChange(
            (value) =>  chameleon.backgroundColor = value
        );

        var cameraFolder = gui.addFolder('Camera');
        var brushFolder = gui.addFolder('Brush');

        cameraFolder.open();
        cameraFolder.add(settings.camera, 'perspectiveViewing').name('Perspective Viewing').onChange(
            (value) => {
                chameleon.perspectiveView = value;
                if (value) {
                    brushFolder.close();
                } else {
                    brushFolder.open();
                }
            }
        );
        cameraFolder.add(settings.camera, 'reset').name('Reset');

        brushFolder.open();

        setUpBrushSettingsGui(settings, brushFolder);
    }

    window.onload = function () {
        setUpGui();

        // Render loop
        var render = () => {
            chameleon.update();
            requestAnimationFrame(render);
        };

        render();
    };
})();

