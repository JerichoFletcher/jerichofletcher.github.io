#version 100
precision mediump float;

varying vec3 v_color;
varying vec2 v_uv;

uniform sampler2D u_texture;

void main(){
  vec4 texColor = texture2D(u_texture, v_uv);
  gl_FragColor = vec4(v_color, 1.0) * texColor;
}
