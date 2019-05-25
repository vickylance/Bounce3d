import * as CANNON from "cannon";
import {
  Scene,
  Engine,
  AssetsManager,
  Vector3,
  Mesh,
  Tools,
  ArcRotateCamera,
  HemisphericLight,
  DirectionalLight,
  ShadowGenerator,
  StandardMaterial,
  Color3,
  PhysicsImpostor,
  CannonJSPlugin,
} from "@babylonjs/core";
// import '../scss/main.scss';

// class MyLoadingScreen {
//   //optional, but needed due to interface definitions
//   constructor(loadingUIText) {
//     this.loadingUIText = loadingUIText;
//     this.loadingUIBackgroundColor = "#33333";
//     console.log("construc")
//   }
//   displayLoadingUI() {
//     alert(this.loadingUIText);
//     console.log("display loading")
//   }

//   hideLoadingUI() {
//     alert("Loaded!");
//   }
// }
function MyLoadingScreen( /* variables needed, for example:*/ text: string) {
  //init the loader
  this.loadingUIText = text;
  console.log("yolo");
}
MyLoadingScreen.prototype.displayLoadingUI = function() {
  console.log("yolo1");
  alert(this.loadingUIText);
};
MyLoadingScreen.prototype.hideLoadingUI = function() {
  console.log("yolo2");
  alert("Loaded!");
};

interface Keyboard {
  jump: boolean,
  upPressed: boolean,
  downPressed: boolean,
  rightPressed: boolean,
  leftPressed: boolean,
}

class Game {
  private canvas: HTMLCanvasElement;
  private engine: Engine;
  private scene: Scene;
  private assetsManager: AssetsManager;
  private camera: ArcRotateCamera;
  private keyboard: Keyboard;
  private dirLight: DirectionalLight;
  private shadowGenerator: ShadowGenerator;
  private speed: number;
  private direction: Vector3;
  private gravityVector: Vector3;
  private dirLightSphere: Mesh;
  private physicsPlugin: CannonJSPlugin;
  private hemiLight: HemisphericLight;

