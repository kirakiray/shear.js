(function(glo, $) {
    "use strict";
    //base
    //主体映射tag数据
    var tagMapData = {};
    window.tagMapData = tagMapData;

    // function
    var makearray = $.makearray;
    var getType = $.type;
    var each = $.each;

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

        var _this = this;

        //设定默认数据
        each(data, function(k, v) {
            _this.define(k, {
                set: function(val) {
                    oData[k] = val;

                    //这个时候，this一般是指向初始化后的对象
                    var tar = this._svspans[k];
                    if (tar) {
                        tar.textContent = val;
                    }
                },
                get: function() {
                    return oData[k];
                }
            });
        });

        //绑定设定数据方法
        _this.set = function(k, value) {
            //判断是否存在，不存在才设定
            if (k in _this) {
                console.log('the value setted');
            } else {
                oData[k] = value;
                _this.define(k, {
                    set: function(val) {
                        oData[k] = val;
                    },
                    get: function() {
                        return oData[k];
                    }
                });
            }
        };
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
        define: function(key, option) {
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
        watch: function(keyname, callback) {},
        unwatch: function(keyname, callback) {}
    });


    var bInit = $_fn.init;

    //还原一个无影响的smartJQ
    var smartJQ = function(selector, context) {
        return this.init(selector, context);
    };
    var bfn = Object.create($_fn);
    bfn.init = bInit;
    smartJQ.prototype = bfn;

    // main
    //渲染元素
    var renderEle = function(ele) {
        //判断是否渲染
        var isRender = ele.svRender;
        var tagName = ele.tagName.toLowerCase();

        var tagdata = tagMapData[tagName];

        //确认没有渲染
        if (tagdata && !isRender) {
            // 获取childNode
            var childNodes = makearray(ele.childNodes);

            //填充元素
            ele.innerHTML = tagdata.code;

            //渲染数据对象
            var svFnData = new SmartView(tagdata.data);
            ele._svData = svFnData;

            //初始化$content
            var $content = ele.querySelector('[sv-content]');
            svFnData.$content = new smartJQ($content);

            //还原元素
            childNodes.forEach(function(element) {
                $content.appendChild(element);
            });

            //初始化 sv-span 元素
            var svspans = svFnData._svspans = {};
            each(ele.querySelectorAll('sv-span'), function(i, e) {
                //替换sv-span
                var textnode = document.createTextNode("");
                e.parentNode.insertBefore(textnode, e);
                e.parentNode.removeChild(e);

                //注册文本节点
                svspans[e.getAttribute('svkey')] = textnode;
            });

            //渲染完毕后进行一次数据设定
            var svdata = svFnData.init(ele);
            each(tagdata.data, function(k, v) {
                svdata[k] = v;
            });

            //设置已渲染信息
            ele.setAttribute('sv-render', 1);
            ele.svRender = 1;

            //执行render函数
            tagdata.render(svdata);

            //去除渲染前标识
            ele.removeAttribute('sv-ele');
        }
    };

    // 监听初始化jQuery函数，修正返回的实例对象
    // 在判断是只有一个 sv元素的时候，返回sv实例对象
    $_fn.init = function(selector, context) {
        // 继承先前的方法
        var obj = bInit.call(this, selector, context);

        // 主动渲染 sv-ele 元素
        // 并判断是否拥有sv-shadow元素，做好重新初始化工作
        var has_shadow = 0;
        var notShadowEle = [];
        obj.each(function(i, e) {
            if (e.getAttribute && e.getAttribute('sv-ele') == "") {
                renderEle(e);
            }

            //判断是否有子未渲染元素
            var subEle = e.querySelectorAll && e.querySelectorAll('[sv-ele]');
            subEle && each(subEle, function(i, e) {
                renderEle(e);
            });

            //判断当前是否拥有 sv-shadow 元素
            if (e.getAttribute('sv-shadow') == "") {
                has_shadow = 1;
            } else {
                notShadowEle.push(e);
            }
        });

        // 过滤 sv-shadow 元素
        if (has_shadow) {
            obj = $(notShadowEle);
        } else {
            notShadowEle = null;
        }

        // 判断是否sv-render元素，是的话返回一个 svRender 对象
        if (obj.length == 1 && obj[0].svRender) {
            var svdata = obj[0]._svData;
            if (svdata) {
                return svdata.init(obj[0]);
            }
        }

        return obj;
    };

    var register = function(options) {
        var defaults = {
            //模板文本
            temp: "",
            ele: "",
            // 需要监听的属性
            props: [],
            //自带默认数据
            data: {},
            //每次初始化都会执行的函数
            render: ""
        };
        // 合并选项
        $.extend(defaults, options);

        //获取tag
        var tagname, code, ele;
        if (defaults.temp) {
            debugger;
        } else if (defaults.ele) {
            ele = $(defaults.ele)[0];
            tagname = ele.tagName.toLowerCase();
            each(ele.querySelectorAll("*"), function(i, e) {
                e.setAttribute('sv-shadow', "");
            });
            code = ele.innerHTML;
        } else {
            return;
        }

        //准换自定义字符串数据
        var darr = code.match(/{{.+?}}/g);
        darr.forEach(function(e) {
            var key = /{{(.+?)}}/.exec(e);
            if (key) {
                code = code.replace(e, '<sv-span sv-shadow svkey="' + key[1] + '"></sv-span>');
            }
        });

        //注册数据
        tagMapData[tagname] = {
            code: code,
            props: defaults.props,
            data: defaults.data,
            render: defaults.render
        };

        //获取需要渲染的元素进行渲染
        // $(tagname + '[sv-ele]');
        $(tagname + '[sv-ele]').each(function(i, e) {
            renderEle(e);
        });

        console.log('tagname=>', tagname);
    };

    //修正原jquery方法
    ["append", "prepend", "before", "after"].forEach(function(e) {
        var o_fun = $_fn[e];
        $_fn[e] = function(arg) {
            //设置辅助属性ectype
            this._ec_type = e;

            //判断arg是字符串，并且拥有sv-ele，这进行初始化操作
            if (getType(arg) == "string" && arg.search(/<.+sv-ele.*>/) > -1) {
                arg = $(arg);
            }

            //继承运行
            var reobj = o_fun.call(this, arg);

            //删除辅助属性
            delete this._ec_type;
            return reobj;
        };
    });

    var o_ec = $_fn._ec;
    $_fn._ec = function(ele, targets, func) {
        //获取使用的函数名
        var ec_type = targets._ec_type || ele._ec_type;

        switch (ec_type) {
            case "append":
            case "prepend":
                // append 的话判断是否sv渲染元素，是的话替换内部对象
                o_ec.call(this, ele, targets, function(e, tar) {
                    $(e);
                    if (tar.svRender) {
                        func(e, tar._svData.$content[0]);
                    } else {
                        func(e, tar);
                    }
                });
                break;
            default:
                // 其他情况直接继承
                o_ec.call(this, ele, targets, function(e, tar) {
                    func(e, tar);
                });
        }
    };

    ["wrapInner", "wrap"].forEach(function(e) {
        var o_fun = $_fn[e];
        $_fn[e] = function(arg) {
            // 继承运行
            var reobj = o_fun.call(this, arg);

            // 初始化操作
            reobj.find('[sv-ele]');
            reobj.parent();

            return reobj;
        };
    });

    //直接替换empty方法
    $.empty = function() {
        each(this, function(i, e) {
            if (e.svRender) {
                e._svData.$content[0].innerHTML = "";
            } else {
                e.innerHTML = "";
            }
        });
        return this;
    };

    var sv = {
        register: register
    };

    // init
    glo.sv = sv;
})(window, window.$);