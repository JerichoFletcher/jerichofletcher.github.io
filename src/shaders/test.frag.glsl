#version 100
precision mediump float;

varying vec3 v_color;

uniform float u_time;

const float th3 = 1.0 / 3.0;
const float sq3 = sqrt(th3);

float map(float value, float inMin, float inMax, float outMin, float outMax){
  return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}

vec3 color_shift(vec3 color, float angle){
  float cosA = cos(angle);
  float sinA = sin(angle);

  mat3 m = mat3(
    cosA + th3 * (1.0 - cosA), th3 * (1.0 - cosA) - sq3 * sinA, th3 * (1.0 - cosA) + sq3 * sinA,
    th3 * (1.0 - cosA) + sq3 * sinA, cosA + th3 * (1.0 - cosA), th3 * (1.0 - cosA) - sq3 * sinA,
    th3 * (1.0 - cosA) - sq3 * sinA, th3 * (1.0 - cosA) + sq3 * sinA, cosA + th3 * (1.0 - cosA)
  );

  return clamp(m * color, vec3(0.0), vec3(1.0));
}

void main(){
  float shiftAngle = u_time * -3.0;
  gl_FragColor = vec4(color_shift(v_color, shiftAngle), 1.0);
}