  constructor(elementId: string) {
    // Get the canvas DOM element
    this.canvas = document.getElementById(elementId) as HTMLCanvasElement;
    // Load the 3D engine
    this.engine = new Engine(this.canvas, true, {
      preserveDrawingBuffer: true,
      stencil: true
    });
    // this.loadingScreen = new MyLoadingScreen("I'm loading!!");
    // //Set the loading screen in the engine to replace the default one
    // this.engine.loadingScreen = this.loadingScreen;
    // the canvas/window resize event handler
    window.addEventListener("resize", () => {
      this.engine.resize();
    });
    window.CANNON = CANNON;
    // SceneLoader.Load("", './assets/models/skull.babylon', this.engine, () => {console.log("Completed")});

    // SceneLoader.ImportMesh("", SKULL.default, "main", this.scene, (meshes) => {console.log("success", meshes)}, () => {}, (scene, msg,exp) => {console.log("MSG: ", msg, "EXP: ", exp)});
    // SceneLoader.Load("", SKULL.default, this.engine, () => {console.log("Completed")});
    // console.log("SKULL Mesh: ", SKULL)
    // SKULL.position = Vector3.Zero();
    // var meshTask = this.assetsManager.addMeshTask("skull task", "", "../assets/models", SKULL);
    // meshTask.onSuccess = (task) => {
    //   task.loadedMeshes[0].position = Vector3.Zero();
    // }	
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

    let collisionDetection = () => {
      console.log("Collision happened");
      sphere.canJump = true;
    }
    sphere.physicsImpostor.onCollide = function(e: any){
      console.log("Collide Event: ", e, e.body)
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
    ground.physicsImpostor.onCollide = function(e: any) {
      console.log("Collide Event: ", e, e.body)
    }

    sphere.physicsImpostor.registerOnPhysicsCollide(ground.physicsImpostor, collisionDetection);

    // add objects to cast shadow
    this.shadowGenerator.addShadowCaster(sphere);

    // setup objects to receive shadow
    ground.receiveShadows = true;

    // Move the ball
    this.scene.registerBeforeRender(() => {
      // move player.
      let impulseDirection = this.camera.getDirection(this.direction); // Rotate the direction into the camera's local space
      impulseDirection.y = 0; // Discard the y component
      impulseDirection.normalize(); // Make it of length 1 again
      sphere.applyImpulse(impulseDirection.scale(this.speed), sphere.position);
      // make the player jump
      if (this.keyboard.jump && sphere.canJump) {
        console.log("jump")
        sphere.applyImpulse(new Vector3(0, 200, 0), sphere.position);
        this.keyboard.jump = false;
        sphere.canJump = false;
      }
      // console.log(this.camera.getFrontPosition(1));
      // console.log(this.camera.getDirection(new Vector3(0, sphere.position.y, 0)));
      
      // sphere.physicsImpostor.setLinearVelocity(this.direction);
      // this.applyImpulse(this.direction, this.position);
    });


    this.assetsManager = new AssetsManager(this.scene);
    
    var meshTask = this.assetsManager.addMeshTask("skull task", "", "./models/", "skull.babylon");

    meshTask.onSuccess = function (task) {
      task.loadedMeshes[0].position = Vector3.Zero();
    }
    return this.render();
  }

  setupCamera() {
    // Create a ArcRotateCamera, and set its position to {x: 0, y: 5, z: -10}
    this.camera = new ArcRotateCamera(
      "mainCamera",
      Tools.ToRadians(90),
      Tools.ToRadians(60),
      70,
      new Vector3(0, 5, -10),
      this.scene
    );
    this.camera.lowerRadiusLimit = 5;
    this.camera.upperRadiusLimit = 70;
    this.camera.lowerBetaLimit = Math.PI/10;
    this.camera.upperBetaLimit = Math.PI/2;
    // Let's remove default keyboard:
    this.camera.inputs.removeByType("ArcRotateCameraKeyboardMoveInput");

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
    this.dirLight.position = new Vector3(0, 30, 30);
    this.dirLight.intensity = 0.5;

    // Create an emmisive texture sphere in the location of the directional light
    this.dirLightSphere = Mesh.CreateSphere("sphere", 10, 2, this.scene);
    this.dirLightSphere.position = this.dirLight.position;
    this.dirLightSphere.material = new StandardMaterial("light", this.scene);
    this.dirLightSphere.material.emissiveColor = new Color3(1, 1, 0);

    // create shadows generator
    this.shadowGenerator = new ShadowGenerator(1024, this.dirLight);
    this.shadowGenerator.usePoissonSampling = true;
    this.shadowGenerator.useExponentialShadowMap = true;

    // create fog
    this.scene.fogMode = Scene.FOGMODE_EXP2;
    this.scene.fogColor = new Color3(0, 0, 0.1);
    this.scene.fogStart = 20.0;
    this.scene.fogEnd = 78.0;
    this.scene.fogDensity = 0.01;

    // lens flare
    // var lensFlareSystem = new LensFlareSystem("lensFlareSystem", light0, scene);
    // var flare00 = new LensFlare(0.2, 0, new Color3(1, 1, 1), "Assets/lens5.png", lensFlareSystem);
    // var flare01 = new LensFlare(0.5, 0.2, new Color3(0.5, 0.5, 1), "Assets/lens4.png", lensFlareSystem);
    // var flare02 = new LensFlare(0.2, 1.0, new Color3(1, 1, 1), "Assets/lens4.png", lensFlareSystem);
    // var flare03 = new LensFlare(0.4, 0.4, new Color3(1, 0.5, 1), "Assets/Flare.png", lensFlareSystem);
    // var flare04 = new LensFlare(0.1, 0.6, new Color3(1, 1, 1), "Assets/lens5.png", lensFlareSystem);
    // var flare05 = new LensFlare(0.3, 0.8, new Color3(1, 1, 1), "Assets/lens4.png", lensFlareSystem);
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
    this.keyboard = {
      upPressed: false,
      downPressed: false,
      leftPressed: false,
      rightPressed: false,
      jump: false,
    }
  
    this.direction = Vector3.Zero();
    this.camera.direction = this.camera.getFrontPosition(1).subtract(this.camera.position).normalize();
    this.speed = -7;

    // user input
    window.addEventListener("keydown", event => {
      let { code } = event;

      // Forward and Backward controls
      if (code ==='ArrowUp' || code === 'KeyW') {
        this.direction.z = -1;
        this.keyboard.upPressed = true;
        // console.log('up', this.keyboard);
      } else if (code === 'ArrowDown' || code === 'KeyS') {
        this.direction.z = 1;
        this.keyboard.downPressed = true;
        // console.log('down', this.keyboard);
      }

      // Left and Right controls
      if (code === 'ArrowLeft' || code === 'KeyA') {
        this.direction.x = 1;
        this.keyboard.leftPressed = true;
        // console.log('left', this.keyboard);
      } else if (code === 'ArrowRight' || code === 'KeyD') {
        this.direction.x = -1;
        this.keyboard.rightPressed = true;
        // console.log('right', this.keyboard);
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
        // console.log('up', this.keyboard);
      } else if (code === 'ArrowDown' || code === 'KeyS') {
        this.direction.z = 0;
        this.keyboard.downPressed = false;
        // console.log('down', this.keyboard);
      }

      // Left and Right controls
      if (code === 'ArrowLeft' || code === 'KeyA') {
        this.direction.x = 0;
        this.keyboard.leftPressed = false;
        // console.log('left', this.keyboard);
      } else if (code === 'ArrowRight' || code === 'KeyD') {
        this.direction.x = 0;
        this.keyboard.rightPressed = false;
        // console.log('right', this.keyboard);
      }

      // Jump control
      if (code === 'Space') {
        this.keyboard.jump = false;
      }
    });
  }

  render() {
    this.assetsManager.onFinish = (tasks) => {
      // renders the scene 60 fps
      this.engine.runRenderLoop(() => {
        this.scene.render();
      });
    };
    this.assetsManager.load();
  }
}

export default Game;
