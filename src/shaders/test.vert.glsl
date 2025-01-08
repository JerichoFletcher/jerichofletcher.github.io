#version 100
precision mediump float;

attribute vec3 a_position;
attribute vec3 a_color;
attribute vec2 a_uv;

varying vec3 v_color;
varying vec2 v_uv;

uniform mat4 u_world;
uniform mat4 u_view;
uniform mat4 u_proj;

void main(){
  v_color = a_color;
  v_uv = a_uv;
  gl_Position = u_proj * u_view * u_world * vec4(a_position, 1.0);
}
