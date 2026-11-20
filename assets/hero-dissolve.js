/* A moving reflection reveals the second portrait and draws light along its silhouette. */
(() => {
  const windField = `
    uniform vec4 u_brush;
    uniform float u_time;
    uniform float u_pulse;
    uniform vec4 u_gust;

    float gust(vec2 position) {
      vec2 offset = position - u_gust.xy;
      float distanceOnWind = dot(offset, vec2(0.86, -0.51));
      float crosswind = dot(offset, vec2(0.51, 0.86));
      float ridge = distanceOnWind - u_gust.z + sin(crosswind * 0.026) * 25.0;
      return u_gust.w * (1.0 - smoothstep(14.0, 96.0, abs(ridge)))
        * (1.0 - smoothstep(78.0, u_brush.z + 168.0, abs(crosswind)));
    }

    float front(vec2 position) {
      vec2 offset = (position - u_brush.xy) / u_brush.z;
      return offset.x + offset.y * 0.63
        + sin(offset.y * 1.9 + u_time * 1.15) * 0.33
        + sin(offset.y * 4.7 - u_time * 1.75) * 0.12;
    }

    float windBand(float edge) {
      return (1.0 - smoothstep(0.09, 0.48, abs(edge)))
        * u_brush.w * (0.84 + u_pulse * 0.16);
    }

    float reveal(float edge) {
      return 1.0 - smoothstep(-0.13, 0.11, edge);
    }
  `;

  const photoVertex = `
    attribute vec2 a_corner;
    uniform vec2 u_size;
    uniform vec4 u_photo;
    varying vec2 v_uv;
    varying vec2 v_home;
    void main() {
      v_uv = a_corner;
      v_home = u_photo.xy + a_corner * u_photo.zw;
      vec2 clip = v_home / u_size * 2.0 - 1.0;
      gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
    }
  `;

  const photoFragment = `
    precision highp float;
    uniform sampler2D u_plain;
    uniform sampler2D u_gear;
    uniform vec4 u_photo;
    varying vec2 v_uv;
    varying vec2 v_home;
    ${windField}

    void main() {
      float edge = front(v_home);
      float impulse = gust(v_home);
      float phase = v_home.y * 0.023 - u_time * 2.15;
      float ribbon = exp(-abs(edge + cos(phase) * 0.022) * 15.0) * u_brush.w;
      float brightFold = exp(-abs(edge - 0.044 + sin(phase * 1.25) * 0.024) * 39.0) * u_brush.w;
      float shimmer = (0.52 + 0.48 * sin(phase * 1.18 + 0.7));
      vec2 refracted = v_uv + ribbon * vec2(cos(phase) * 2.3, sin(phase) * 1.1) / u_photo.zw;
      vec4 portrait = mix(texture2D(u_plain, refracted), texture2D(u_gear, refracted), reveal(edge) * u_brush.w);
      vec3 spectrum = mix(vec3(0.98, 0.83, 0.71), vec3(0.77, 0.75, 1.0), 0.5 + 0.5 * sin(phase));
      float reflected = ribbon * (0.19 + shimmer * 0.18) + brightFold * 0.24 + pow(impulse, 4.5) * 0.18;
      portrait.rgb = mix(portrait.rgb, spectrum * portrait.a, min(0.49, reflected));
      gl_FragColor = portrait;
    }
  `;

  const particleVertex = `
    attribute vec3 a_sample;
    attribute vec4 a_plain;
    attribute vec3 a_gear;
    uniform vec2 u_size;
    uniform vec4 u_photo;
    uniform vec2 u_wake;
    uniform float u_scale;
    varying vec4 v_color;
    varying float v_kind;
    varying float v_stream;
    ${windField}

    void main() {
      vec2 home = u_photo.xy + a_sample.xy * u_photo.zw;
      float edge = front(home);
      float seed = a_sample.z;
      float depth = fract(seed * 53.7);
      float impulse = gust(home);
      float release = max(windBand(edge + (seed - 0.5) * 0.25), impulse * 0.74);
      float stream = step(0.80, depth);
      float glint = step(0.995 - impulse * 0.002, depth);
      float bokeh = step(0.985, seed) * (1.0 - glint);
      float phase = home.y * 0.020 + home.x * 0.009 - u_time * 2.8;
      float lift = sin(phase + seed * 1.8) * 35.0 + sin(phase * 0.45 - u_time) * 28.0;
      float distanceOnWind = (36.0 + depth * 180.0 + bokeh * 46.0) * (1.0 + u_pulse * 0.22 + impulse * 0.59);
      float variation = sin(seed * 71.91) * (8.0 + 30.0 * depth);
      vec2 slip = vec2(distanceOnWind * 0.87 + lift + variation, -distanceOnWind * 0.51 + lift * 0.85 - variation);
      vec2 position = home + release * (slip - u_wake * (0.36 + 0.82 * depth));
      vec2 clip = position / u_size * 2.0 - 1.0;
      gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);

      vec3 pigment = mix(a_plain.rgb, a_gear, reveal(edge));
      vec3 accent = mix(vec3(0.56, 0.38, 0.81), vec3(0.77, 0.55, 0.37), step(0.82, depth));
      vec3 color = mix(pigment, accent, 0.34 + stream * 0.33 + bokeh * 0.20);
      float alpha = smoothstep(0.075, 0.54, release) * a_plain.a * (0.27 + depth * 0.44);
      vec3 prism = mix(vec3(0.55, 0.32, 0.89), vec3(0.86, 0.56, 0.29), step(0.62, seed));
      float shimmer = 0.46 + 0.54 * pow(0.5 + 0.5 * sin(u_time * 3.0 + seed * 69.0), 2.0);
      v_color = vec4(mix(color, prism, glint), mix(alpha, min(1.0, alpha * (0.87 + shimmer)), glint));
      v_kind = bokeh + glint * 2.0;
      v_stream = mix(stream, seed, glint);
      float size = 0.8 + depth * 1.65 + stream * 6.0 + bokeh * 18.0;
      gl_PointSize = mix(size, 28.0 + impulse * 30.0, glint) * u_scale;
      if (release < 0.075 || (glint < 0.5 && seed < 0.57 - impulse * 0.20)) {
        gl_Position = vec4(2.0, 2.0, 0.0, 1.0);
      }
    }
  `;

  const particleFragment = `
    precision highp float;
    uniform sampler2D u_plain;
    uniform sampler2D u_gear;
    uniform vec4 u_photo;
    uniform vec2 u_size;
    uniform float u_scale;
    varying vec4 v_color;
    varying float v_kind;
    varying float v_stream;
    // Let the dust pass behind the opaque part of the portrait.
    float backgroundVisibility() {
      vec2 screen = vec2(gl_FragCoord.x / u_scale, u_size.y - gl_FragCoord.y / u_scale);
      vec2 uv = (screen - u_photo.xy) / u_photo.zw;
      if (min(uv.x, uv.y) < 0.0 || max(uv.x, uv.y) > 1.0) return 1.0;
      float silhouette = max(texture2D(u_plain, uv).a, texture2D(u_gear, uv).a);
      return mix(1.0, v_kind > 1.5 ? 0.25 : 0.07, silhouette);
    }

    void main() {
      vec2 point = (gl_PointCoord - 0.5) * 2.0;
      if (v_kind > 1.5) {
        float angle = -0.79 + v_stream * 0.55;
        vec2 axis = vec2(cos(angle), sin(angle));
        vec2 star = abs(vec2(dot(point, axis), dot(point, vec2(-axis.y, axis.x))));
        float lengthToCenter = length(point);
        float halo = pow(max(0.0, 1.0 - lengthToCenter), 2.8);
        float longRay = pow(max(0.0, 1.0 - star.x), 1.8) * exp(-17.0 * star.y);
        float shortRay = pow(max(0.0, 1.0 - star.y * 1.35), 2.2) * exp(-22.0 * star.x);
        float core = exp(-94.0 * dot(point, point));
        float glimmer = max(longRay, shortRay);
        float opacity = min(1.0, halo * 0.50 + glimmer * 1.28 + core * 0.70) * v_color.a * backgroundVisibility();
        // Keep a saturated edge that stays visible on the pale background.
        float whiteCenter = min(1.0, core + glimmer * 0.19);
        vec3 tint = mix(v_color.rgb, vec3(1.0, 0.98, 0.94), whiteCenter);
        gl_FragColor = vec4(tint * opacity, opacity);
        return;
      }

      vec2 streak = vec2(dot(point, vec2(0.86, -0.51)), dot(point, vec2(0.51, 0.86)));
      float fleck = 1.0 - smoothstep(0.27, 0.88, length(point));
      float filament = (1.0 - smoothstep(0.12, 1.0, abs(streak.x)))
                     * (1.0 - smoothstep(0.04, 0.32, abs(streak.y)));
      float haze = max(0.0, 1.0 - length(point));
      float shape = mix(mix(fleck, filament, v_stream), haze * haze * 0.43, v_kind);
      if (shape < 0.01) discard;
      float opacity = shape * v_color.a * backgroundVisibility();
      gl_FragColor = vec4(v_color.rgb * opacity, opacity);
    }
  `;

  const trailVertex = `
    attribute vec2 a_position;
    attribute vec4 a_color;
    attribute vec3 a_shape;
    uniform vec2 u_size;
    uniform float u_scale;
    varying vec4 v_color;
    varying float v_kind;
    varying float v_stream;
    void main() {
      vec2 clip = a_position / u_size * 2.0 - 1.0;
      gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
      gl_PointSize = a_shape.x * u_scale;
      v_kind = a_shape.y;
      v_stream = a_shape.z;
      v_color = a_color;
    }
  `;

  function gustStrength(x, y, [originX, originY, travel, energy], span) {
    const dx = x - originX;
    const dy = y - originY;
    const crosswind = dx * 0.51 + dy * 0.86;
    const ridge = dx * 0.86 - dy * 0.51 - travel + Math.sin(crosswind * 0.026) * 25;
    return energy * Math.max(0, 1 - Math.abs(ridge) / 96)
      * Math.max(0, 1 - Math.abs(crosswind) / (span + 168));
  }

  function front(distanceY, time) {
    return distanceY * 0.63
      + Math.sin(distanceY * 1.9 + time * 1.15) * 0.33
      + Math.sin(distanceY * 4.7 - time * 1.75) * 0.12;
  }

  function makeTrails(samples, capacity) {
    const pixels = Array.from({ length: capacity }, () => ({ life: 0 }));
    const data = new Float32Array(capacity * 9);
    const sampleCount = samples.length / 10;
    let cursor = 0;
    let budget = 0;
    return {
      reset() {
        pixels.forEach(pixel => { pixel.life = 0; });
        budget = 0;
      },
      draw(frame, elapsed, active) {
        const { width, height, photo, x, y, span, time, strength, wakeX, wakeY, gust } = frame;
        const pace = Math.min(1, Math.hypot(wakeX, wakeY) / 82);
        budget += active ? elapsed * (0.08 + pace * 0.40 + gust[3] * 0.28) : 0;
        let toEmit = Math.floor(budget);
        budget -= toEmit;
        const attempts = toEmit * 12;
        for (let attempt = 0; toEmit && attempt < attempts; attempt++) {
          const sample = Math.floor(Math.random() * sampleCount) * 10;
          const sourceX = photo[0] + samples[sample] * photo[2];
          const sourceY = photo[1] + samples[sample + 1] * photo[3];
          if (sourceX < -16 || sourceX > width + 16 || sourceY < -16 || sourceY > height + 16) continue;
          const edge = (sourceX - x) / span + front((sourceY - y) / span, time);
          const blast = gustStrength(sourceX, sourceY, gust, span);
          if (Math.abs(edge) > 0.36 && blast < 0.15) continue;

          const glint = cursor % 24 === 0 || (blast > 0.23 && cursor % 11 === 0);
          const pixel = pixels[cursor++ % capacity];
          const depth = Math.random();
          const bokeh = !glint && depth > 0.975;
          const filament = !glint && !bokeh && depth > 0.66;
          const color = sample + (edge < -0.18 ? 7 : 3);
          const tint = filament ? 0.40 : 0.16;
          pixel.x = sourceX + depth * 12;
          pixel.y = sourceY;
          pixel.depth = depth;
          pixel.vx = 52 + depth * 164 + blast * 190 - wakeX * 0.54;
          pixel.vy = -24 - depth * 132 - blast * 122 - wakeY * 0.44;
          pixel.phase = Math.random() * Math.PI * 2;
          pixel.duration = pixel.life = (0.68 + depth * 0.83 + blast * 0.25) * 1000;
          pixel.red = samples[color] * (1 - tint) * 0.85 + 0.47 * tint;
          pixel.green = samples[color + 1] * (1 - tint) * 0.85 + 0.30 * tint;
          pixel.blue = samples[color + 2] * (1 - tint) * 0.85 + 0.76 * tint;
          if (glint) {
            const light = depth < 0.32 ? [0.84, 0.53, 0.26]
              : depth < 0.54 ? [0.37, 0.55, 0.79] : [0.57, 0.34, 0.87];
            [pixel.red, pixel.green, pixel.blue] = light;
          }
          pixel.alpha = samples[sample + 6] * strength;
          pixel.kind = glint ? 2 : bokeh ? 1 : 0;
          pixel.angle = glint ? depth : Number(filament);
          pixel.size = glint ? 26 + depth * 19 + blast * 25 : bokeh ? 22 + pixel.phase : filament ? 8 + pixel.phase : 1.2 + depth * 2.3;
          toEmit--;
        }

        const seconds = elapsed / 1000;
        let count = 0;
        for (const pixel of pixels) {
          if (pixel.life <= 0) continue;
          pixel.life -= elapsed;
          if (pixel.life <= 0) continue;
          const progress = 1 - pixel.life / pixel.duration;
          const curl = Math.sin(pixel.phase + progress * 5.0) * (23 + pixel.depth * 38);
          pixel.x += (pixel.vx * (1 - progress * 0.42) + curl) * seconds;
          pixel.y += (pixel.vy * (1 - progress * 0.37) + curl * 0.63) * seconds;
          const fadeIn = Math.min(1, progress * 11);
          const fadeOut = (1 - progress) ** 1.35;
          const i = count++ * 9;
          data[i] = pixel.x;
          data[i + 1] = pixel.y;
          data[i + 2] = pixel.red;
          data[i + 3] = pixel.green;
          data[i + 4] = pixel.blue;
          const glint = pixel.kind === 2;
          const shimmer = glint ? 0.34 + 0.66 * Math.sin(Math.PI * Math.min(1, progress * 1.8)) : 1;
          const presence = pixel.alpha * fadeIn * fadeOut * shimmer;
          const intensity = glint ? 1.42 : pixel.kind === 1 ? 0.78 : 0.93;
          data[i + 5] = Math.min(1, presence * intensity);
          data[i + 6] = pixel.size * (glint ? 0.57 + shimmer * 0.43 : 1);
          data[i + 7] = pixel.kind;
          data[i + 8] = pixel.angle;
        }
        return { data: data.subarray(0, count * 9), count };
      },
    };
  }

  function samplePortrait(plain, gear, columns) {
    const sampler = document.createElement("canvas");
    sampler.width = columns;
    sampler.height = Math.round(columns * plain.naturalHeight / plain.naturalWidth);
    const context = sampler.getContext("2d", { willReadFrequently: true });
    if (!context) return [];
    const { width, height } = sampler;
    context.drawImage(plain, 0, 0, width, height);
    const original = context.getImageData(0, 0, width, height).data;
    context.clearRect(0, 0, width, height);
    context.drawImage(gear, 0, 0, width, height);
    const dressed = context.getImageData(0, 0, width, height).data;
    const points = [];
    for (let row = 0; row < height; row++) {
      for (let column = 0; column < width; column++) {
        const at = (row * width + column) * 4;
        const alpha = Math.max(original[at + 3], dressed[at + 3]);
        if (alpha < 100) continue;
        const originalColor = original[at + 3] > 75 ? original : dressed;
        const dressedColor = dressed[at + 3] > 75 ? dressed : original;
        points.push(
          (column + 0.18 + Math.random() * 0.64) / width,
          (row + 0.18 + Math.random() * 0.64) / height,
          Math.random(),
          originalColor[at] / 255, originalColor[at + 1] / 255, originalColor[at + 2] / 255, alpha / 255,
          dressedColor[at] / 255, dressedColor[at + 1] / 255, dressedColor[at + 2] / 255
        );
      }
    }
    return points;
  }

  function makeProgram(gl, vertex, fragment, attributes, uniforms) {
    const program = gl.createProgram();
    for (const [type, source] of [[gl.VERTEX_SHADER, vertex], [gl.FRAGMENT_SHADER, fragment]]) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        gl.deleteProgram(program);
        return null;
      }
      gl.attachShader(program, shader);
      gl.deleteShader(shader);
    }
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program);
      return null;
    }
    return {
      program,
      attributes: Object.fromEntries(attributes.map(name => [name, gl.getAttribLocation(program, "a_" + name)])),
      uniforms: Object.fromEntries(
        ["size", "photo", "brush", "time", "pulse", "gust", ...uniforms].map(name => [name, gl.getUniformLocation(program, "u_" + name)])
      ),
    };
  }

  function makeWebGL(canvas, points, plain, gear) {
    const gl = canvas.getContext("webgl", { alpha: true, antialias: false, premultipliedAlpha: true });
    if (!gl) return null;
    const photo = makeProgram(gl, photoVertex, photoFragment, ["corner"], ["plain", "gear"]);
    const particles = makeProgram(gl, particleVertex, particleFragment, ["sample", "plain", "gear"], ["wake", "scale", "plain", "gear"]);
    const trails = makeProgram(gl, trailVertex, particleFragment, ["position", "color", "shape"], ["scale", "plain", "gear"]);
    if (!photo || !particles || !trails) return null;

    function buffer(values) {
      const result = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, result);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(values), gl.STATIC_DRAW);
      return result;
    }

    const quad = buffer([0, 0, 1, 0, 0, 1, 1, 1]);
    const pixelBuffer = buffer(points);
    const trailBuffer = gl.createBuffer();
    const pixelLayout = [["sample", 3, 0], ["plain", 4, 3], ["gear", 3, 7]];
    const trailLayout = [["position", 2, 0], ["color", 4, 2], ["shape", 3, 6]];

    function drawPoints(pass, layout, stride, count) {
      for (const [name, size, offset] of layout) {
        const location = pass.attributes[name];
        gl.enableVertexAttribArray(location);
        gl.vertexAttribPointer(location, size, gl.FLOAT, false, stride * 4, offset * 4);
      }
      gl.drawArrays(gl.POINTS, 0, count);
      for (const [name] of layout) gl.disableVertexAttribArray(pass.attributes[name]);
    }

    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    [plain, gear].forEach((image, index) => {
      gl.activeTexture(gl.TEXTURE0 + index);
      gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    });
    if (gl.getError() !== gl.NO_ERROR) return null;

    for (const pass of [photo, particles, trails]) {
      gl.useProgram(pass.program);
      gl.uniform1i(pass.uniforms.plain, 0);
      gl.uniform1i(pass.uniforms.gear, 1);
    }
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    function setFrame(pass, { width, height, photo, x, y, span, strength, time, pulse, gust }) {
      gl.useProgram(pass.program);
      gl.uniform2f(pass.uniforms.size, width, height);
      gl.uniform4f(pass.uniforms.photo, ...photo);
      gl.uniform4f(pass.uniforms.brush, x, y, span, strength);
      gl.uniform1f(pass.uniforms.time, time);
      gl.uniform1f(pass.uniforms.pulse, pulse);
      gl.uniform4f(pass.uniforms.gust, ...gust);
    }

    return frame => {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clear(gl.COLOR_BUFFER_BIT);

      setFrame(photo, frame);
      gl.bindBuffer(gl.ARRAY_BUFFER, quad);
      gl.enableVertexAttribArray(photo.attributes.corner);
      gl.vertexAttribPointer(photo.attributes.corner, 2, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      gl.disableVertexAttribArray(photo.attributes.corner);

      setFrame(particles, frame);
      gl.uniform2f(particles.uniforms.wake, frame.wakeX, frame.wakeY);
      gl.uniform1f(particles.uniforms.scale, frame.scale);
      gl.bindBuffer(gl.ARRAY_BUFFER, pixelBuffer);
      drawPoints(particles, pixelLayout, 10, points.length / 10);

      if (frame.trails.count) {
        setFrame(trails, frame);
        gl.uniform1f(trails.uniforms.scale, frame.scale);
        gl.bindBuffer(gl.ARRAY_BUFFER, trailBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, frame.trails.data, gl.STREAM_DRAW);
        drawPoints(trails, trailLayout, 9, frame.trails.count);
      }
    };
  }

  function drawGlint(context, x, y, size, rotation, color, alpha) {
    const reach = size * 0.47;
    const width = Math.max(0.75, size * 0.035);
    context.save();
    context.translate(x, y);
    context.rotate(-0.79 + rotation * 0.55);
    context.globalAlpha = alpha;
    context.strokeStyle = color;
    context.fillStyle = "#fffaf5";
    context.lineWidth = 0.7;
    context.shadowColor = color;
    context.shadowBlur = 8;
    context.beginPath();
    context.moveTo(-reach, 0);
    context.lineTo(-width, -width);
    context.lineTo(0, -reach * 0.73);
    context.lineTo(width, -width);
    context.lineTo(reach, 0);
    context.lineTo(width, width);
    context.lineTo(0, reach * 0.73);
    context.lineTo(-width, width);
    context.closePath();
    context.fill();
    context.stroke();
    context.restore();
  }

  function makeCanvas2D(canvas, points, plain, gear) {
    const context = canvas.getContext("2d");
    if (!context) return null;
    const shards = [];
    for (let index = 0; index < points.length; index += 40) {
      const [x, y, seed, r, g, b, alpha] = points.slice(index, index + 7);
      const depth = seed * 53.7 % 1;
      const color = [r, g, b].map((value, channel) =>
        Math.round(value * 164 + [92, 55, 150][channel] * 0.28));
      shards.push({ x, y, seed, alpha, depth, color: `rgb(${color.join(",")})` });
    }
    return ({ width, height, scale, photo, x, y, span, strength, wakeX, wakeY, time, pulse, gust, trails }) => {
      const [left, top, imageWidth, imageHeight] = photo;
      context.setTransform(scale, 0, 0, scale, 0, 0);
      context.clearRect(0, 0, width, height);
      context.globalAlpha = 1;
      context.globalCompositeOperation = "source-over";
      for (const shard of shards) {
        const homeX = left + shard.x * imageWidth;
        const homeY = top + shard.y * imageHeight;
        const edge = (homeX - x) / span + front((homeY - y) / span, time);
        const release = Math.max(
          (1 - Math.min(1, Math.abs(edge + (shard.seed - 0.5) * 0.25) / 0.48)) * strength,
          gustStrength(homeX, homeY, gust, span) * 0.74,
        );
        if (release < 0.075 || shard.seed < 0.52) continue;
        const phase = homeY * 0.02 + homeX * 0.009 - time * 2.8;
        const lift = Math.sin(phase + shard.seed * 1.8) * 36 + Math.sin(phase * 0.45 - time) * 28;
        const travel = (18 + shard.depth * 168) * (1 + pulse * 0.75);
        const px = homeX + release * (travel * 0.87 + lift - wakeX * shard.depth);
        const py = homeY + release * (-travel * 0.51 + lift * 0.85 - wakeY * shard.depth);
        const size = 1 + shard.depth * 2.3;
        context.globalAlpha = release * shard.alpha * 0.65;
        context.fillStyle = shard.color;
        context.fillRect(px, py, size, size);
      }
      for (let i = 0; i < trails.data.length; i += 9) {
        const [px, py, red, green, blue, alpha, size, kind, angle] = trails.data.subarray(i, i + 9);
        const color = `rgb(${red * 255}, ${green * 255}, ${blue * 255})`;
        if (kind === 2) {
          drawGlint(context, px, py, size, angle, color, alpha);
          continue;
        }
        const bokeh = kind === 1;
        context.globalAlpha = alpha * (bokeh ? 0.18 : 1);
        context.fillStyle = color;
        context.fillRect(px, py, bokeh ? size / 3 : size, angle ? 1 : bokeh ? size / 3 : size);
      }
      context.globalAlpha = 1;
      context.drawImage(plain, ...photo);
      const edgePoints = Array.from({ length: 49 }, (_, index) => {
        const row = top + index * imageHeight / 48;
        return [x - span * front((row - y) / span, time), row];
      });
      context.save();
      context.beginPath();
      context.moveTo(Math.min(left, -2), top);
      for (const [column, row] of edgePoints) context.lineTo(column, row);
      context.lineTo(Math.min(left, -2), top + imageHeight);
      context.clip();
      context.globalAlpha = strength;
      context.drawImage(gear, ...photo);
      context.restore();

      context.globalCompositeOperation = "source-atop";
      context.beginPath();
      for (const [index, [column, row]] of edgePoints.entries()) {
        if (index === 0) context.moveTo(column, row);
        else context.lineTo(column, row);
      }
      context.strokeStyle = "#decaff";
      context.globalAlpha = strength * (0.22 + pulse * 0.15);
      context.lineWidth = Math.max(2, span * 0.03);
      context.stroke();
    };
  }

  function createRenderer(points, plain, gear) {
    const canvas = document.createElement("canvas");
    const webgl = makeWebGL(canvas, points, plain, gear);
    if (webgl) return { canvas, draw: webgl };
    const fallback = document.createElement("canvas");
    const draw = makeCanvas2D(fallback, points, plain, gear);
    return draw ? { canvas: fallback, draw } : null;
  }

  window.initPeluviHero = () => {
    const hero = document.querySelector(".pv-hero");
    const scene = hero?.querySelector(".pv-hero-scene");
    const plain = scene?.querySelector(".pv-hero-base img");
    const gear = scene?.querySelector(".pv-hero-reveal img");
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    if (!plain || !gear || motion.matches) return () => {};

    let renderer;
    let trails;
    let previewRequested = false;
    let previewAt = null;
    let interacted = false;
    let frame = 0;
    let lastTime = null;
    let target = null;
    let tapStart = null;
    let tapTimer;
    let burstAt = -Infinity;
    let burstOrigin = null;
    let strength = 0;
    let x = 0;
    let y = 0;
    let wakeX = 0;
    let wakeY = 0;

    function schedule() {
      if (renderer && !frame && !motion.matches) frame = requestAnimationFrame(draw);
    }

    function playPreview() {
      previewRequested = true;
      if (!renderer || interacted || motion.matches || scrollY > hero.clientHeight * 0.18) return;
      previewAt = performance.now();
      burstAt = previewAt + 1350;
      burstOrigin = null;
      schedule();
    }

    function draw(now) {
      frame = 0;
      const elapsed = lastTime === null ? 16 : Math.min(50, now - lastTime);
      lastTime = now;
      const bounds = scene.getBoundingClientRect();
      if (motion.matches || bounds.bottom < 0 || bounds.top > innerHeight) {
        stop();
        return;
      }

      const image = plain.getBoundingClientRect();
      const fit = Math.min(image.width / plain.naturalWidth, image.height / plain.naturalHeight);
      const photoWidth = plain.naturalWidth * fit;
      const photoHeight = plain.naturalHeight * fit;
      const photo = [
        image.left - bounds.left + (image.width - photoWidth) / 2,
        image.bottom - bounds.top - photoHeight,
        photoWidth, photoHeight,
      ];
      const progress = previewAt === null ? 0 : (now - previewAt) / 5900;
      if (progress >= 1) previewAt = null;
      const preview = previewAt !== null;
      const sweep = Math.max(0, progress);
      const spread = bounds.width < 700 ? 0.70 : 0.66;
      const aim = preview ? {
        x: (0.5 - spread / 2 + spread * sweep) * bounds.width,
        y: photo[1] + photo[3] * (0.52 + Math.sin(sweep * Math.PI * 1.6) * 0.18),
      } : target && { x: target.x - bounds.left, y: target.y - bounds.top };

      if (aim) {
        if (strength === 0) {
          x = wakeX = aim.x;
          y = wakeY = aim.y;
        }
        const follow = 1 - Math.exp(-elapsed / 83);
        const lag = 1 - Math.exp(-elapsed / 245);
        x += (aim.x - x) * follow;
        y += (aim.y - y) * follow;
        wakeX += (aim.x - wakeX) * lag;
        wakeY += (aim.y - wakeY) * lag;
      }
      strength += ((aim ? 1 : 0) - strength) * (1 - Math.exp(-elapsed / (aim ? 185 : 260)));
      const age = now - burstAt;
      const pulse = age >= 0 && age < 1850 ? Math.min(1, age / 82) * Math.exp(-age / 580) : 0;
      if (pulse && !burstOrigin) burstOrigin = { x, y };
      const gust = pulse
        ? [burstOrigin.x, burstOrigin.y, age * (0.34 + bounds.width * 0.00032), Math.min(1, pulse * 1.34)]
        : [0, 0, 0, 0];
      const span = Math.min(204, Math.max(65, bounds.width * 0.123));
      const scale = Math.min(devicePixelRatio || 1, 1.6);
      const sample = {
        width: bounds.width, height: bounds.height, scale, photo, x, y, span, strength,
        wakeX: Math.max(-175, Math.min(175, x - wakeX)),
        wakeY: Math.max(-175, Math.min(175, y - wakeY)),
        time: now / 1000, pulse, gust,
      };
      sample.trails = trails.draw(sample, elapsed, Boolean(aim));
      if (!aim && strength < 0.012 && !sample.trails.count && !pulse) {
        stop();
        return;
      }

      const pixelsWide = Math.round(bounds.width * scale);
      const pixelsHigh = Math.round(bounds.height * scale);
      if (renderer.canvas.width !== pixelsWide || renderer.canvas.height !== pixelsHigh) {
        renderer.canvas.width = pixelsWide;
        renderer.canvas.height = pixelsHigh;
      }
      renderer.draw(sample);

      const glow = Math.min(0.85, strength * 0.58 + pulse * 0.42);
      scene.style.setProperty("--wind-light-x", `${(x + gust[2] * 0.7).toFixed(1)}px`);
      scene.style.setProperty("--wind-light-y", `${(y - gust[2] * 0.28).toFixed(1)}px`);
      scene.style.setProperty("--wind-light-alpha", glow.toFixed(3));
      scene.style.setProperty("--wind-flash-alpha", (gust[3] * 0.88).toFixed(3));
      scene.classList.add("is-dissolving");
      schedule();
    }

    function release() {
      clearTimeout(tapTimer);
      target = null;
      previewAt = null;
    }

    function stop() {
      release();
      cancelAnimationFrame(frame);
      frame = 0;
      lastTime = null;
      strength = 0;
      burstAt = -Infinity;
      burstOrigin = null;
      trails?.reset();
      scene.classList.remove("is-dissolving");
    }

    function point(event) {
      if (motion.matches || event.target.closest("a, button")) return;
      interacted = true;
      previewAt = null;
      target = { x: event.clientX, y: event.clientY };
      schedule();
    }

    hero.addEventListener("pointermove", event => {
      if (event.pointerType !== "touch") point(event);
    }, { passive: true });
    hero.addEventListener("pointerleave", event => {
      if (event.pointerType !== "touch") release();
    });
    hero.addEventListener("pointerdown", event => {
      if (motion.matches || !event.isPrimary || event.target.closest("a, button")) return;
      tapStart = { id: event.pointerId, x: event.clientX, y: event.clientY };
    }, { passive: true });
    hero.addEventListener("pointerup", event => {
      if (tapStart?.id !== event.pointerId) return;
      const travel = Math.hypot(event.clientX - tapStart.x, event.clientY - tapStart.y);
      tapStart = null;
      if (travel > 12) return;
      point(event);
      const bounds = scene.getBoundingClientRect();
      burstAt = performance.now();
      burstOrigin = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
      if (event.pointerType === "touch") {
        clearTimeout(tapTimer);
        tapTimer = setTimeout(release, 2300);
      }
    }, { passive: true });
    hero.addEventListener("pointercancel", () => { tapStart = null; });
    window.addEventListener("blur", release);
    motion.addEventListener("change", stop);

    Promise.all([plain.decode(), gear.decode()]).then(() => {
      if (motion.matches) return;
      const columns = scene.clientWidth < 700 ? 200 : 288;
      const samples = samplePortrait(plain, gear, columns);
      if (!samples.length) return;
      renderer = createRenderer(samples, plain, gear);
      if (!renderer) return;
      trails = makeTrails(samples, columns < 220 ? 420 : 900);
      renderer.canvas.className = "pv-hero-particles";
      renderer.canvas.setAttribute("aria-hidden", "true");
      renderer.canvas.addEventListener("webglcontextlost", () => {
        stop();
        const fallback = document.createElement("canvas");
        fallback.className = renderer.canvas.className;
        fallback.setAttribute("aria-hidden", "true");
        renderer.canvas.replaceWith(fallback);
        const draw = makeCanvas2D(fallback, samples, plain, gear);
        renderer = draw ? { canvas: fallback, draw } : null;
        hero.classList.toggle("has-hero-reveal", Boolean(renderer));
      });
      scene.append(renderer.canvas);
      hero.classList.add("has-hero-reveal");
      if (target) schedule();
      else if (previewRequested) playPreview();
    }).catch(() => {
      // The original photo is also the fallback when its pixels are unavailable.
    });

    return playPreview;
  };
})();
