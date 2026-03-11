import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, Input } from '@angular/core';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ThreeDimensionalData } from '../common-models/common-models';

@Component({
  selector: 'app-scatter-plot-three-dimensions',
  standalone: true,
  templateUrl: './scatter-plot-three-dimensions.component.html',
  styleUrls: ['./scatter-plot-three-dimensions.component.css']
})
export class ScatterPlotThreeDimensionsComponent implements AfterViewInit, OnDestroy {
  @ViewChild('container') canvasRef!: ElementRef;
  @Input() public data!: ThreeDimensionalData[];

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: OrbitControls;
  private animationFrameId!: number;
  private get canvas():HTMLCanvasElement {
    return this.canvasRef?.nativeElement;
  }

  ngAfterViewInit() {
    this.initThreeJs();
    this.animate();
    window.addEventListener('resize', this.onWindowResize);
  }

  ngOnDestroy() {
    window.removeEventListener('resize', this.onWindowResize);
    cancelAnimationFrame(this.animationFrameId);
    this.controls.dispose();
    this.renderer.dispose();
  }

  private initThreeJs() {
    const container = this.canvasRef.nativeElement;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf0f0f0);

    // Camera
    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    this.camera.position.set(0, 30, 100);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({canvas: this.canvas });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    // Controls (rotate, zoom, pan)
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 100;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(10, 20, 10);
    this.scene.add(dirLight);

    // Spheres (points)
    const geometry = new THREE.SphereGeometry(0.4, 16, 16); // radius 0.4
    this.data.forEach(point => {
      const material = new THREE.MeshStandardMaterial({
        color: 'slategrey',
        metalness: 0.1,
        roughness: 0.5,
      });
      const sphere = new THREE.Mesh(geometry, material);
      sphere.position.set(point.x, point.y, point.z);
      this.scene.add(sphere);
    });

    // Optional: small axes helper
    const axesHelper = new THREE.AxesHelper(10);
    this.scene.add(axesHelper);

    // Optional: grid on XZ plane
    const gridHelper = new THREE.GridHelper(200, 200, 0x888888, 0xcccccc);
    this.scene.add(gridHelper);
  }

  private animate = () => {
    this.animationFrameId = requestAnimationFrame(this.animate);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };

  private onWindowResize = () => {
    const container = this.canvasRef.nativeElement;
    const width = container.clientWidth;
    const height = container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };
}