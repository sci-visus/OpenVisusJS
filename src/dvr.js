/*
 * Copyright (c) 2017 University of Utah 
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice,
 *    this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 * 3. Neither the name of the copyright holder nor the names of its
 *    contributors may be used to endorse or promote products derived from
 *    this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */
 
'use strict'


const vert_src = `
#version 300 es

layout (location = 0) in vec4 pos;
layout (std140) uniform Matrices {
        mat4 model;
        mat4 view;
        mat4 projection;
} matrices;

out vec3 v_pos;
out vec3 v_world_pos;
out vec4 v_color;
out vec3 eye;
out mat4 to_world;
out mat3 to_worldn;

void
main(void)
{
        /* TODO: precompute inverse */
        to_world = matrices.view*matrices.model;
        mat4 inv = inverse(to_world);
        to_worldn = transpose(mat3(inv));
        eye = (inv*vec4(0.0, 0.0, 0.0, 1.0)).xyz;
        v_color = pos;
        vec4 position = pos;
        v_pos = position.xyz;
        v_world_pos = (matrices.view*matrices.model*position).xyz;
        gl_Position = matrices.projection*matrices.view*matrices.model*position;
}
`




const frag_src = `
#version 300 es

#define ISOSURFACE 0
#define DVR 1
#define METHOD DVR //ISOSURFACE

#define NORMAL 0
#define BLINN_PHONG 1
#define SHADING BLINN_PHONG

precision highp float;

uniform highp sampler3D volume_sampler;
uniform highp sampler2D colormap_sampler;

uniform float isovalue;

in vec3 v_pos;
in vec3 v_world_pos;
in vec4 v_color;
in vec3 eye;
in mat4 to_world;
in mat3 to_worldn;

uniform float extent1;
uniform float extent2;

layout (location = 0) out vec4 color;


/* central difference */
vec3
gradient(in sampler3D s, vec3 p, float dt)
{
        vec2 e = vec2(dt, 0.0);

        return vec3(texture(s, p - e.xyy).r - texture(s, p + e.xyy).r,
                    texture(s, p - e.yxy).r - texture(s, p + e.yxy).r,
                    texture(s, p - e.yyx).r - texture(s, p + e.yyx).r);
}


void
main(void)
{
        vec3 light_pos = vec3(1.0, 1.0, 1.0);
        vec3 d = normalize(v_pos - eye);

        /* intersect aabb */
        vec3 near = min(-eye/d, (vec3(1.0) - eye)/d);
        //vec3 near_dt = min((1.0/256.0-eye)/d, (vec3(1.0) - eye)/d);
        vec3 far = max(-eye/d, (vec3(1.0) - eye)/d);

        float tnear = max(near.x, max(near.y, near.z));
        //float tnear_dt = max(near_dt.x, max(near_dt.y, near_dt.z));
        float tfar  = min(far.x, min(far.y, far.z));

        ivec3 size = textureSize(volume_sampler, 0);
        /* TODO: step in correct dts along x, y, and z */
        //vec3 dts = vec3(size)*abs(d);
        //float dt = 1.0/float(max(dts.x, max(dts.y, dts.z)));
        float dt = 1.0/float(max(size.x, max(size.y, size.z)));

        color = vec4(0.0, 0.0, 0.0, 0.0);

        for (float t = tnear; t <= tfar; t += dt) {
                vec3 p = eye + t*d;
                float value = texture(volume_sampler, p).r;
#if (METHOD == ISOSURFACE)
                if (value > isovalue) {
                        color = texture(colormap_sampler, vec2(value, 0.0));

                        /* linear approximation of intersection point */
                        vec3 prev_p = p - dt*d;
                        float prev_value = texture(volume_sampler, prev_p).r;
                        float a = (isovalue - prev_value)/(value - prev_value);
                        vec3 inter_p = (1.0 - a)*(p - dt*d) + a*p;
                        /* TODO: sample at different dt for each axis to avoid having undo scaling */
                        vec3 nn = gradient(volume_sampler, inter_p, dt);
#if (SHADING == NORMAL)
                        color = vec4(n, 1.0);
#elif (SHADING == BLINN_PHONG)
                        /* TODO: can we optimize somehow? */
                        vec3 world_p = (to_world*vec4(inter_p, 1.0)).xyz;
                        vec3 n = normalize(to_worldn*nn);
                        vec3 light_dir = normalize(light_pos - world_p);
                        vec3 h = normalize(light_dir - world_p); /* eye is at origin */
                        const float ambient = 0.2;
                        float diffuse = 0.6*clamp(dot(light_dir, n), 0.0, 1.0);
                        float specular = 0.2*pow(clamp(dot(h, n), 0.0, 1.0), 100.0);
                        float distance = length(world_p); /* eye is at origin */
                        color = vec4(color.xyz*(ambient + (diffuse + specular)/distance), 1.0);
#endif
                        return;
                }
#elif (METHOD == DVR)
                if(color.a < 255.0 && value >=extent1 && value <= extent2){
                  vec4 sample_color = texture(colormap_sampler, vec2(clamp((value-extent1)/(extent2-extent1),0.0,1.0), 0.0));
                  color.xyz += (1.0 - color.a)*sample_color.xyz*sample_color.a;
                  color.a += (1.0 - color.a)*sample_color.a;
                //  color = vec4(t, 0.0, 0.0, 1.0);
                 //color = vec4(clamp((value-extent1)/(extent2-extent1),0.0,1.0), 0.0, 0.0, 1.0);
                 // return;
                }
#endif
        }
        if (color.a == 0.0) 
          discard;
}
`

