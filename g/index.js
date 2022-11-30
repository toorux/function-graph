const COLORS = [
    'steelblue',
    'red',
    '#05b378', // green
    'orange',
    '#4040e8', // purple
    'yellow',
    'brown',
    'magenta',
    'cyan'
];
const SPACE = ' ';

let el = document.getElementById("graph");
const loadingEl = document.getElementById("loading");
let tipTitle = document.getElementById("tipTitle");
let tipCoord = document.getElementById("tipCoord");
let operatePlane = document.getElementById("operatePlane");
let disableZoom = document.getElementById("disableZoom");
let hiddenTip = document.getElementById("hiddenTip");
let goToHome = document.getElementById("goToHome");
let contentsBounds = el.getBoundingClientRect();
let width = contentsBounds.width;
let height = contentsBounds.height;
let hiddenTipTimeoutId = null;

goToHome.setAttribute('href', `/${location.search}`)

const query = getQuery();
initOperatePlane();
let fnList = buildFunctionList();
let title = query['title'] || '';
const DEF_MARGIN = { left: 40, right: 20, top: title ? 40 : 20, bottom: 20 };
let option = buildOption();

let plot = functionPlot(option);

const fps = 1000 / 140;
let lastTime = 0;
let lastXDomain = plot.meta.xDomain;
let lastYDomain = plot.meta.yDomain;

function start() {
    const now = Date.now();
    let time = now - lastTime;
    if (time >= fps) {
        time = 0;
    } else if (time <= fps) {
        time = fps - time;
    }
    setTimeout(loop, time);
}

function loop() {
    plot.syncOptions();
    const xDomain = plot.options.xAxis.domain;
    const yDomain = plot.options.yAxis.domain;
    if (!checkDomain(lastXDomain, xDomain) || !checkDomain(lastYDomain, yDomain)) {
        lastXDomain = xDomain;
        lastYDomain = yDomain;
        transformAxisTickLabel(plot,'x');
        transformAxisTickLabel(plot, 'y');
    }
    //==================
    lastTime = Date.now();
    start();
}

/**
 * 构建option
 * @return {{data: *[], grid: boolean, disableZoom: boolean, plugins: ((function(*): void)|*)[], width: number, tip: {yLine: boolean, renderer: opt.tip.renderer, xLine: boolean}, title: string, target: string, height: *}}
 */
function buildOption() {
    let opt = {
        title,
        target: "#graph",
        width: width + DEF_MARGIN.left + DEF_MARGIN.right,
        height: height + DEF_MARGIN.top + DEF_MARGIN.left,
        grid: query['grid'] === 1,
        data: [],
        disableZoom: query['dz'] !== 0,
        tip: {
            xLine: false,    // dashed line parallel to y = 0
            yLine: false,    // dashed line parallel to x = 0
            renderer: function (x, y, index) {
                if (hiddenTipTimeoutId) {
                    clearTimeout(hiddenTipTimeoutId);
                }
                setTip(x,y,index);
                hiddenTipTimeoutId = setTimeout(() => {
                    clearTip();
                }, 3000);
            }
        },
        plugins: [
            function (p) {
                p.meta.margin = {left: 0, right: 0, bottom: 0, top: 0};
                transformAxisTickLabel(p,'x');
                transformAxisTickLabel(p, 'y');
                p.meta.yAxis.ticks(p.meta.yDomain[1] - p.meta.yDomain[0]);
                p.meta.xAxis.ticks(p.meta.xDomain[1] - p.meta.xDomain[0]);
            }
        ]
    };


    if (query['yDomain']) {
        opt.yAxis = opt.yAxis || {}
        opt.yAxis.domain = query['yDomain'];
    }
    if (query['xDomain']) {
        opt.xAxis = opt.xAxis || {}
        opt.xAxis.domain = query['xDomain'];
    }

    if (query['yLabel']) {
        opt.yAxis = opt.yAxis || {}
        opt.yAxis.label = query['yLabel'] + SPACE;
    }
    if (query['xLabel']) {
        opt.xAxis = opt.xAxis || {}
        opt.xAxis.label = query['xLabel'] + SPACE;
    }

    if (query['yType']) {
        opt.yAxis = opt.yAxis || {}
        opt.yAxis.type = query['yType'];
    }
    if (query['xType']) {
        opt.xAxis = opt.xAxis || {}
        opt.xAxis.type = query['xType'];
    }

    if (query['data']) {
        opt.data = query['data'];
    } else {
        for (const f of fnList) {
            opt.data.push({
                fn: f.replace(/\\/g, '').replace(/\{/g, '(').replace(/\}/, ')')
            });
        }
    }

    if (query['ats']) {
        opt.annotations = query['ats'];
    }


    return opt;
}

