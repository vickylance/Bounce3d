import {
  Scene,
  Engine,
  Vector3,
  Mesh,
  MeshBuilder,
  ArcRotateCamera,
  HemisphericLight,
  DirectionalLight,
  ShadowGenerator,
  StandardMaterial,
  Color3
} from "./babylonjs";

class Game {
  constructor(elementId) {
    // Get the canvas DOM element
    this.canvas = document.getElementById(elementId);
    // Load the 3D engine
    this.engine = new Engine(this.canvas, true, {
      preserveDrawingBuffer: true,
      stencil: true
    });
    // the canvas/window resize event handler
    window.addEventListener("resize", () => {
      this.engine.resize();
    });
  }

  createScene() {
    // Create a basic BJS Scene object
    this.scene = new Scene(this.engine);
    // Create a ArcRotateCamera, and set its position to {x: 0, y: 5, z: -10}
    this.camera = new ArcRotateCamera(
      "mainCamera",
      Math.PI / 2,
      Math.PI / 3,
      25,
      new Vector3(0, 5, -10),
      this.scene
    );
    // Target the camera to scene origin
    this.camera.setTarget(Vector3.Zero());
    // Attach the camera to the canvas
    this.camera.attachControl(this.canvas, false);

    this.setupLighting();

    // Create a built-in "sphere" shape; its constructor takes 6 params: name, segment, diameter, scene, updatable, sideOrientation
    var sphere = Mesh.CreateSphere(
      "sphere1",
      16,
      2,
      this.scene,
      false,
      Mesh.FRONTSIDE
    );
    // Move the sphere upward 1/2 of its height
    sphere.position.y = 2;
    // Create a built-in "ground" shape; its constructor takes 6 params : name, width, height, subdivision, scene, updatable
    var ground = Mesh.CreateGround("ground1", 64, 64, 2, this.scene, false);

    // add objects to cast shadow
    this.shadowGenerator.addShadowCaster(sphere);

    // setup objects to receive shadow
    ground.receiveShadows = true;

    return this.render();
  }

  setupLighting() {
    // Create a basic ambient bidirectional light, aiming 0, 1, 0 - meaning, to the sky
    this.hemiLight = new HemisphericLight("hemiLight", new Vector3(0, 1, 0), this.scene);
    this.hemiLight.intensity = 0.2;

    // Create a basic directional light
    this.dirLight = new DirectionalLight("dirLight", new Vector3(0, -1, -1), this.scene);
    this.dirLight.position = new Vector3(0, 10, 0);
    this.dirLight.intensity = 0.5;

    // Create an emmisive texture sphere in the location of the directional light
    this.dirLightSphere = Mesh.CreateSphere("sphere", 10, 2, this.scene);
    this.dirLightSphere.position = this.dirLight.position;
    this.dirLightSphere.material = new StandardMaterial("light", this.scene);
    this.dirLightSphere.material.emissiveColor = new Color3(1, 1, 0);

    // create shadows generator
    this.shadowGenerator = new ShadowGenerator(1024, this.dirLight);
    this.shadowGenerator.useExponentialShadowMap = true;
  }

  render() {
    // renders the scene 60 fps.
    this.engine.runRenderLoop(() => {
      this.scene.render();
    });
    // Return the created scene
    return this.scene;
  }
}

export default Game;