/* quaternion algebra */
function vec2(x, y)
{
        return {x, y}
}

function vec3(x, y, z)
{
        return {x, y, z}
}

/* TODO: do crazy stuff and have all dot products united? */
function vec3_dot(u, v)
{
        return u.x*v.x + u.y*v.y + u.z*v.z
}

function vec3_cross(u, v)
{
        return vec3(u.y*v.z - u.z*v.y,
                    u.z*v.x - u.x*v.z,
                    u.x*v.y - u.y*v.x)
}


/* TODO: use array for input? use typed array for storage? */
function mat4(...ms)
{
        /* TODO: rather throw error, and check for 16 arguments */
        return ms
}


function
mat4_scale(x, y, z)
{
        return mat4(x, 0, 0, 0,
                    0, y, 0, 0,
                    0, 0, z, 0,
                    0, 0, 0, 1)
}


function
mat4_translate(x, y, z)
{
        return mat4(1, 0, 0, 0,
                    0, 1, 0, 0,
                    0, 0, 1, 0,
                    x, y, z, 1)
}


function
mat4_mul(m1, m2)
{
        const m = []
        for (let i = 0; i < 4; ++i)
        for (let j = 0; j < 4; ++j) {
                m[4*j + i] = 0
                for (let k = 0; k < 4; ++k)
                        m[4*j + i] += m1[4*k + i]*m2[4*j + k]
        }
        return m
}


function quat(w, x, y, z)
{
        return {w, x, y, z}
}

/* TODO: convert parts to dot product and cross product (tangles it though, and quaternions are above vectors) */
function quat_mul(q0, q1)
{
        return quat(q0.w*q1.w - q0.x*q1.x - q0.y*q1.y - q0.z*q1.z,
                    q0.w*q1.x + q1.w*q0.x + q0.y*q1.z - q0.z*q1.y,
                    q0.w*q1.y + q1.w*q0.y - q0.x*q1.z + q0.z*q1.x,
                    q0.w*q1.z + q1.w*q0.z + q0.x*q1.y - q0.y*q1.x)
}

