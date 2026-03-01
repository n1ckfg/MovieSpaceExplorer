import THREE from 'three';
import OrbitControls from './OrbitControls';
import TransformControls from './TransformControls';
import throttle from 'lodash.throttle';
const ResizeSensor = require('imports?this=>window!css-element-queries/src/ResizeSensor');

import gen_array from './gen_array';
import createImageData from './create_image_data';

import cubeShader from './shaders/cube_face_shader';
import cubeVolumeShader from './shaders/cube_volume_shader';

const cubeMaterial = new THREE.ShaderMaterial(cubeShader);

const CAMERA_BASE = 1;
const INITIAL_PLANE_SIZE = 0.8;

/**
 * Create a plane from 4 points.
 */
const createPlane = (name, a, b, c, d, mat) => {
    const indices = new Uint32Array([0, 1, 2, 0, 2, 3]);

    const vertices = new Float32Array([
        a.x, a.y, a.z,
        b.x, b.y, b.z,
        c.x, c.y, c.z,
        d.x, d.y, d.z
    ]);

    const uv = new Float32Array([
        0, 0,
        1, 0,
        1, 1,
        0, 1
    ]);

    const geometry = new THREE.BufferGeometry();

    geometry.addAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.addAttribute('uv', new THREE.BufferAttribute(uv, 2));

    geometry.setIndex(new THREE.BufferAttribute(indices, 1));

    const mesh = new THREE.Mesh(geometry, mat);
    mesh.name = name;
    mesh.geometry.vertices = [a, b, c, d];
    return mesh;
};

/**
 * Helper to  create a texture from image data.
 */
const createTextureFromImageData = (imageData) => {
    const text = new THREE.Texture(imageData);
    text.minFilter = THREE.NearestFilter;
    text.needsUpdate = true;
    return text;
};


/**
 * 
 */
export default class CubeRenderer {
    constructor(canvas, container, delegate) {
        this._frames = [];
        this._options = {};
        this._delegate = delegate;
        this._container = container;

        this._scene = new THREE.Scene();
        this._uiScene = new THREE.Scene();

        this.initRenderer(canvas);
        this.initCamera(CAMERA_BASE, CAMERA_BASE);
        this.initControls(canvas);
        new ResizeSensor(this._container, this.onResize.bind(this));
        this.onResize();

        this.initGeometry();

        this.animate = () => this.animateImpl();
        this.animateImpl();
    }

