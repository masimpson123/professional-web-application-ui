import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DEMOS, DemoId, RESUME_URL, ServiceId } from '../demos';

interface ServiceNode {
  id: ServiceId;
  title: string;
  // Labels for incoming edges, one per row starting at the node's first row.
  ports: string[];
  x: number;
  y: number;
  height: number;
}

interface Edge {
  demo: DemoId;
  x1: number;
  x2: number;
  y: number;
}

// Diagram geometry, in viewBox units. Each demo is one row; edges are straight horizontal runs.
const ROW_TOP = 48;
const ROW_PITCH = 56;
const NODE_HEIGHT = 44;
const rowCenter = (row: number) => ROW_TOP + row * ROW_PITCH + NODE_HEIGHT / 2;

@Component({
  selector: 'app-root',
  imports: [RouterLink],
  templateUrl: './root.component.html',
  styleUrl: './root.component.css',
  standalone: true
})
export class RootComponent {
  readonly resumeUrl = RESUME_URL;
  readonly demos = DEMOS;
  readonly nodeHeight = NODE_HEIGHT;
  readonly rowTop = (row: number) => ROW_TOP + row * ROW_PITCH;
  readonly portY = (service: ServiceNode, index: number) => service.y + NODE_HEIGHT / 2 + index * ROW_PITCH + 5;

  readonly services: ServiceNode[] = [
    { id: 'express', title: 'Express + TensorFlow.js', ports: [], x: 516, y: this.rowTop(0), height: NODE_HEIGHT },
    {
      id: 'spring',
      title: 'Spring Boot service',
      ports: ['Gemini proxy', 'Streaming search', 'STOMP broker', 'Protected API', 'Zoom token signing'],
      x: 516,
      y: this.rowTop(1),
      height: 4 * ROW_PITCH + NODE_HEIGHT + 36,
    },
    { id: 'gemini', title: 'Gemini API', ports: [], x: 800, y: this.rowTop(1), height: NODE_HEIGHT },
    { id: 'identity', title: 'Identity Platform', ports: [], x: 800, y: this.rowTop(4), height: NODE_HEIGHT },
    { id: 'zoom', title: 'Zoom Video SDK', ports: [], x: 800, y: this.rowTop(5), height: NODE_HEIGHT },
  ];

  readonly edges: Edge[] = [
    ...DEMOS.flatMap((demo, row) => demo.calls.map(() => ({ demo: demo.id, x1: 356, x2: 516, y: rowCenter(row) }))),
    { demo: 'ai', x1: 724, x2: 800, y: rowCenter(1) },
    { demo: 'auth', x1: 724, x2: 800, y: rowCenter(4) },
    { demo: 'guidance', x1: 724, x2: 800, y: rowCenter(5) },
  ];

  readonly clientOnlyTop = this.rowTop(DEMOS.findIndex(demo => !demo.calls.length));
  readonly clientOnlyBottom = this.rowTop(DEMOS.length - 1) + NODE_HEIGHT;

  readonly active = signal<DemoId | null>(null);

  // Services a demo depends on, directly or through the Spring service.
  private readonly reach: Record<DemoId, ServiceId[]> = {
    'machine-learning': ['express'],
    ai: ['spring', 'gemini'],
    'data-stream': ['spring'],
    websocket: ['spring'],
    auth: ['spring', 'identity'],
    guidance: ['spring', 'zoom'],
    cube: [],
    form: [],
  };

  serviceLit(id: ServiceId) {
    const active = this.active();
    return !!active && this.reach[active].includes(id);
  }
}