/* TODO: return mat3? */
function quat_to_mat4(q)
{
        return mat4(1.0 - 2.0*q.y*q.y - 2.0*q.z*q.z, 2.0*q.x*q.y + 2.0*q.w*q.z, 2.0*q.x*q.z - 2.0*q.w*q.y, 0.0,
                    2.0*q.x*q.y - 2.0*q.w*q.z, 1.0 - 2.0*q.x*q.x - 2.0*q.z*q.z, 2.0*q.y*q.z + 2.0*q.w*q.x, 0.0,
                    2.0*q.x*q.z + 2.0*q.w*q.y, 2.0*q.y*q.z - 2.0*q.w*q.x, 1.0 - 2.0*q.x*q.x - 2.0*q.y*q.y, 0.0,
                    0.0, 0.0, 0.0, 1.0
        )
}


/* utility functions */
/* TODO: use quaternion to represent camera */
function look_at(position, target, up)
{
}




/* Shoemake's arcball */
/* it is nice to have it independent on input from vec */
function arcball_screen_to_sphere(circle, screen_x, screen_y)
{
        const x = (screen_x - circle.center.x)/circle.radius
        const y = -(screen_y - circle.center.y)/circle.radius
        const r = x*x + y*y

        if (r > 1.0) {
                const s = 1.0/Math.sqrt(r)
                return vec3(s*x, s*y, 0.0)
        } else
                return vec3(x, y, Math.sqrt(1.0 - r))
}

function arcball_quat(start_point, end_point)
{
        const axis  = vec3_cross(start_point, end_point)
        const angle = vec3_dot(start_point, end_point)
        return quat(angle, axis.x, axis.y, axis.z)
}



const viewer = document.querySelector('#viewer')

const canvas = viewer.querySelector('canvas')
canvas.width  = window.innerWidth-100;
canvas.height = window.innerHeight-100;
const width = canvas.width
const height = canvas.height

const arcball_circle = {
        center: vec2(width/2, height/2),
        radius: Math.min(width/2, height/2),
}

var view_distance = 1.0

const near_plane = 0.01
const far_plane = 100000.0
const matrices = {
        model:      mat4(1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, -0.5, -0.5, -0.5, 1.0),
        view:       mat4(1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, -view_distance, 1.0),
        projection: mat4(1.0, 0.0, 0.0, 0.0,
                         0.0, 1.0, 0.0, 0.0,
                         0.0, 0.0, -(far_plane + near_plane)/(far_plane - near_plane), -1.0,
                         0.0, 0.0, -2.0*far_plane*near_plane/(far_plane - near_plane), 0.0),
}

let p0
var q = quat(1.0, 0.0, 0.0, 0.0)
let q_down

canvas.addEventListener('mousedown', e => {
        if (!(e.buttons & 1))
                return

        q_down = q
        const rect = canvas.getBoundingClientRect()
        p0 = arcball_screen_to_sphere(arcball_circle, e.clientX - rect.left, e.clientY - rect.top)
})
canvas.addEventListener('mousemove', e => {
        if (!(e.buttons & 1))
                return

        const rect = canvas.getBoundingClientRect()
        const p1 = arcball_screen_to_sphere(arcball_circle, e.clientX - rect.left, e.clientY - rect.top)
        const q_move = arcball_quat(p0, p1)
        
        q = quat_mul(q_move, q_down)

        matrices.view = quat_to_mat4(q)
        /* translate camera */
        /* TODO: bit error prone as we have it in another place (`present` function) */
        matrices.view[14] = -view_distance;

        gl.bufferSubData(gl.UNIFORM_BUFFER, matrices.model.length*4, new Float32Array(matrices.view))
        render()
})
canvas.addEventListener('wheel', e => {
        e.preventDefault()

        view_distance = Math.max(1, view_distance + 0.1*e.deltaY)

        matrices.view[14] = -view_distance;
        gl.bufferSubData(gl.UNIFORM_BUFFER, matrices.model.length*4, new Float32Array(matrices.view))
        render()
})

const gl = canvas.getContext('webgl2')
if (!gl) {
        console.log('WebGL: version 2 not available')
        alert('WebGL 2 is not available')
}

/* necessary for linear filtering of float textures */
if (!gl.getExtension('OES_texture_float_linear'))
        console.log('WebGL: no linear filtering for float textures')

