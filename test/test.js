(function($, glo) {
    //init
    //添加默认样式
    var style = 'sv-span{display:inline;}';
    $('head').append('<style>' + style + '</style>');

    //data
    //注册的标签数据
    var customTagData = {};
    //注册的标签数组
    var customTag = [];

    //function
    var makearray = $.makearray;
    var getType = $.type;
    //添加tag数据
    var addTag = function(tag, tagdata) {
        //设置元素映射
        customTagData[tag] = {
            code: $(tagdata).html()
        };
    };

    //根据tag获取数据
    var getTagData = function(tag) {
        return customTagData[tag];
    };

    //渲染元素的方法
    var renderEle = function(tagName, ele) {
        var $e = $(ele);

        //判断是否渲染
        var isRender = ele.svRender;

        //查找库和渲染文本
        var tagdata = getTagData(tagName);

        //没有渲染，则进行渲染
        if (!isRender) {
            // 获取childNode
            var childNodes = makearray(ele.childNodes);

            //填充元素
            $e.html(tagdata.code);

            //还原元素
            childNodes.forEach(function(element) {
                $e.find('[sv-content]').append(element);
            });

            //设置已渲染信息
            // $e.data('svRender', 1);
            $e.attr('sv-render', 1);
            ele.svRender = 1;

            //去除渲染前标识
            $e.removeAttr('sv-ele');
        }
    };

    //main
    var smartView = {};

    //注册模块的方法
    smartView.register = function(options) {
        var defaults = {
            temp: ""
        };
        $.extend(defaults, options);

        if (defaults.temp) {
            //获取tagName
            var tagName = $(defaults.temp)[0].tagName.toLowerCase();

            //添加到注册队列
            addTag(tagName, defaults.temp);

            //查找现在已存在的元素，进行渲染
            $('body ' + tagName + "[sv-ele]").each(function(i, ele) {
                renderEle(tagName, ele);
            });
        }
    };

    // SmartView 的原型链对象
    var SmartView = function(registID) {
        this._data = {};
        this._registID = registID;
    };
    var SmartViewFn = SmartView.prototype = Object.create($.fn);
    $.extend(SmartViewFn, {
        // 生成实例函数
        init: function(ele) {
            //添加元素
            var tar = Object.create(this);
            tar.push(ele);
            return tar;
        },
        //设置属性的方法
        compute: function(obj) {
            var _this = this;
            if (getType(obj) == "object") {
                $.each(obj, function(k, v) {
                    var vType = getType(v);
                    switch (vType) {
                        case "function":
                            Object.defineProperty(_this, k, {
                                get: v
                            });
                            break;
                        case "object":
                            if (v.set || v.get) {
                                Object.defineProperty(_this, k, {
                                    set: v.set,
                                    get: v.get
                                });
                            }
                            break;
                    }
                });
            }
        }
    });

    //数据视图查看的方法
    smartView.view = function(options) {
        var defaults = {
            // ele: "",
            data: {},
            // ready: ""
        };
        $.extend(defaults, options);

        //获取元素
        var $ele = $(defaults.ele);

        //唯一id
        var registID = ("svid_" + Math.random() * 1000).replace('.', "_");

        //判断并替换{{data}}
        var elehtml = $ele.html();

        //查找{{data}}
        var darr = elehtml.match(/{{.+?}}/g);
        darr.forEach(function(e) {
            var key = /{{(.+?)}}/.exec(e);
            if (key) {
                elehtml = elehtml.replace(e, '<sv-span svkey="' + key[1] + '" forsvid="' + registID + '"></sv-span>');
            }
        });

        //还原回去
        $ele.html(elehtml);

        //主要数据寄存对象
        var svData = new SmartView(registID);

        // 实例生成
        var tar = svData.init($ele[0]);

        //设置寄存主要对象
        $ele.data('svData', svData);

        //还原数据
        $.each(defaults.data, function(k, v) {
            var obj = {};
            obj[k] = {
                get: function() {
                    return this._data[k];
                },
                set: function(v) {
                    this._data[k] = v;
                    //判断正文内是否有设定数据
                    this.find('sv-span[svkey="' + k + '"]').text(v);
                }
            };
            svData.compute(obj);
        });

        //设置数据
        $.each(defaults.data, function(k, v) {
            //设置内容
            tar[k] = v;
        });

        //设置渲染信息
        $ele.attr('sv-render', 1);
        $ele[0].svRender = 1;

        return tar;
    };

    glo.sv = smartView;
})(window.$, window);