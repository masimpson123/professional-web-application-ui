import { Component, ViewChild, ElementRef, Input, AfterViewInit, HostListener, NgZone, OnDestroy, inject } from '@angular/core';
import * as THREE from "three";
import { DemoHeaderComponent } from '../demo-header/demo-header.component';

@Component({
  selector: 'app-cube',
  imports: [DemoHeaderComponent],
  templateUrl: './cube.component.html',
  styleUrl: './cube.component.css',
  standalone: true
})
export class CubeComponent implements AfterViewInit, OnDestroy {

  @ViewChild('canvas') private canvasRef: ElementRef|null = null;

  @Input() public rotationSpeedX: number = 0.05;
  @Input() public rotationSpeedY: number = 0.01;
  @Input() public size: number = 200;

  @Input() public fieldOfView: number = 1;
  @Input('nearClipping') public nearClippingPlane: number = 1;
  @Input('farClipping') public farClippingPlane: number = 1000;

  desiredRotationX = 3.7699;
  cameraZ = 250;

  // Match --slate, --signal, and --paper in styles.css.
  private readonly FACE_COLOR = 0x5E7A8A;
  private readonly HIGHLIGHT_COLOR = 0xD2401E;
  private readonly BACKGROUND = 0xF4F6F7;

  private camera!: THREE.PerspectiveCamera;
  private get canvas():HTMLCanvasElement {
    return this.canvasRef?.nativeElement;
  }
  private geometry = new THREE.BoxGeometry(1,1,1).toNonIndexed();
  // One material per face, so each face can be highlighted on its own.
  private materials = Array.from({ length: 6 }, () => new THREE.MeshPhongMaterial({ color: this.FACE_COLOR }));
  private cube: THREE.Mesh = new THREE.Mesh(this.geometry, this.materials);
  private wireframe = new THREE.WireframeGeometry( this.geometry );
  private lines = new THREE.LineSegments(this.wireframe, new THREE.LineBasicMaterial( { color: 0xffffff, linewidth: 100, linecap: 'round', linejoin:  'round' } ) );
  private light = new THREE.DirectionalLight(0xFFFFFF, 1);
  private fillLight = new THREE.AmbientLight(0xFFFFFF, .4);
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private frame = 0;
  private readonly zone = inject(NgZone);

  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private mouseCoordinates: number[];
  private highlightedObject: any;

  @HostListener('document:mousemove', ['$event'])
  move(event:MouseEvent) {
    if (!this.canvasRef) return;
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    this.mouseCoordinates = [x,y];
  }

  // The canvas is sized by CSS, so keep the drawing buffer and camera in step with it.
  @HostListener('window:resize')
  resize() {
    if (!this.renderer) return;
    this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight, false);
    this.camera.aspect = this.getAspectRatio();
    this.camera.updateProjectionMatrix();
  }

  constructor() {
    this.lines.material.linewidth = 100;
    this.mouse = new THREE.Vector2();
    this.raycaster = new THREE.Raycaster();
    this.mouseCoordinates = [0,0];
  }

  ngAfterViewInit(): void {
    this.createScene();
    this.startRenderingLoop();
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.frame);
    this.renderer?.dispose();
    this.geometry.dispose();
    this.wireframe.dispose();
    this.materials.forEach(material => material.dispose());
    this.lines.material.dispose();
  }

  private highlight(coordinates: number[]) {
    this.mouse.x = (coordinates[0] / this.canvas.clientWidth) * 2 - 1;
    this.mouse.y = -(coordinates[1] / this.canvas.clientHeight) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.scene.children);
    let faceIndex: number|undefined = undefined;
    if (intersects.length) {
      const intersection = intersects[0];
      faceIndex = intersection.face?.materialIndex;
      this.highlightedObject = intersection.object as any;
    }
    if (this.highlightedObject) {
      this.highlightedObject.material.forEach((value: any, index: number) => {
        value.color.set((index === faceIndex) ? this.HIGHLIGHT_COLOR : this.FACE_COLOR);
        value.colorsNeedUpdate = true;
      });
    }
    if (!intersects.length) {
      this.highlightedObject = null;
    }
  }

  private createScene() {
    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(this.BACKGROUND);
    this.scene.add(this.cube);
    // this.scene.add(this.lines);
    this.light.position.set(2,2,2);
    this.scene.add(this.light);
    this.scene.add(this.fillLight);
    // Camera
    const aspectRatio = this.getAspectRatio();
    this.camera = new THREE.PerspectiveCamera(
      this.fieldOfView,
      aspectRatio,
      this.nearClippingPlane,
      this.farClippingPlane
    );
    this.camera.position.z = this.cameraZ;
  }

  private getAspectRatio() {
    return this.canvas.clientWidth / this.canvas.clientHeight;
  }

  private animateCube() {
    this.cube.rotation.x = this.desiredRotationX;
    this.cube.rotation.y += this.rotationSpeedY;
    this.lines.rotation.x = this.desiredRotationX;
    this.lines.rotation.y += this.rotationSpeedY;
    this.camera.position.z = this.cameraZ;
  }

  private startRenderingLoop() {
    this.renderer = new THREE.WebGLRenderer({canvas: this.canvas});
    this.renderer.setPixelRatio(devicePixelRatio);
    this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight, false);

    // Each frame only touches the canvas, so keep it out of Angular's change detection.
    const render = () => {
      this.frame = requestAnimationFrame(render);
      this.animateCube();
      this.renderer.render(this.scene, this.camera);
      this.highlight(this.mouseCoordinates);
    };
    this.zone.runOutsideAngular(render);
  }

  rotationUpdate(value: string|null) {
    this.desiredRotationX = (Number(value) ?? 0) / 50 * Math.PI;
  }

  zoomUpdate(value: string|null) {
    this.cameraZ = 400 - ((Number(value) ?? 0) * 2);
  }
}