/*
const isovalue_select = document.getElementById('isovalue_select')
isovalue_select.addEventListener('input', e => {
        console.log('isovalue', e.target.value)
        gl.uniform1f(gl.getUniformLocation(program, 'isovalue'), e.target.value)
        render()
})
*/

gl.enable(gl.CULL_FACE)
gl.cullFace(gl.FRONT)


/* create program from two shaders */
const vertex_shader = gl.createShader(gl.VERTEX_SHADER)
gl.shaderSource(vertex_shader, vert_src.trim())
gl.compileShader(vertex_shader)
console.log(gl.getShaderInfoLog(vertex_shader))

const fragment_shader = gl.createShader(gl.FRAGMENT_SHADER)
gl.shaderSource(fragment_shader, frag_src.trim())
gl.compileShader(fragment_shader)
console.log(gl.getShaderInfoLog(fragment_shader))

const program = gl.createProgram()
gl.attachShader(program, vertex_shader)
gl.attachShader(program, fragment_shader)
gl.linkProgram(program)

gl.deleteShader(vertex_shader)
gl.deleteShader(fragment_shader)

gl.useProgram(program)

const uniform_matrices_location = gl.getUniformBlockIndex(program, 'Matrices')
gl.uniformBlockBinding(program, uniform_matrices_location, 0)


/* TODO: can use one triangle strip */
var positions = new Float32Array([
        0.0, 0.0, 0.0,
        1.0, 0.0, 0.0,
        0.0, 1.0, 0.0,
        1.0, 1.0, 0.0,
        0.0, 0.0, 1.0,
        1.0, 0.0, 1.0,
        0.0, 1.0, 1.0,
        1.0, 1.0, 1.0,
])

const indices = new Uint8Array([
        /* bottom */
        0, 2, 1,
        2, 3, 1,
        /* top */
        4, 5, 6,
        6, 5, 7,
        /* left */
        2, 0, 6,
        6, 0, 4,
        /* right */
        1, 3, 5,
        5, 3, 7,
        /* back */
        3, 2, 7,
        7, 2, 6,
        /* front */
        0, 1, 4,
        4, 1, 5,
])

const vbo = gl.createBuffer()
gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW)

const ebo = gl.createBuffer()
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo)
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW)


const vao = gl.createVertexArray()
gl.bindVertexArray(vao)
gl.enableVertexAttribArray(0)
gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0)
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo)
gl.bindVertexArray(null)

let volume_tex

const test_colormap = [
    255, 255, 0, 0,
    0, 255, 0, 0,
    0, 255, 255, 255,
    0,0,0,0
]

var colormap_tex = gl.createTexture()
var volume_sampler = gl.createSampler()
var colormap_sampler = gl.createSampler()
var ubo = gl.createBuffer()
var extent1=0.0;
var extent2=255.0;
var data_extent=[];

updateColorMap(NaN, NaN);

// const test_colormap = [
//     255, 255, 0, 5,
//     0, 255, 0, 200,
//     0, 255, 255, 255,
//     0,0,0,0
// ]

// const colormap = gamma_colormap;

// const colormap_tex = gl.createTexture()
// /* WebGL does not support 1D textures directly */
// gl.bindTexture(gl.TEXTURE_2D, colormap_tex)
// gl.texStorage2D(gl.TEXTURE_2D, 1, gl.SRGB8_ALPHA8, colormap.length/4, 1)
// gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, colormap.length/4, 1, gl.RGBA,
//                  gl.UNSIGNED_BYTE, new Uint8Array(colormap))

// /* create sampler objects for each texture */
// const volume_sampler = gl.createSampler()
// gl.samplerParameteri(volume_sampler, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
// gl.samplerParameteri(volume_sampler, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
// gl.samplerParameteri(volume_sampler, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
// gl.samplerParameteri(volume_sampler, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
// gl.samplerParameteri(volume_sampler, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE)

// const colormap_sampler = gl.createSampler()
// gl.samplerParameteri(colormap_sampler, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
// gl.samplerParameteri(colormap_sampler, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
// gl.samplerParameteri(colormap_sampler, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

