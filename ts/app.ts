/// <reference path="./three.d.ts" />
/// <reference path="./dat.gui.d.ts" />
/// <reference path="./chameleon.ts" />

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

    window.onload = function () {
        var _brushGUI = new FizzyText();
        var _gui = new dat.GUI();
        var _brushType = _gui.add(_brushGUI, 'brush', ['brush1', 'brush2', 'brush3', 'brush4', 'brush5', 'brush6', 'brush7', 'brush8', 'brush9', 'brush10']);


        var _f1 = _gui.addFolder("BrushSize");
        var _brushSize = _f1.add(_brushGUI, 'size', 1, 30).min(1).step(0.5);
        var _f2 = _gui.addFolder("Color");
        var _brushColor = _f2.addColor(_brushGUI, 'color0');

        var _f3;
        var _textureType;

        Chameleon.changeBrushType("brush1");
        Chameleon.changeBrushSize(_brushGUI.size);
        Chameleon.changeBrushColor(_brushGUI.color0);
        Chameleon.changeTextureType("grass");
        _f2.open();
        _f1.open();

        _brushType.onFinishChange(function (value) {

            if ((_brushGUI.brush == "brush1" || _brushGUI.brush == "brush2" || _brushGUI.brush == "brush5" || _brushGUI.brush == "brush6" || _brushGUI.brush == "brush7" || _brushGUI.brush == "brush10") && !_gui.hasFolder("Color")) {
                _f2 = _gui.addFolder("Color");
                _brushColor = _f2.addColor(_brushGUI, 'color0');
                _f2.open();
                _brushColor.onChange(function (value) {
                    Chameleon.changeBrushColor(_brushGUI.color0);
                });
            }
            if ((_brushGUI.brush == "brush1" || _brushGUI.brush == "brush2" || _brushGUI.brush == "brush7" || _brushGUI.brush == "brush8" || _brushGUI.brush == "brush9" || _brushGUI.brush == "brush10") && !_gui.hasFolder("BrushSize")) {
                _f1 = _gui.addFolder("BrushSize");
                _brushSize = _f1.add(_brushGUI, 'size', 1, 30).min(1).step(0.5);
                _f1.open();
                _brushSize.onFinishChange(function (value) {
                    Chameleon.changeBrushSize(_brushGUI.size);
                });
            }

            if (_brushGUI.brush == "brush9") {
                _f3 = _gui.addFolder("Texture");
                _textureType = _f3.add(_brushGUI, 'textureType', ['grass', 'metal', 'rock', 'blackleather']);
                _f3.open();
                _textureType.onFinishChange(function (value) {
                    Chameleon.changeTextureType(_brushGUI.textureType);
                });
            }

            if (_brushGUI.brush == "brush3" || _brushGUI.brush == "brush4" || _brushGUI.brush == "brush8") {
                _gui.removeFolder("Color");
                _gui.removeFolder("BrushSize");
            }
            if (_brushGUI.brush == "brush5" || _brushGUI.brush == "brush6") {
                _gui.removeFolder("BrushSize");
            }
            if (_brushGUI.brush == "brush9") {
                _gui.removeFolder("Color");
            }
            if (_brushGUI.brush != "brush9") {
                _gui.removeFolder("Texture");
            }

            Chameleon.changeBrushType(_brushGUI.brush);

        });
        _brushSize.onFinishChange(function (value) {
            Chameleon.changeBrushSize(_brushGUI.size);
        });
        _brushColor.onChange(function (value) {
            Chameleon.changeBrushColor(_brushGUI.color0);
        });
    };

    // Render loop
    var render = () => {
        chameleon.update();
        requestAnimationFrame(render);
    };

    render();
})();

var FizzyText = function () {
    this.brush = 'brush';
    this.textureType = 'textureType';
    this.size = 15;
    this.color0 = "#9b0000";
};