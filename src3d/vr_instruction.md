You need to add this html somewhere in your code.

```
<div id="viewer">
        <canvas width="800" height="800"></canvas>
        <div>
                <label>Isovalue:<input id="isovalue_select" type="range" step="0.01"></label>
        </div>
</div>
<script src="dvr.js"></script>
```

To load data in, call

```
upload_data(gl, buffer, size, type, box_size)
present()
```

buffer is just ArrayBuffer
size is {level: 24, width: 512, height: 256, depth: 87}
type is 'uint8' ...
box_size is {width: 429.9776, height: 429.9776, depth: 556.8000000000001}


There may be some variable clashes with other JS files so you may want to wrap whole
dvr.js in a object.