// const ubo = gl.createBuffer()
// gl.bindBuffer(gl.UNIFORM_BUFFER, ubo)
// gl.bufferData(gl.UNIFORM_BUFFER, new Float32Array(matrices.model.concat(matrices.view, matrices.projection)), gl.DYNAMIC_DRAW)

// gl.clearColor(1.0,1.0,1.0,1.0)

// gl.uniform1i(gl.getUniformLocation(program, 'volume_sampler'), 0)
// gl.uniform1i(gl.getUniformLocation(program, 'colormap_sampler'), 1)

// gl.uniform1f(gl.getUniformLocation(program, 'isovalue'), isovalue_select.value)

function get_data_extent(){
  return data_extent;
}

function get_palette_data(palette_str){
  var colormap;
  if (palette_str == "gamma") 
    colormap = gamma_colormap;
  else if (palette_str == "rich") 
    colormap = rich_colormap;
  else if (palette_str == "smoothrich") 
    colormap = smoothrich_colormap;
  else if (palette_str == "banded") 
    colormap = banded_colormap;
  else if (palette_str == "bry") 
    colormap = bry_colormap;
  else if (palette_str == "bgry") 
      colormap = bgry_colormap;
  else if (palette_str == "hot1") 
      colormap = hot1_colormap;
  else if (palette_str == "hot2") 
      colormap = hot2_colormap;
  else if (palette_str == "ice") 
      colormap = ice_colormap;
  else if (palette_str == "lighthues") 
      colormap = lighthues_colormap;
  else if (palette_str == "lut16") 
      colormap = lut16_colormap;
  else if (palette_str == "BlueGreenDivergent") 
    colormap = BlueGreenDivergent_colormap;
  else if (palette_str == "GreenGold") 
    colormap = GreenGold_colormap;
  else if (palette_str == "LinearGreen") 
    colormap = LinearGreen_colormap;
  else if (palette_str == "AsymmetricBlueGreenDivergent") 
    colormap = AsymmetricBlueGreenDivergent_colormap;
  else if (palette_str == "LinearTurquois") 
    colormap = LinearTurquois_colormap;
  else if (palette_str == "MutedBlueGreen") 
    colormap = MutedBlueGreen_colormap;
  else if (palette_str == "ExtendedCoolWarm") 
    colormap = ExtendedCoolWarm_colormap;
  else if (palette_str == "AsymmetricBlueOrangeDivergent") 
    colormap = AsymmetricBlueOrangeDivergent_colormap;
  else if (palette_str == "LinearYellow") 
    colormap = LinearYellow_colormap;
  else if (palette_str == "LinearGray5") 
    colormap = LinearGray5_colormap;
  else if (palette_str == "LinearGray4") 
    colormap = LinearGray4_colormap;
  else if (palette_str == "graytransparent") 
    colormap = gray_transparent_colormap();
  else if (palette_str == "grayopaque") 
    colormap = gray_opaque_colormap();
  else if (palette_str == "hsl") 
    colormap = hsl_colormap();
  else if (palette_str == "scivis_magic_colormap") 
    colormap = scivis_magic_colormap;
  else 
    colormap = smoothrich_colormap;

  return colormap;

}

