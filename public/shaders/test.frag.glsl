#version 100
precision mediump float;

varying vec3 v_color;
uniform float u_time;

void main(){
  vec3 rolledColor = mod(v_color + vec3(u_time), 1.0);
  gl_FragColor = vec4(rolledColor, 1.0);
}
