import * as CANNON from "cannon";
// import Cannon from 'cannon';
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
  FollowCamera,
  StandardMaterial,
  Color3,
  PhysicsImpostor,
  AmmoJSPlugin,
  CannonJSPlugin,
  OimoJSPlugin
} from "babylonjs";

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
    window.CANNON = CANNON;

    this.keyboard = {}
  }

  createScene() {
    // Create a basic BJS Scene object
    this.scene = new Scene(this.engine);

    this.setupCamera();
    this.setupLighting();
    this.setupPhysics();
    this.setupControls();

    // Create a built-in "sphere" shape; its constructor takes 6 params: name, segment, diameter, scene, updatable, sideOrientation
    var sphere = Mesh.CreateSphere(
      "sphere1",
      16,
      2,
      this.scene,
      false,
      Mesh.FRONTSIDE
    );
    var ballMaterial = new StandardMaterial("ground", this.scene);
    ballMaterial.diffuseColor = Color3.Red();
    sphere.material = ballMaterial;
    // Move the sphere upward 1/2 of its height
    sphere.position.y = 20;
    this.camera.lockedTarget = sphere;
    sphere.physicsImpostor = new PhysicsImpostor(
      sphere,
      PhysicsImpostor.SphereImpostor,
      { mass: 10, restitution: 0.3, friction: 300 },
      this.scene
    );
    // sphere.physicsImpostor.setLinearVelocity(new Vector3(1, 0, 1));

    // Move the ball
    this.scene.registerBeforeRender(() => {
      // move player.
      sphere.applyImpulse(this.direction, sphere.position);
      // sphere.physicsImpostor.setLinearVelocity(this.direction);
      // this.applyImpulse(this.direction, this.position);
    });
    let fn = () => {
      console.log("Something happened");
    }
    sphere.physicsImpostor.oncollide = function(e){
      console.log("Collide Evemnt: ", e)
    }
    // this.scene.beforeRender = () => {
    //   sphere.physicsImpostor.physicsBody.linearVelocity.scaleEqual(0.95);
    // };

    // Create a built-in "ground" shape; its constructor takes 6 params : name, width, height, subdivision, scene, updatable
    var ground = Mesh.CreateGround("ground", 64, 64, 2, this.scene, false);
    var groundMaterial = new StandardMaterial("ground", this.scene);
    groundMaterial.diffuseColor = Color3.Green();
    ground.material = groundMaterial;
    ground.physicsImpostor = new PhysicsImpostor(
      ground,
      PhysicsImpostor.BoxImpostor,
      { mass: 0, friction: 8, restitution: 0.7 },
      this.scene
    );
    ground.physicsImpostor.onCollide((e, body) => {
      console.log("Collide Evemnt: ", e, body)
    })

    sphere.physicsImpostor.registerOnPhysicsCollide(ground.physicsImpostor, fn);

    // add objects to cast shadow
    this.shadowGenerator.addShadowCaster(sphere);

    // setup objects to receive shadow
    ground.receiveShadows = true;

    return this.render();
  }

  setupCamera() {
    // Create a ArcRotateCamera, and set its position to {x: 0, y: 5, z: -10}
    this.camera = new ArcRotateCamera(
      "mainCamera",
      Math.PI / 2,
      Math.PI / 3,
      45,
      new Vector3(0, 5, -10),
      this.scene
    );

    // // Follow Cam
    // this.camera = new FollowCamera("FollowCam", new Vector3(0, 5, -10), this.scene);
    // this.camera.radius = 30;
    // this.camera.heightOffset = 10;
    // this.camera.rotationOffset = 0;
    // this.camera.cameraAcceleration = 0.5;
    // this.camera.maxCameraSpeed = 10;
    // this.camera.attachControl(this.canvas, true);

    // Target the camera to scene origin
    this.camera.setTarget(Vector3.Zero());
    // Attach the camera to the canvas
    this.camera.panningSensibility = 0; // disable camera panning
    // this.camera.angularSensibilityX = 10;

    this.scene.activeCamera = this.camera;
    this.scene.activeCamera.attachControl(this.canvas, false);
  }

  setupLighting() {
    // Create a basic ambient bidirectional light, aiming 0, 1, 0 - meaning, to the sky
    this.hemiLight = new HemisphericLight(
      "hemiLight",
      new Vector3(0, 1, 0),
      this.scene
    );
    this.hemiLight.intensity = 0.2;

    // Create a basic directional light
    this.dirLight = new DirectionalLight(
      "dirLight",
      new Vector3(0, -1, -1),
      this.scene
    );
    this.dirLight.position = new Vector3(0, 50, 50);
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

  setupPhysics() {
    // Direction and force of gravity
    this.gravityVector = new Vector3(0, -90, 0);
    // Use Ammo physics plugin, set a small fixed timestep as the colliders on the gltf are thin causing missed collisions if spheres are moving to quickly
    // this.physicsPlugin = new AmmoJSPlugin(true, Ammo);
    this.physicsPlugin = new CannonJSPlugin(true);
    // this.physicsPlugin.setMaxSteps(10);
    // this.physicsPlugin.setFixedTimeStep(1/(240));
    this.scene.enablePhysics(this.gravityVector, this.physicsPlugin);
  }

  setupControls() {
    // Get keyboard Inputs
    this.keyboard.rightPressed = false;
    this.keyboard.leftPressed = false;
    this.keyboard.upPressed = false;
    this.keyboard.downPressed = false;
  
    this.direction = Vector3.Zero();
    this.speed = 2;
    // user input
    window.addEventListener("keydown", event => {
      let { code } = event;

      // Forward and Backward controls
      if (code ==='ArrowUp' || code === 'KeyW') {
        this.direction.z = -1 * this.speed;
        this.keyboard.upPressed = true;
        console.log('up', this.keyboard);
      } else if (code === 'ArrowDown' || code === 'KeyS') {
        this.direction.z = 1 * this.speed;
        this.keyboard.downPressed = true;
        console.log('down', this.keyboard);
      }

      // Left and Right controls
      if (code === 'ArrowLeft' || code === 'KeyA') {
        this.direction.x = 1 * this.speed;
        this.keyboard.leftPressed = true;
        console.log('left', this.keyboard);
      } else if (code === 'ArrowRight' || code === 'KeyD') {
        this.direction.x = -1 * this.speed;
        this.keyboard.rightPressed = true;
        console.log('right', this.keyboard);
      }

      // Jump control
      if (code === 'Space') {
        this.keyboard.jump = true;
      }
    });

    window.addEventListener("keyup", event => {
      let { code } = event;

      // Forward and Backward controls
      if (code ==='ArrowUp' || code === 'KeyW') {
        this.direction.z = 0;
        this.keyboard.upPressed = false;
        console.log('up', this.keyboard);
      } else if (code === 'ArrowDown' || code === 'KeyS') {
        this.direction.z = 0;
        this.keyboard.downPressed = false;
        console.log('down', this.keyboard);
      }

      // Left and Right controls
      if (code === 'ArrowLeft' || code === 'KeyA') {
        this.direction.x = 0;
        this.keyboard.leftPressed = false;
        console.log('left', this.keyboard);
      } else if (code === 'ArrowRight' || code === 'KeyD') {
        this.direction.x = 0;
        this.keyboard.rightPressed = false;
        console.log('right', this.keyboard);
      }

      // Jump control
      if (code === 'Space') {
        this.keyboard.jump = false;
      }
    });
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