    initRenderer(canvas) {
        this._renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            alpha: true
        });
        this._renderer.autoClear = false;
        this._renderer.setClearColor(0xffffff, 0);
        this._renderer.setPixelRatio(window.devicePixelRatio ? window.devicePixelRatio : 1);
    }

    initCamera(width, height) {
        this._camera = new THREE.OrthographicCamera(width / - 2, width / 2, height / 2, height / - 2, -10, 10);
        this.resetCamera();
    }

    initControls(container) {
        this._controls = new OrbitControls(this._camera, container);
        this._controls.enableDamping = true;
        this._controls.dampingFactor = 0.25;
        this._controls.enableZoom = true;
        this._controls.minZoom = 0.01;
        this._controls.maxZoom = 20;

        // Create transform controls
        this._transformControls = new TransformControls(this._camera, container);
        this._transformControls.setSize(1);
        this._transformControls.setSpace('local');
        this._uiScene.add(this._transformControls);

        window.addEventListener('keydown', (event) => {
            switch (event.keyCode) {
                case 87: // W
                    this._transformControls.setMode("translate");
                    break;

                case 69: // E
                    this._transformControls.setMode("rotate");
                    break;

                case 82: // R
                    this._transformControls.setMode("scale");
                    break;
            }
        });

        this._transformControls.addEventListener('change', () => {
            this._needsSlice = true;
        });
    }

    onResize() {
        const {width, height} = this._container.getBoundingClientRect();

        this._width = width;
        this._height = height;

        this._renderer.setSize(width, height);

        const aspect = width / height;
        this._camera.left = -CAMERA_BASE * aspect;
        this._camera.right = CAMERA_BASE * aspect;
        this._camera.top = CAMERA_BASE;
        this._camera.bottom = -CAMERA_BASE;
        this._camera.updateProjectionMatrix();
    }

    initGeometry() {
        this.initPlane();
        this.initAxis();
    }

    initPlane() {
        const material = new THREE.MeshBasicMaterial({
            side: THREE.DoubleSide,
            map: new THREE.Texture(),
            transparent: true,
            alphaTest: 0.5,
        });

        const size = INITIAL_PLANE_SIZE;
        const p1 = new THREE.Vector3(-size, size, 0);
        const p2 = new THREE.Vector3(size, size, 0);
        const p3 = new THREE.Vector3(size, -size, 0);
        const p4 = new THREE.Vector3(-size, -size, 0);

        this._plane = createPlane('plane', p1, p2, p3, p4, material);

        this._plane.geometry.attributes.uv.array = new Float32Array([
            0, 1,
            1, 1,
            1, 0,
            0, 0,
        ]);
        this._plane.geometry.attributes.uv.needsUpdate = true;
        this.resetPlane();
        this._transformControls.attach(this._plane);
        this._scene.add(this._plane);

        this._planeGuides = new THREE.Object3D();
        this._plane.add(this._planeGuides);

        // Create outline
        const outlineGeomtry = new THREE.Geometry();
        outlineGeomtry.vertices.push(p1, p2, p3, p4, p1);
        const outlineMaterial = new THREE.LineBasicMaterial({ color: 0x444444 });
        this._planeGuides.add(new THREE.Line(outlineGeomtry, outlineMaterial));

        // create marker for top left of plane
        const topLeftMarkerGeometry = new THREE.BoxGeometry(0.05, 0.05, 0.05);
        const topLeftMarkerMaterial = new THREE.MeshBasicMaterial({ color: 0xcccccc });
        const topLeftMarker = new THREE.Mesh(topLeftMarkerGeometry, topLeftMarkerMaterial);

        this._planeGuides.add(topLeftMarker);
        topLeftMarker.translateX(-size);
        topLeftMarker.translateY(size);
    }

    initAxis() {
        const size = 0.4;
        const origin = new THREE.Vector3(-0.6, -0.6, 0.6);

        const axis = [
            { color: 0xff0000, vector: new THREE.Vector3(size, 0, 0) },
            { color: 0x00ff00, vector: new THREE.Vector3(0, size, 0) },
            { color: 0x0000ff, vector: new THREE.Vector3(0, 0, -size) }];

        this._axis = new THREE.Object3D();
        for (const a of axis) {
            const material = new THREE.LineBasicMaterial({ color: a.color });
            const geometry = new THREE.Geometry();
            geometry.vertices.push(origin, new THREE.Vector3().addVectors(origin, a.vector));

            this._axis.add(new THREE.Line(geometry, material));
        }
        this._scene.add(this._axis);
    }

    /**
     * Set the camera to its original position
     */
    resetCamera() {
        this._setCameraPosition(1, 1, 1);
    }

    /**
     * Switch to default front view.
     */
    goToFrontView() {
        this._setCameraPosition(0, 0, 1.5);
    }

    /**
     * Switch to default side view.
     */
    goToSideView() {
        this._setCameraPosition(1.5, 0, 0);
    }

    /**
     * Siwtch to default top view.
     */
    goToTopView() {
        this._setCameraPosition(0, 1.5, 0);
    }

    _setCameraPosition(x, y, z) {
        if (this._controls)
            this._controls.reset();
        this._camera.position.set(x, y, z);
        this._camera.rotation.set(0, 0, 0, 0);
        this._camera.lookAt(new THREE.Vector3());
    }

    /**
     * Resets the sampling plane to its original position and size.
     */
    resetPlane() {
        this._plane.scale.set(1, 1, 1);
        this._plane.position.set(0, 0, 0);
        this._plane.rotation.set(0, 0, 0, 0);
        this._plane.updateMatrix();
        this._plane.rotateOnAxis(new THREE.Vector3(-1, 0, 0).normalize(), Math.PI / 4);
        this._needsSlice = true;
    }

    /**
     * Turn the transform controls on or off.
     */
    showControls(shouldShowControls) {
        if (shouldShowControls) {
            this._transformControls.attach(this._plane);
        } else {
            this._transformControls.detach();
        }
    }

    /**
     * Show the transform control mode
     */
    setTransformMode(mode) {
        this.showControls(true);
        this._transformControls.setMode(mode);
    }

    /**
     * 
     */
    showGuides(shouldShowGuides) {
        this._axis.visible = shouldShowGuides;
        this._planeGuides.visible = shouldShowGuides;
        this._cubeOutline.visible = shouldShowGuides;
    }

    /**
     * Remove all objects from the current scene.
     */
    clear() {
        this._scene.remove(this._cube);
    }

    /**
     * 
     */
    slice() {
        if (!this._data)
            return;

        const sampleWidth = this._sampleWidth;
        const sampleHeight = this._sampleHeight;

        const plane = this._plane;
        const vertices = plane.geometry.vertices;
        const p1 = vertices[0].clone().applyMatrix4(plane.matrix);
        const p2 = vertices[1].clone().applyMatrix4(plane.matrix);
        const p3 = vertices[3].clone().applyMatrix4(plane.matrix);

        const dx = p2.clone().sub(p1).divideScalar(sampleWidth);
        const dx2 = dx.clone().divideScalar(2);
        const dy = p3.clone().sub(p1).divideScalar(sampleHeight);

        // Ensure we hvae a large enough texture buffer to write to
        if (!plane.material.map.image || plane.material.map.image.width !== sampleWidth || plane.material.map.image.height !== sampleHeight) {
            const texture = createImageData(sampleWidth, sampleHeight);
            plane.material.map.image = texture;
            plane.material.map.minFilter = THREE.NearestFilter;
        }

        const imageBuffer = plane.material.map.image.data;

        // Take all the samples 
        const start = p1.clone().add(dy.clone().divideScalar(2));
        for (let y = 0; y < sampleHeight; ++y, start.add(dy)) {
            const p = start.clone().add(dx2);
            for (let x = 0; x < sampleWidth; ++x, p.add(dx)) {
                this._sampleImageCube(imageBuffer, (x + y * sampleWidth) * 4, p.x, p.y, p.z);
            }
        }

        plane.material.map.needsUpdate = true;

        this._delegate.onSampleDidChange(plane.material.map.image);
    }

    /**
     * Samples the the color value of the gif cube at a position in 3D space.
     */
    _sampleImageCube(dest, destIndex, x, y, z) {
        const {width, depth, height} = this._imageCube;

        // Shift to positive coordinates to simplify sampling
        x += this._imageCube.width2;
        y += this._imageCube.height2;
        z += this._imageCube.depth2;

        // Invert for sampling so we sample in HTML ImageData/canvas order
        y = this._imageCube.height - y;
        z = this._imageCube.depth - z;

        // Check if in cube
        if (x < 0 || x > width || y < 0 || y > height || z < 0 || z > depth) {
            dest[destIndex++] = 0;
            dest[destIndex++] = 0;
            dest[destIndex++] = 0;
            dest[destIndex++] = 0;
            return;
        }

        const frameIndex = Math.floor(z / depth * this._data.frames.length);
        const frameData = this._data.frames[frameIndex].data.data;

        const u = Math.floor(x / width * this._data.width);
        const v = Math.floor(y / height * this._data.height);

        let sampleIndex = (v * this._data.width + u) * 4;
        dest[destIndex++] = frameData[sampleIndex++];
        dest[destIndex++] = frameData[sampleIndex++];
        dest[destIndex++] = frameData[sampleIndex++];
        dest[destIndex++] = 255;
    }

    /**
     * Set the currently rendered image.
     */
    setGif(imageData) {
        this.clear();
        this._data = imageData;

        const scale = Math.max(imageData.width, imageData.height);

        this._imageCube = {
            width: imageData.width / scale,
            height: imageData.height / scale,
            depth: 1,

            width2: imageData.width / scale / 2,
            height2: imageData.height / scale / 2,
            depth2: 1 / 2
        };

        const w = imageData.width / scale / 2;
        const h = imageData.height / scale / 2;
        const d = 1 / 2;
        const faces = this._getFaceImages(imageData);

        this._cube = new THREE.Object3D();
        this._cube.add(
            createPlane('front',
                new THREE.Vector3(-w, -h, d), new THREE.Vector3(w, -h, d), new THREE.Vector3(w, h, d), new THREE.Vector3(-w, h, d),
                faces.front));

        this._cube.add(
            createPlane('right',
                new THREE.Vector3(w, -h, d), new THREE.Vector3(w, -h, -d), new THREE.Vector3(w, h, -d), new THREE.Vector3(w, h, d),
                faces.right));

        this._cube.add(
            createPlane('back',
                new THREE.Vector3(-w, -h, -d), new THREE.Vector3(w, -h, -d), new THREE.Vector3(w, h, -d), new THREE.Vector3(-w, h, -d),
                faces.back));

        this._cube.add(
            createPlane('left',
                new THREE.Vector3(-w, -h, d), new THREE.Vector3(-w, -h, -d), new THREE.Vector3(-w, h, -d), new THREE.Vector3(-w, h, d),
                faces.left));

        this._cube.add(
            createPlane('top',
                new THREE.Vector3(-w, h, -d), new THREE.Vector3(w, h, -d), new THREE.Vector3(w, h, d), new THREE.Vector3(-w, h, d),
                faces.top));

        this._cube.add(
            createPlane('bottom',
                new THREE.Vector3(-w, -h, -d), new THREE.Vector3(w, -h, -d), new THREE.Vector3(w, -h, d), new THREE.Vector3(-w, -h, d),
                faces.bottom));

        this._scene.add(this._cube);

        // Create outlines
        this._cubeOutline = new THREE.Object3D();
        for (const child of this._cube.children.slice()) {
            const edges = new THREE.EdgesHelper(child, '#cccccc');
            this._cubeOutline.add(edges);
        }
        this._cube.add(this._cubeOutline);

        // Create gray inner volume
        const g2 = new THREE.BoxGeometry(this._imageCube.width - 0.01, this._imageCube.height - 0.01, this._imageCube.depth - 0.01);
        const mat = new THREE.ShaderMaterial(cubeVolumeShader);
        mat.uniforms.clippingPlane = cubeMaterial.uniforms.clippingPlane;

        const mesh = new THREE.Mesh(g2, mat);
        this._cube.add(mesh);

        this._needsSlice = true;
    }

    setSampleSize(width, height) {
        this._sampleWidth = width;
        this._sampleHeight = height;
        this._needsSlice = true;
    }

    sample(frame, x, y) {
        return frame.data[y * frame.height + x];
    }

    copyRgba(dest, destIndex, src, srcIndex) {
        destIndex *= 4;
        srcIndex *= 4;

        dest[destIndex++] = src[srcIndex++];
        dest[destIndex++] = src[srcIndex++];
        dest[destIndex++] = src[srcIndex++];
        dest[destIndex++] = src[srcIndex++];
    }

    sampleData(imageData, f) {
        const data = createImageData(imageData.width, imageData.height);
        for (let x = 0; x < imageData.width; ++x) {
            const frameIndex = Math.floor(x / imageData.width * imageData.frames.length);
            const frame = imageData.frames[frameIndex];
            for (let y = 0; y < imageData.height; ++y) {
                f(data, frame, x, y);
            }
        }
        return data;
    }

    sampleDataTop(imageData, f) {
        const data = createImageData(imageData.width, imageData.height);
        for (let y = 0; y < imageData.height; ++y) {
            const frameIndex = Math.floor(y / imageData.height * imageData.frames.length);
            const frame = imageData.frames[frameIndex];
            for (let x = 0; x < imageData.width; ++x) {
                f(data, frame, x, y);
            }
        }
        return data;
    }

    _frontImage(imageData) {
        return imageData.frames[0].data;
    }

    _rightImage(imageData) {
        return this.sampleData(imageData, (data, frame, x, y) =>
            this.copyRgba(
                data.data,
                y * imageData.width + x,
                frame.data.data,
                y * imageData.width + (imageData.width - 1)));
    }

    _backImage(imageData) {
        return imageData.frames[imageData.frames.length - 1].data;
    }

    _leftImage(imageData) {
        return this.sampleData(imageData, (data, frame, x, y) =>
            this.copyRgba(
                data.data,
                y * imageData.width + x,
                frame.data.data,
                y * imageData.width + 0));
    }

    _topImage(imageData) {
        return this.sampleDataTop(imageData, (data, frame, x, y) =>
            this.copyRgba(
                data.data,
                y * imageData.width + x,
                frame.data.data,
                x));
    }

    _bottomImage(imageData) {
        return this.sampleDataTop(imageData, (data, frame, x, y) =>
            this.copyRgba(
                data.data,
                y * imageData.width + x,
                frame.data.data,
                x + (imageData.height - 1) * imageData.width));
    }

    _getFaceImages(imageData) {
        const images = {
            front: this._frontImage(imageData),
            right: this._rightImage(imageData),
            back: this._backImage(imageData),
            left: this._leftImage(imageData),
            top: this._topImage(imageData),
            bottom: this._bottomImage(imageData),
        };

        return Object.keys(images).reduce((out, name) => {
            const mat = cubeMaterial.clone();
            mat.uniforms.tDiffuse.value = createTextureFromImageData(images[name]);
            mat.uniforms.clippingPlane = cubeMaterial.uniforms.clippingPlane;
            out[name] = mat;
            return out;
        }, {});
    }

    /**
     * Main render loop function.
     */
    animateImpl() {
        requestAnimationFrame(this.animate);

        this.update()
        this.render();

        if (false) { // sample auto move for demo
            this._delta = this._delta == undefined ? 0.0001 : this._delta;
            this._momentum = this._momentum == undefined ? 0.014 : this._momentum;

            const oldMomentum = this._momentum
            this._momentum += (this._plane.position.z > 0 ? -1 : 1) * this._delta;

            this._plane.translateZ(this._momentum);
            this._needsSlice = true;
        }

        this._slicer = this._slicer || throttle(() => this.slice(this._data), 50);

        if (this._needsSlice) {
            this._slicer(this._data);
            this._needsSlice = false;
        }
    }

    /**
     * 
     */
    update() {
        this._controls.update();
        this._transformControls.update();
        this._checkPlaneDidChange()

        if (!this._cube)
            return;

        const clippingPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0).applyMatrix4(this._plane.matrix);
        cubeMaterial.uniforms.clippingPlane.value.set(
            clippingPlane.normal.x,
            clippingPlane.normal.y,
            clippingPlane.normal.z,
            -clippingPlane.constant);
        cubeMaterial.uniforms.clippingPlane.needsUpdate = true;
    }

    /**
     * Main render function.
     */
    render() {
        this._renderer.clear();
        this._renderer.render(this._scene, this._camera);
        this._renderer.clearDepth();
        this._renderer.render(this._uiScene, this._camera);
    }

    /**
     * See if the sample plane's dimensions have changed
     */
    _checkPlaneDidChange() {
        const oldPlaneWidth = this._planeWidth;
        const oldPlaneHeight = this._planeHeight;

        const width = INITIAL_PLANE_SIZE * 2 * this._plane.scale.x;
        const height = INITIAL_PLANE_SIZE * 2 * this._plane.scale.y;

        if (oldPlaneWidth !== width || oldPlaneHeight !== height) {
            this._delegate.onPlaneDidChange(width, height);
        }

        this._planeWidth = width;
        this._planeHeight = height;
    }
}