function updateColorMap(ext1, ext2)
{
  var palette_str = document.getElementById('palette').value;

  if(!isNaN(ext1))
    extent1 = ext1;
  else
    extent1 = data_extent[0]
  if(!isNaN(ext2))
    extent2 = ext2;
  else
    extent2 = data_extent[1]

  gl.uniform1f(gl.getUniformLocation(program, "extent1"), extent1);
  gl.uniform1f(gl.getUniformLocation(program, "extent2"), extent2);

  var colormap = get_palette_data(palette_str)

  colormap_tex = gl.createTexture()
  /* WebGL does not support 1D textures directly */
  gl.bindTexture(gl.TEXTURE_2D, colormap_tex)
  gl.texStorage2D(gl.TEXTURE_2D, 1, gl.SRGB8_ALPHA8, colormap.length/4, 1)
  gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, colormap.length/4, 1, gl.RGBA,
                   gl.UNSIGNED_BYTE, new Uint8Array(colormap))

  /* create sampler objects for each texture */
  volume_sampler = gl.createSampler()
  gl.samplerParameteri(volume_sampler, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.samplerParameteri(volume_sampler, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.samplerParameteri(volume_sampler, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.samplerParameteri(volume_sampler, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.samplerParameteri(volume_sampler, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE)

  // colormap_sampler = gl.createSampler()
  gl.samplerParameteri(colormap_sampler, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.samplerParameteri(colormap_sampler, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.samplerParameteri(colormap_sampler, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

  ubo = gl.createBuffer()
  gl.bindBuffer(gl.UNIFORM_BUFFER, ubo)
  gl.bufferData(gl.UNIFORM_BUFFER, new Float32Array(matrices.model.concat(matrices.view, matrices.projection)), gl.DYNAMIC_DRAW)

  gl.clearColor(1.0,1.0,1.0,1.0)

  gl.uniform1i(gl.getUniformLocation(program, 'volume_sampler'), 0)
  gl.uniform1i(gl.getUniformLocation(program, 'colormap_sampler'), 1)

}

function
render()
{
        gl.clear(gl.COLOR_BUFFER_BIT)

        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_3D, volume_tex)
        gl.bindSampler(0, volume_sampler)

        gl.activeTexture(gl.TEXTURE1)
        gl.bindTexture(gl.TEXTURE_2D, colormap_tex)
        gl.bindSampler(1, colormap_sampler)

        gl.bindVertexArray(vao)
        gl.bindBufferBase(gl.UNIFORM_BUFFER, 0, ubo)
        gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_BYTE, 0)
        gl.bindVertexArray(null)

}




/* setup scene for 2D view */
function
resetView()
{
        q = quat(1.0, 0.0, 0.0, 0.0)
        matrices.view       = mat4(1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, -view_distance, 1.0)
        matrices.projection = mat4(1.0, 0.0, 0.0, 0.0,
                         0.0, 1.0, 0.0, 0.0,
                         0.0, 0.0, -(far_plane + near_plane)/(far_plane - near_plane), -1.0,
                         0.0, 0.0, -2.0*far_plane*near_plane/(far_plane - near_plane), 0.0)

        gl.bindBuffer(gl.UNIFORM_BUFFER, ubo)
        gl.bufferSubData(gl.UNIFORM_BUFFER, matrices.model.length*4, new Float32Array([...matrices.view, ...matrices.projection]))

        render()
}


/* from stackoverflow */
const to_half = (() => {
        const floatView = new Float32Array(1);
        const int32View = new Int32Array(floatView.buffer);

        /* This method is faster than the OpenEXR implementation (very often
        * used, eg. in Ogre), with the additional benefit of rounding, inspired
        * by James Tursa?s half-precision code. */
        return val => {
                floatView[0] = val
                const x = int32View[0]

                let bits = (x >> 16) & 0x8000 /* Get the sign */
                let m = (x >> 12) & 0x07ff /* Keep one extra bit for rounding */
                const e = (x >> 23) & 0xff /* Using int is faster here */

                /* If zero, or denormal, or exponent underflows too much for a denormal
                 * half, return signed zero. */
                if (e < 103) {
                        return bits
                }

                /* If NaN, return NaN. If Inf or exponent overflow, return Inf. */
                if (e > 142) {
                        bits |= 0x7c00
                        /* If exponent was 0xff and one mantissa bit was set, it means NaN,
                         * not Inf, so make sure we set one mantissa bit too. */
                        bits |= ((e == 255) ? 0 : 1) && (x & 0x007fffff)
                        return bits
                }

                /* If exponent underflows but not too much, return a denormal */
                if (e < 113) {
                        m |= 0x0800
                        /* Extra rounding may overflow and set mantissa to 0 and exponent
                        * to 1, which is OK. */
                        bits |= (m >> (114 - e)) + ((m >> (113 - e)) & 1)
                        return bits
                }

                bits |= ((e - 112) << 10) | (m >> 1)
                /* Extra rounding. An overflow will set mantissa to 0 and increment
                * the exponent, which is OK. */
                bits += m & 1
                return bits
        }
})()

function rgb_to_half(i, buffer){
        const floatView = new Float32Array(1);
        const int32View = new Int32Array(floatView.buffer);

        const R=0.2990*buffer[i];
        const G=0.5870*buffer[i+1];
        const B=0.1140*buffer[i+2];
        let val=R+G+B;

        return to_half(val)
}

function
compute_extent(array)
{
        return array.reduce(([min, max], d) => [Math.min(d, min), Math.max(d, max)], [0, 0])
}


/* TODO: refactor to share code between cases */
function
to_array(buffer, data_type)
{
        if (data_type === "uint8") {
            const view = new Uint8Array(buffer)
            const array = new Uint16Array(view.length).map((_, i) => to_half(view[i]))
            const extent = compute_extent(view)
            return {extent, array}
        }
        else if (data_type === "uint8[3]") {
            const view = new Uint8Array(buffer)
            const array = new Uint16Array(view.length/3).map((_, i) => rgb_to_half(i*3, view))
            const extent = compute_extent(view)
            return {extent, array}
        }
        else if (data_type === "uint8[4]") {
            const view = new Uint8Array(buffer)
            const array = new Uint16Array(view.length/4).map((_, i) => rgb_to_half(i*4, view))
            const extent = compute_extent(view)
            return {extent, array}
        }
        else if (data_type === "uint16") {
            const view = new Uint16Array(buffer)
            const array = new Uint16Array(view.length).map((_, i) => to_half(view[i]))
            const extent = compute_extent(view)
            return {extent, array}
        } else if (data_type === "int16") {
            const view = new Int16Array(buffer)
            const array = new Uint16Array(view.length).map((_, i) => to_half(view[i]))
            const extent = compute_extent(view)
            return {extent, array}
        } else if (data_type === "int32") {
            const view = new Int32Array(buffer)
            const array = new Float32Array(view.length).map((_, i) => view[i])
            const extent = compute_extent(array)
            return {extent, array}
        } else if (data_type === "float32") {
            const array = new Float32Array(buffer)
            const extent = compute_extent(array)
            return {extent, array}
        } else if (data_type === "float64") {
            const view = new Float64Array(buffer)
            const array = new Float32Array(view.length).map((_, i) => view[i])
            const extent = compute_extent(array)
            return {extent, array}
        }
        else 
            console.log("datatype not supported")
}



/* 8 and 16 bit integers are converted to float16 */
function
upload_data(gl, buffer, size, data_type, box_size)//, min_extent, max_extent)
{
        /* TODO: dealloc or if same size then reuse */
        volume_tex = gl.createTexture()
        gl.bindTexture(gl.TEXTURE_3D, volume_tex)

        const {array, extent} = to_array(buffer, data_type)
        console.log('extent', extent)
        
        data_extent = extent;

        gl.uniform1f(gl.getUniformLocation(program, "extent1"), extent[0]);
        gl.uniform1f(gl.getUniformLocation(program, "extent2"), extent[1]);

        /* update isovalue slider and shader uniform */
        // isovalue_select.min = extent[0]
        // isovalue_select.max = extent[1]
        // isovalue_select.value = 0.5*(extent[0] + extent[1])
        // gl.uniform1f(gl.getUniformLocation(program, 'isovalue'), isovalue_select.value)

        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1)
        if (array.BYTES_PER_ELEMENT === 2) {
                gl.texStorage3D(gl.TEXTURE_3D, 1, gl.R16F, size.width, size.height, size.depth)
                gl.texSubImage3D(gl.TEXTURE_3D, 0,
                                 0, 0, 0,
                                 size.width, size.height, size.depth,
                                 gl.RED, gl.HALF_FLOAT, array)

        } else {
                gl.texStorage3D(gl.TEXTURE_3D, 1, gl.R32F, size.width, size.height, size.depth)
                gl.texSubImage3D(gl.TEXTURE_3D, 0,
                                 0, 0, 0,
                                 size.width, size.height, size.depth,
                                 gl.RED, gl.FLOAT, array)
        }

        const max = Math.max(box_size.width, box_size.height, box_size.depth)
        matrices.model = mat4_mul(mat4_scale(box_size.width/max, box_size.height/max, box_size.depth/max), mat4_translate(-0.5, -0.5, -0.5))
        gl.bindBuffer(gl.UNIFORM_BUFFER, ubo)
        gl.bufferSubData(gl.UNIFORM_BUFFER, 0, new Float32Array(matrices.model))
}


/* WebVR code */
let vr_display
let frame_data


// function
// vr_init()
// {
//         if (!navigator.getVRDisplays)
//                 console.log('Missing VR support')

//                         frame_data = new VRFrameData()

//         navigator.getVRDisplays().then(displays => {
//                 if (!displays.length) {
//                         console.log('VR: No device connected')
//                         return
//                 }

//                 vr_display = displays[displays.length - 1]

//                 vr_display.depthNear = 0.1
//                 vr_display.depthFar = 100

//                 if (vr_display.capabilities.canPresent)
//                         /* TODO: add button */
//                         console.log('device can present')

//                 window.addEventListener('vrdisplaypresentchange', vr_display_present_change_cb, false)
//                 window.addEventListener('vrdisplayactivate', vr_display_activate_cb, false)
//                 window.addEventListener('vrdisplaydeactivate', vr_display_deactivate_cb, false)
//         })
// }


function
vr_display_present_change_cb()
{
        console.log('present change')

        if (vr_display.isPresenting) {
                const left_eye = vr_display.getEyeParameters('left')
                const right_eye = vr_display.getEyeParameters('right')

                /* TODO: two buffers? instancing? */
                canvas.width = 2*Math.max(left_eye.renderWidth, right_eye.renderWidth)
                canvas.height = Math.max(left_eye.renderHeight, right_eye.renderHeight)
        }
}



function
vr_display_activate_cb()
{
        console.log('display activate')
}


function
vr_display_deactivate_cb()
{
        console.log('display deactivate')
}


function
vr_request_present_cb()
{
        vr_display.requestPresent([{source: canvas}]).then(() => {
                console.log('User requested VR view')
                vr_request_animation_frame_cb(0)
        }, err => {
                if (err && err.message)
                        console.log('Request present failed:', err.message)
        })
}



function
vr_request_animation_frame_cb(time)
{
        vr_display.requestAnimationFrame(vr_request_animation_frame_cb)

        /* TODO: how to do room scale with fixed origin? */
        vr_display.getFrameData(frame_data)

        if (vr_display.isPresenting) {
                gl.clear(gl.COLOR_BUFFER_BIT)

                /* left eye */
                gl.viewport(0, 0, 0.5*canvas.width, canvas.height)
                /* TODO: pack into single draw call? */
                gl.bufferSubData(gl.UNIFORM_BUFFER, matrices.model.length*4, frame_data.leftViewMatrix)
                gl.bufferSubData(gl.UNIFORM_BUFFER, 2*matrices.model.length*4, frame_data.leftProjectionMatrix)
                render()

                /* right eye */
                gl.viewport(0.5*canvas.width, 0, 0.5*canvas.width, canvas.height)
                gl.bufferSubData(gl.UNIFORM_BUFFER, matrices.model.length*4, frame_data.rightViewMatrix) 
                gl.bufferSubData(gl.UNIFORM_BUFFER, 2*matrices.model.length*4, frame_data.rightProjectionMatrix)
                render()

                vr_display.submitFrame()
        }
}


function
vr_present()
{
        if (!vr_display) {
                console.log('VR: not available')
                return
        }
        vr_request_present_cb()
}

//vr_init()
