import { Component, ViewChild, ElementRef, Input, AfterViewInit, HostListener } from '@angular/core';
import * as THREE from "three";

@Component({
  selector: 'app-cube',
  imports: [],
  templateUrl: './cube.component.html',
  styleUrl: './cube.component.css',
  standalone: true
})
export class CubeComponent implements AfterViewInit {

  @ViewChild('canvas') private canvasRef: ElementRef|null = null;

  @Input() public rotationSpeedX: number = 0.05;
  @Input() public rotationSpeedY: number = 0.01;
  @Input() public size: number = 200;

  @Input() public fieldOfView: number = 1;
  @Input('nearClipping') public nearClippingPlane: number = 1;
  @Input('farClipping') public farClippingPlane: number = 1000;

  desiredRotationX = 3.7699;
  cameraZ = 250;

  private readonly MINT = 0x49796B;
  private readonly ORANGE = 0xFF7F50;

  private camera!: THREE.PerspectiveCamera;
  private get canvas():HTMLCanvasElement {
    return this.canvasRef?.nativeElement;
  }
  private geometry = new THREE.BoxGeometry(1,1,1).toNonIndexed();
  private material1 = new THREE.MeshPhongMaterial({
  color: this.MINT});
  private material2 = new THREE.MeshPhongMaterial({
  color: this.MINT});
  private material3 = new THREE.MeshPhongMaterial({
  color: this.MINT});
  private material4 = new THREE.MeshPhongMaterial({
  color: this.MINT});
  private material5 = new THREE.MeshPhongMaterial({
  color: this.MINT});
  private material6 = new THREE.MeshPhongMaterial({
  color: this.MINT});
  private cube: THREE.Mesh = new THREE.Mesh(this.geometry, [
    this.material1,
    this.material2,
    this.material3,
    this.material4,
    this.material5,
    this.material6]);
  private edges = new THREE.EdgesGeometry(this.geometry);
  private wireframe = new THREE.WireframeGeometry( this.geometry );
  private lines = new THREE.LineSegments(this.wireframe, new THREE.LineBasicMaterial( { color: 0xffffff, linewidth: 100, linecap: 'round', linejoin:  'round' } ) );
  private light = new THREE.DirectionalLight(0xFFFFFF, 1);
  private fillLight = new THREE.AmbientLight(0xFFFFFF, .4);
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;

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

  private highlight(coordinates: number[]) {
    this.mouse.x = (coordinates[0] / 800) * 2 - 1;
    this.mouse.y = -(coordinates[1] / 450) * 2 + 1;
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
        value.color.set((index === faceIndex) ? this.ORANGE : this.MINT);
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
    this.scene.background = new THREE.Color(0x708090);
    this.scene.add(this.cube);
    // this.scene.add(this.lines);
    this.light.position.set(2,2,2);
    this.scene.add(this.light);
    this.scene.add(this.fillLight);
    // Camera
    let aspectRatio = this.getAspectRatio();
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
    this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);

    let component: CubeComponent = this;
    (function render() {
      requestAnimationFrame(render);
      component.animateCube();
      component.renderer.render(component.scene, component.camera);
      component.highlight(component.mouseCoordinates);
    }());
  }

  rotationUpdate(value: string|null) {
    this.desiredRotationX = (Number(value) ?? 0) / 50 * Math.PI;
  }

  zoomUpdate(value: string|null) {
    this.cameraZ = 400 - ((Number(value) ?? 0) * 2);
  }
}