/**
 * 清除tip内容
 */
function clearTip() {
    tipTitle.innerText = '';
    tipCoord.innerText = '';
}

/**
 * 设置tip内容
 */
function setTip(x, y, index) {
    if (Math.abs(query.tip) === 1) return;
    tipTitle.innerText = fnList[index];
    tipCoord.innerText = `(${x.toFixed(4)}, ${y.toFixed(4)})`;
    tipTitle.style.color = COLORS[index];
    tipCoord.style.color = COLORS[index];
}

function initOperatePlane() {

    if (self != top) {
        document.body.classList.add("iframe")
    } else {
        query['gui'] = 1;
        if (query['dz'] === -1) {
            query['dz'] = 1;
        }
        if (query['tip'] === -1) {
            query['tip'] = 1;
        }
    }

    if (query['gui'] === 0) {
        operatePlane.classList.add('hidden')
    } else {
        operatePlane.classList.remove('hidden')
    }

    if (query['dz'] === 0) {
        disableZoom.removeAttribute('checked');
    } else if (query['dz'] === -1) {
        disableZoom.setAttribute("disabled", "disabled");
        disableZoom.setAttribute("checked", "checked");
    } else {
        disableZoom.setAttribute("checked", "checked");
    }

    if (query['tip'] === 1) {
        hiddenTip.setAttribute("checked", "checked");
    } else if (query['tip'] === -1) {
        hiddenTip.setAttribute("disabled", "disabled");
        hiddenTip.setAttribute("checked", "checked");
    } else {
        hiddenTip.removeAttribute('checked');
    }
    clearTip();
}

/**
 * 检查两个domain是否一样， 不一样返回false
 * @param a
 * @param b
 * @return {boolean}
 */
function checkDomain(a,b) {
    return a[0] === b[0] && a[1] === b[1];
}

/**
 * 默认function-plot的axis tick label在最左边和最下面，将其移动到0轴附近
 * @param plot
 * @param dir
 */
function transformAxisTickLabel(plot, dir) {
    if (dir !== 'x' && dir !== 'y') {
        return;
    }
    const length = dir === 'x' ? width : height;
    const mul = dir === 'x' ? 1 : -1;
    const domain = plot.options[`${dir}Axis`].domain || plot.meta[`${dir}Domain`];
    let offset = 0;
    let offsetX = 0;
    let offsetY = 0;
    if (domain[0] < 0 && domain[1] > 0) {
        const _val = 0 - domain[0];
        const _count = domain[1] - domain[0];
        offset = _val / _count * length * mul;
    }
    if (dir === 'x') {
        offsetX = offset;
    } else {
        offsetY = offset;
    }
    const els = document.querySelectorAll(`#graph .axis.${dir === 'x' ? 'y' : 'x'} .tick text`);
    for (const el of els) {
        el.setAttribute('transform', `translate(${offsetX}, ${offsetY})`);
    }
    if (dir === 'x') {
        offsetX = offset;
    } else {
        offsetY = offset - 10;
    }
    try {
        const el = document.querySelector(`#graph .axis-label.${dir === 'x' ? 'y' : 'x'}`);
        if (!el) return;
        const tran = el.getAttribute("transform") || '';
        el.setAttribute('transform', `translate(${offsetX}, ${offsetY}) ${tran}`);
    } catch (e) {
        console.debug(e)
    }
}

function setDisableZoom() {
    query['dz'] = +disableZoom.checked;
    rerender();
}

function setHiddenTip() {
    query['tip'] = +hiddenTip.checked;
    rerender();
}

function loaded() {
    el.style.opacity = 1;
    loadingEl.style.opacity = 0;
}

function loading() {
    el.style.opacity = 0;
    loadingEl.style.opacity = 1;
}

function rerender() {
    loading();
    contentsBounds = el.getBoundingClientRect();
    width = contentsBounds.width;
    height = contentsBounds.height;
    initOperatePlane();
    option = buildOption();
    plot = functionPlot(option);
    loaded();
}


document.addEventListener("DOMContentLoaded", function() {
    const resizeObserver = new ResizeObserver(() => {
        rerender();
    });
    resizeObserver.observe(document.body);
    start();
    loaded();
});

