#version 300 es
precision highp float;
layout(location = 0) out vec4 outColor;
layout(location = 1) out vec3 outNormal;
layout(location = 2) out vec3 outPosition;
layout(location = 3) out vec4 outMetallicRoughness;
in vec2 vUv;
in vec3 vNormal;
in vec3 vPosition;

uniform sampler2D sampleTexture;

void main() {
    outColor = texture(sampleTexture, vUv * 8. * 64.);
    outNormal = vNormal * 0.5 + 0.5;
    outPosition = vPosition;
    outMetallicRoughness = vec4(0, 1., 0, 1.);
}
