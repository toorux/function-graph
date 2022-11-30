const loadingEl = document.getElementById("loading")
const appEl = document.getElementById("app")
const { createApp, reactive, onMounted, watch } = Vue;
let query = getQuery();



const app = createApp({
    setup() {

        const params = reactive({
            newFn: '',
            fn: [""],
            s: ',',
            title: '',
            grid: false,
            xDomain: [0, 0],
            yDomain: [0, 0],
            xLabel: "",
            yLabel: "",
            xType: "linear",
            yType: "linear",
            dz: 1,
            tip: 0,
            gui: true,
            ats: [],
            data: [],
            url: '',
            style: '',
            shadow: true,
            shadowBlur: 10,
            width: 560,
            height: 320,
            borderRadius: 6,
        });

        const maxFn = 6;

        watch(() => params.fn, () => {
            for (let i = params.fn.length - 1; i >= 0; i--) {
                const item = params.fn[i];
                if (item == '' && (i < params.fn.length - 1 || i >= maxFn)) {
                    params.fn.splice(i, 1);
                }
            }
            if (params.fn.length < maxFn && params.fn[params.fn.length - 1] !== '') {
                params.fn.push('');
            }
            params.url = getUrl();
            params.style = buildStyle();
        }, {deep: true});

        watch(() => params, () => {
            params.style = buildStyle();
            params.url = getUrl();
        }, {deep: true});

        const booleanKey = ['gui', 'grid'];
        let queryToParams = () => {
            for (const key in query) {
                if (booleanKey.includes(key)) {
                    params[key] = !!query[key];
                } else {
                    params[key] = query[key];
                }
                if (key === 'f') {
                    params.fn = buildFunctionList(query[key]);
                }
            }
        }

        let paramsToQuery = () => {
            query = {};
            let fn = [...params.fn];
            if (fn[fn.length - 1] === '') {
                fn.splice(fn.length - 1, 1);
            }
            query['f'] = params.fn.join(params.s || ',');
            query['gui'] = +params.gui;
            query['grid'] = +params.grid;
            query['tip'] = +params.tip;
            query['dz'] = +params.dz;
        }

        let getUrl = () => {
            paramsToQuery();
            let search = `?f=${encodeURIComponent(query['f'])}`;
            for (const key in query) {
                if (key === 'f') continue;
                search += `&${key}=${encodeURIComponent(query[key])}`;
            }
            return `${location.origin}/g/${search}`;
        }

        let buildStyle = () => {
            let style = `width: ${params.width}px; height: ${params.height}px;margin: 0 auto;border-radius: ${params.borderRadius}px;`;
            if (params.shadow) {
                style += `box-shadow: 0 0 ${params.shadowBlur}px 1px rgba(0,0,0,0.2);`;
            }
            return style;
        }

        let renderKaTeX = (str) => {
            return katex.renderToString(str, { displayMode: true })
        }

        queryToParams();
        console.log(params)



        return {
            params,
            renderKaTeX,
        }
    }
});

app.use(ElementPlus);

function katexLoaded() {
    appEl.style.display = 'block';
    loadingEl.style.opacity = 0;
    app.mount('#app');
    setTimeout(() => {
        loadingEl.style.display = 'none';
    }, 400);
}



document.addEventListener("DOMContentLoaded", function() {
    katexLoaded();
});
