
/**
 * 获取请求参数
 * @return {{
 *     title: string,
 *     f: string,
 *     s: string,
 *     grid: number,
 *     xDomain: number[],
 *     yDomain: number[],
 *     xLabel: string,
 *     yLabel: string,
 *     xType: string,
 *     yType: string,
 *     theme: 'auto' | 'dark' | 'light',
 *     dz: number,
 *     tip: number,
 *     gui: number,
 *     ats: [],
 *     data: [],
 * }}
 * f:       function        函数表达式，默认使用英语逗号分割，可自定义分割符
 * s:       split symbol    自定义分割符，默认英文逗号
 * dz:      disableZoom     0 允许缩放 1 不允许缩放 -1 不允许缩放且不允许更改设置 默认1
 * tip:     hiddenTip      0 显示tip 1 不显示tip -1 不显示tip且不允许更改设置 默认0
 * grid:    grid            0 不显示grid 1 显示grid 默认0
 * gui:     show gui        0 不显示gui 1 显示gui 默认1
 * ats:     annotations     https://mauriciopoppe.github.io/function-plot/#annotations
 * data:    data            官网data格式，如果data为空则使用f参数，详情见：https://mauriciopoppe.github.io/function-plot/
 */
function getQuery() {
    let search = location.search.replace(/^\?/, '');
    const query = {};
    for (const q of search.split('&')) {
        const _q = q.split('=');
        const key = _q[0];
        const val = decodeURIComponent(_q[1]);
        try {
            query[key] = JSON.parse(val);
        } catch (e) {
            query[key] = val;
        }
    }
    return query;
}


/**
 * 将请求参数中的f转换为数组存储到全局变量fnList以及option.data中
 * @return {*[]}
 */
function buildFunctionList() {
    const list = [];
    if (query['f']) {
        const fs = query['f'].split(query['s'] || ',');
        for (const f of fs) {
            if (f !== '') {
                list.push(f.trim());
            }
        }
    }
    return list;
}
