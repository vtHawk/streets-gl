import earcut from './earcut';
import OSMDescriptor from "./OSMDescriptor";
import {toRad, mercatorScaleFactor} from "./Utils";
import vec3 from "./math/vec3";

export default class Way {
	constructor(id, nodes, vertices, tags, pivot) {
		this.id = id;
		this.nodes = nodes;
		this.vertices = vertices;
		this.tags = tags || {};
		this.pivot = pivot;
		this.visible = true;
		this.mesh = {
			vertices: [],
			normals: [],
			colors: []
		};
		this.instances = {
			trees: []
		};

		this.heightFactor = mercatorScaleFactor(toRad(this.pivot.lat));

		this.descriptor = new OSMDescriptor(this.tags);
		this.properties = this.descriptor.properties;

		this.closed = this.isClosed();
		if(this.closed) this.fixDirection();
	}

	render() {
		if(this.visible) {
			if(this.closed && this.properties.type === 'building') {
				this.triangulateFootprint(false);
				this.triangulateWalls();
			}

			if(this.properties.type === 'tree_row') {
				this.length = this.calculateLength();
				let points = this.distributeNodes(10);
				this.instances.trees.push(...points);
			}

			if(this.properties.type === 'farmland') {
				this.triangulateFootprint(true);
			}
		}
	}

	triangulateFootprint(isFlat) {
		let flattenVertices = this.flatten();
		let triangles = earcut(flattenVertices).reverse();
		let height, color;

		if(isFlat) {
			height = 0;
			color = [63, 167, 37];
		} else {
			height = this.properties.height || 10;
			height *= this.heightFactor;
			color = this.properties.roofColor || [0, 0, 0];
		}

		for(let i = 0; i < triangles.length; i++) {
			this.mesh.vertices.push(flattenVertices[triangles[i] * 2], height, flattenVertices[triangles[i] * 2 + 1]);
			this.mesh.normals.push(0, 1, 0);
			this.mesh.colors.push(...color);
		}
	}

	triangulateWalls() {
		let facadeColor = this.properties.facadeColor || [0, 0, 0];

		let height = this.properties.height || 10;
		let minHeight = this.properties.minHeight || 0;

		if(minHeight > height) minHeight = 0;

		height *= this.heightFactor;
		minHeight *= this.heightFactor;

		for(let i = 0; i < this.vertices.length; i++) {
			let vertex = this.vertices[i];
			let nextVertex = this.vertices[i + 1] || this.vertices[0];

			this.mesh.vertices.push(nextVertex.x, minHeight, nextVertex.z);
			this.mesh.vertices.push(vertex.x, height, vertex.z);
			this.mesh.vertices.push(vertex.x, minHeight, vertex.z);

			const normal = this.calculateNormal(
				new vec3(nextVertex.x, minHeight, nextVertex.z),
				new vec3(vertex.x, height, vertex.z),
				new vec3(vertex.x, minHeight, vertex.z)
			);

			this.mesh.vertices.push(nextVertex.x, minHeight, nextVertex.z);
			this.mesh.vertices.push(nextVertex.x, height, nextVertex.z);
			this.mesh.vertices.push(vertex.x, height, vertex.z);

			for(let j = 0; j < 6; j++) {
				this.mesh.normals.push(normal.x, normal.y, normal.z);
				this.mesh.colors.push(...facadeColor);
			}
		}
	}

	flatten() {
		let result = [];

		for(let i = 0; i < this.vertices.length; i++) {
			result.push(this.vertices[i].x, this.vertices[i].z);
		}

		return result;
	}

	isClosed() {
		return this.nodes[0] === this.nodes[this.nodes.length - 1];
	}

	isClockwise() {
		let sum = 0;

		for(let i = 0; i < this.nodes.length; i++) {
			let point1 = this.vertices[i];
			let point2 = this.vertices[i+1] || this.vertices[0];
			sum += (point2.x - point1.x) * (point2.z + point1.z);
		}

		return sum > 0
	}

	fixDirection() {
		const clockwise = this.isClockwise();

		if(!clockwise) {
			this.nodes.reverse();
			this.vertices.reverse();
		}
	}

	calculateLength() {
		let length = 0;

		for(let i = 0; i < this.vertices.length - 1; i++) {
			let point1 = this.vertices[i];
			let point2 = this.vertices[i + 1];
			length += Math.sqrt((point2.x - point1.x) ** 2 + (point2.z - point1.z) ** 2);
		}

		return length;
	}

	distributeNodes(interval) {
		let number = Math.floor(this.length / interval);
		let points = [];

		if(number > 1) {
			let distance = this.length / (number - 1);
			let targetNode = 0;
			let availableDistance = 0;
			let edge = [];
			let edgeLength = 0;
			let cProgress = 0;
			let nodeProgress = 0;

			points.push(this.vertices[0].x, this.vertices[0].z);

			for(let i = 0; i < number - 1; i++) {
				while(availableDistance < distance && targetNode < this.vertices.length - 1) {
					edge = [
						this.vertices[targetNode],
						this.vertices[targetNode + 1]
					];

					edgeLength = Math.sqrt((edge[1].x - edge[0].x) ** 2 + (edge[1].z - edge[0].z) ** 2);
					availableDistance += edgeLength;
					nodeProgress += edgeLength;

					targetNode++;
				}

				availableDistance -= distance;
				cProgress += distance;

				let vLength = (nodeProgress - cProgress) / edgeLength;

				let vector = {
					x: edge[1].x - edge[0].x,
					z: edge[1].z - edge[0].z
				};
				let point = {
					x: edge[1].x - vector.x * vLength,
					z: edge[1].z - vector.z * vLength
				};

				points.push(point.x, point.z);
			}
		}

		return points;
	}

	calculateNormal(vA, vB, vC) {
		let cb = vec3.sub(vC, vB);
		let ab = vec3.sub(vA, vB);
		cb = vec3.cross(cb, ab);
		return vec3.normalize(cb);
	}
}