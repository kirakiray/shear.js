(function(glo, $) {
    "use strict";
    //base
    //主体映射tag数据
    var tagMapData = {};
    window.tagMapData = tagMapData;

    // function
    var makearray = $.makearray;
    var getType = $.type;

    //转换字符串到html对象
    var transToEles = function(str) {
        var par = document.createElement('div');
        par.innerHTML = str;
        var ch = makearray(par.children);
        par.innerHTML = "";
        return ch;
    };

    //class
    // SmartView 的原型链对象
    var SmartView = function(data) {
        //原始数据寄存对象
        var oData = this._data = {};

        //唯一id
        var registID = this.rid = ("svid_" + Math.random() * 1000).replace('.', "_");

        var _this = this;
        $.each(data, function(k, v) {
            _this.defineData(k, {
                set: function(val) {
                    oData[k] = val;

                    //这个时候，this一般是指向初始化后的对象
                    this.find('sv-span[svkey="' + k + '"][svforid="' + registID + '"]').text(val);
                },
                get: function() {
                    return oData[k];
                }
            });
        });
    };
    var $_fn = $.fn;
    var SmartViewFn = SmartView.prototype = Object.create($_fn);
    $.extend(SmartViewFn, {
        // 生成实例函数
        init: function(ele) {
            //添加元素
            var tar = Object.create(this);
            tar.push(ele);
            return tar;
        },
        defineData: function(key, option) {
            var oType = getType(option);
            switch (oType) {
                case "function":
                    Object.defineProperty(this, key, {
                        get: option
                    });
                    break;
                case "object":
                    Object.defineProperty(this, key, {
                        get: option.get,
                        set: option.set
                    });
                    break;
            }
        },
        //检测数值变动
        watch: function(keyname, callback) {}
    });

    // main
    //渲染元素
    var renderEle = function(ele) {
        //判断是否渲染
        var isRender = ele.svRender;
        var tagName = ele.tagName.toLowerCase();
        // var $e = $(ele);

        var tagdata = tagMapData[tagName];

        //确认没有渲染
        if (!isRender) {
            // 获取childNode
            var childNodes = makearray(ele.childNodes);

            //填充元素
            ele.innerHTML = tagdata.code;
            // $e.html(tagdata.code);

            //渲染数据对象
            var svFnData = new SmartView(tagdata.data);
            // $e.data('svData', svFnData);
            ele._svData = svFnData;

            //还原元素，并设置id
            childNodes.forEach(function(element) {
                // var content_ele = $e.find('[sv-content]').attr('svforid', svFnData.rid);
                // content_ele[0].appendChild(element);
                var con_ele = ele.querySelector('[sv-content]')
                con_ele.setAttribute('svforid', svFnData.rid);
                con_ele.appendChild(element);
            });

            //sv-span 添加id
            // $e.find('sv-span').attr('svforid', svFnData.rid);
            ele.querySelector('sv-span').setAttribute('svforid', svFnData.rid);

            //渲染完毕后进行一次数据设定
            var svdata = svFnData.init(ele);
            $.each(tagdata.data, function(k, v) {
                svdata[k] = v;
            });

            //设置已渲染信息
            // $e.attr('sv-render', 1);
            ele.setAttribute('sv-render', 1);
            ele.svRender = 1;

            //去除渲染前标识
            // $e.removeAttr('sv-ele');
            ele.removeAttribute('sv-ele');
        }
    };

    var register = function(options) {
        var defaults = {
            //模板文本
            temp: "",
            // 需要监听的属性
            props: [],
            //自带默认数据
            data: {},
            //每次初始化都会执行的函数
            ready: ""
        };
        // 合并选项
        $.extend(defaults, options);

        //获取tag
        var tagname, code;
        if (defaults.temp) {
            tagname = $(defaults.temp)[0].tagName.toLowerCase();
            code = defaults.temp;
        } else if (defaults.ele) {
            tagname = $(defaults.ele)[0].tagName.toLowerCase();
            code = defaults.ele.clone().removeAttr('id').html();
        } else {
            return;
        }

        //准换自定义字符串数据
        var darr = code.match(/{{.+?}}/g);
        darr.forEach(function(e) {
            var key = /{{(.+?)}}/.exec(e);
            if (key) {
                code = code.replace(e, '<sv-span svkey="' + key[1] + '"></sv-span>');
            }
        });

        //注册数据
        tagMapData[tagname] = {
            code: code,
            props: defaults.props,
            data: defaults.data,
            ready: defaults.ready
        };

        //获取需要渲染的元素进行渲染
        // $(tagname + '[sv-ele]');
        $(tagname + '[sv-ele]').each(function(i, e) {
            renderEle(e);
        });

        console.log('tagname=>', tagname);
    };

    // 监听初始化jQuery函数，修正返回的实例对象
    // 在判断是只有一个 sv元素的时候，返回sv实例对象
    var bInit = $.fn.init;
    $.fn.init = function(selector, context) {
        //判断是字符串类型，并没有渲染的sv-ele，就执行渲染操作
        // if (getType(selector) == "string" && selector.search(/<.+sv-ele.*>/) > -1) {
        //     selector = $(transToEles(selector));
        //     if (nEle.attr('sv-ele') == "") {
        //         renderEle(nEle[0]);
        //     } else {
        //         nEle.find('[sv-ele]').each(function(i, e) {
        //             renderEle(e);
        //         });
        //     }
        //     selector = nEle;
        // } else if (selector.getAttribute && selector.getAttribute('sv-ele') == "") {
        //     debugger;
        // }

        // 继承先前的方法
        var obj = bInit.call(this, selector, context);

        //判断类型并渲染
        obj.each(function(i, e) {
            if (e.getAttribute && e.getAttribute('sv-ele') == "") {
                renderEle(e);
            }

            //判断是否有子元素
            var subEle = e.querySelectorAll && e.querySelectorAll('[sv-ele]');
            subEle && $.each(subEle, function(i, e) {
                renderEle(e);
            });
        });

        // 判断是否sv-render元素
        if (obj.length == 1 && obj[0].svRender) {
            var svdata = obj[0]._svData;
            if (svdata) {
                return svdata.init(obj[0]);
            }
        }

        return obj;
    };

    //修正原jquery方法
    // var reArr = ['append'];
    // reArr.forEach(function(e) {
    //     //判断$_fn是否拥有
    //     if ($_fn[e]) {
    //         $_fn[e] = function() {
    //             debugger;
    //         }
    //     }
    // });
    var o_ec = $.fn._ec;
    $.fn._ec = function(ele, targets, func) {
        o_ec.call($.fn, ele, targets, function(e, tar) {
            $(e);
            if (tar.svRender) {
                debugger;
            } else {
                func(e, tar);
            }
        });
    };

    var sv = {
        register: register
    };

    // init
    glo.sv = sv;
})(window, window.$);