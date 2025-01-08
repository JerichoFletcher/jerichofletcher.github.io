#version 100
precision mediump float;

attribute vec3 a_position;
attribute vec3 a_color;

varying vec3 v_color;

uniform mat4 u_world;
uniform mat4 u_view;
uniform mat4 u_proj;

void main(){
  v_color = a_color;
  gl_Position = u_proj * u_view * u_world * vec4(a_position, 1.0);
}
