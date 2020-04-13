#version 300 es
precision highp float;
layout(location = 0) out vec4 outColor;
layout(location = 1) out vec3 outNormal;
layout(location = 2) out vec3 outPosition;
layout(location = 3) out vec4 outMetallicRoughness;
layout(location = 4) out vec4 outEmission;
in vec2 vUv;
in vec3 vNormal;
in vec3 vPosition;

uniform sampler2D tDiffuse;
uniform sampler2D tNormal;

vec3 tbn(vec3 mapValue) {
    vec2 uv = gl_FrontFacing ? vUv : -vUv;

    vec3 pos_dx = dFdx(vPosition);
    vec3 pos_dy = dFdy(vPosition);
    vec3 tex_dx = dFdx(vec3(uv, 0.0));
    vec3 tex_dy = dFdy(vec3(uv, 0.0));
    vec3 t = (tex_dy.t * pos_dx - tex_dx.t * pos_dy) / (tex_dx.s * tex_dy.t - tex_dy.s * tex_dx.t);

    vec3 ng = normalize(vNormal);

    t = normalize(t - ng * dot(ng, t));
    vec3 b = normalize(cross(ng, t));
    mat3 tbn = mat3(t, b, ng);

    vec3 normal = normalize(tbn * mapValue);

    normal *= float(gl_FrontFacing) * 2.0 - 1.0;

    return normal;
}

void main() {
    vec3 normal = tbn(texture(tNormal, vUv * 32.).xyz * 2. - 1.);
    normal.y *= 2.5;
    normal = normalize(normal);

    outColor = texture(tDiffuse, vUv * 8. * 64.);
    outNormal = normal * 0.5 + 0.5;
    outPosition = vPosition;
    outMetallicRoughness = vec4(0, 1., 0, 1.);
    outEmission = vec4(0, 0, 0, 1.);
}
