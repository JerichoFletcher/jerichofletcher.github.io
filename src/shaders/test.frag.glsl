#version 100
precision mediump float;

varying vec3 v_color;
uniform float u_time;

float map(float value, float inMin, float inMax, float outMin, float outMax) {
    return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}

void main(){
  vec3 fragColor = v_color * map(sin(u_time * 4.0), -1.0, 1.0, 0.5, 1.0);
  gl_FragColor = vec4(fragColor, 1.0);
}
