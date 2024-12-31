#version 100
precision mediump float;

varying vec3 v_color;
uniform float u_time;

void main(){
  vec3 rolledColor = fract(v_color + vec3(u_time));
  gl_FragColor = vec4(rolledColor, 1.0);
}
