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

    //class
    var $_fn = $.fn;
    var bInit = $_fn.init;
    //还原一个无影响的smartJQ
    var smartJQ = function(selector, context) {
        return this.init(selector, context);
    };
    var bfn = Object.create($_fn);
    bfn.init = bInit;
    smartJQ.prototype = bfn;
    var $$ = function(s, e) {
        return new smartJQ(s, e);
    };

    // SmartView 的原型链对象
    // var SmartView = function(data) {
    var SmartView = function() {
        //原始数据寄存对象
        // var oData = this._data = {};
        var oData = {};

        // watch 记录数组
        this._watchs = {};

        var _this = this;

        //绑定设定数据方法
        _this.set = function(k, value) {
            //判断是否存在，不存在才设定
            if (k in this) {
                console.warn('the value has been setted');
                this[k] = value;
            } else {
                oData[k] = value;
                Object.defineProperty(_this, k, {
                    get: function() {
                        return oData[k];
                    },
                    set: function(val) {
                        // 分为私有和公用的
                        var data = {
                            // before
                            b: oData[k],
                            // after
                            a: val
                        };

                        // 触发修改数据事件
                        this.triggerHandler("_sv_c_" + k, data);

                        // 触发watch内的事件
                        var tars = this._watchs[k];
                        if (tars) {
                            tars.forEach(function(e) {
                                e(oData[k], val);
                            });
                        }

                        // 设置真实值
                        oData[k] = val;
                    }
                });
            }
        };
    };
    var SmartViewFn = SmartView.prototype = Object.create($_fn);
    $.extend(SmartViewFn, {
        // 生成实例函数
        init: function(ele) {
            // 添加元素
            var tar = Object.create(this);
            tar.push(ele);
            return tar;
        },
        // 检测数值变动
        watch: function(keyname, callback) {
            var tars = this._watchs[keyname] || (this._watchs[keyname] = []);
            tars.push(callback);
        },
        // 取消检测变动函数
        unwatch: function(keyname, callback) {
            if (keyname) {
                if (callback) {
                    var tars = this._watchs[keyname];
                    var id = tars.indexOf(callback);
                    tars.splice(id, 1);
                } else {
                    this._watchs[keyname] = [];
                }
            }
        },
        // 真实查找
        realFind: function(expr) {
            return $$(expr, this[0]);
        }
    });

    // main
    //渲染元素
    var renderEle = function(ele) {
        //判断是否渲染
        var isRender = ele.svRender;
        var tagName = ele.tagName.toLowerCase();

        //获取注册信息
        var tagdata = tagMapData[tagName];

        //确认没有渲染
        if (tagdata && !isRender) {
            // 获取childNode
            var childNodes = makearray(ele.childNodes);

            //填充元素
            ele.innerHTML = tagdata.code;

            //渲染数据对象
            // var svFnData = new SmartView(tagdata.data);
            var svFnData = new SmartView();
            ele._svData = svFnData;

            //初始化$content
            var $content = ele.querySelector('[sv-content]');
            svFnData.$content = $$($content);

            //还原元素
            childNodes.forEach(function(element) {
                $content.appendChild(element);
            });

            //初始化 sv-span 元素
            var svspans = svFnData._svspan = {};
            each(ele.querySelectorAll('sv-span'), function(i, e) {
                //替换sv-span
                var textnode = document.createTextNode("");
                e.parentNode.insertBefore(textnode, e);
                e.parentNode.removeChild(e);

                //注册文本节点
                var svkey = e.getAttribute('svkey');
                var arr = svspans[svkey] || (svspans[svkey] = []);
                arr.push(textnode);
            });

            // 初始设定空值
            // 绑定text节点
            var svEle = svFnData.init(ele);
            each(tagdata.data, function(k, v) {
                // 设定需要监听的key
                svEle.set(k);

                // 绑定值修改文本事件 和 绑定watch事件
                svEle.on('_sv_c_' + k, function(e, data) {
                    // 修正textEle
                    var textEles = svspans[k];
                    textEles && textEles.forEach(function(e) {
                        (e.textContent = data.a)
                    });
                });
            });

            // 绑定sv-module
            svEle.realFind('[sv-module]').each(function() {
                var $this = $$(this);
                var k = this.getAttribute('sv-module');

                //判断是否存在，不存在就set
                if (!(k in svEle)) {
                    svEle.set(k, "");
                }

                $this.on('input', function() {
                    svEle[k] = this.value;
                });

                //绑定相对定义值
                svEle.on('_sv_c_' + k, function(e, data) {
                    $this.val(data.a);
                });
            });

            // 获取sv-tar值
            svEle.realFind('[sv-tar]').each(function() {
                var $ele = $$(this);
                var sv_tar = $ele.attr('sv-tar');
                sv_tar && (svFnData['$' + sv_tar] = $ele);
            });

            // 设定值
            each(tagdata.data, function(k, v) {
                svEle[k] = v;
            });

            // 绑定attrs数据
            tagdata.attrs && tagdata.attrs.forEach(function(k) {
                var attrValue = ele.getAttribute(k);
                // 判断是否自定义属性，具有优先级别
                if (attrValue) {
                    if (!(k in svEle)) {
                        svEle.set(k, attrValue);
                    } else {
                        svEle[k] = attrValue;
                    }
                }

                //判断是否存在，不存在就set
                if (!(k in svEle)) {
                    svEle.set(k, "");
                    ele.setAttribute(k, "");
                } else {
                    ele.setAttribute(k, svEle[k]);
                }

                svEle.on('_sv_c_' + k, function(e, data) {
                    // 绑定属性
                    ele.setAttribute(k, data.a);
                });
            });

            //设置已渲染信息
            ele.setAttribute('sv-render', 1);
            ele.svRender = 1;

            //去除渲染前标识
            ele.removeAttribute('sv-ele');

            //执行render函数
            tagdata.render(svEle);
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

    //注册元素的方法
    var register = function(options) {
        var defaults = {
            // 模板元素
            ele: "",
            // 需要监听的属性
            attrs: [],
            //自带默认数据
            data: {},
            //每次初始化都会执行的函数
            render: ""
        };
        // 合并选项
        $.extend(defaults, options);

        //获取tag
        var tagname, code, ele;
        if (defaults.ele) {
            ele = $$(defaults.ele)[0];
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
            attrs: defaults.attrs,
            data: defaults.data,
            render: defaults.render
        };

        //获取需要渲染的元素进行渲染
        $(tagname + '[sv-ele]').each(function(i, e) {
            renderEle(e);
        });

        console.log('tagname=>', tagname);
    };

    //修正原jquery方法



    // init
    var sv = {
        // 暴露注册插件的方法
        register: register,
        //扩展插件的方法
        extend: function(options) {
            var defaults = {
                tag: "",
                //每次初始化都会执行的函数
                render: ""
            };
            // 合并选项
            $.extend(defaults, options);
        }
    };

    glo.sv = sv;
})(window, window.$);